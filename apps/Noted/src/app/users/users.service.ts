import { HttpStatus, Injectable, Logger} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FilesService } from "../files/files.service";
import { ApiException } from "@noted/common/errors/api-exception";
import { ErrorCodes } from "@noted/common/errors/error-codes.const";
import { toDto } from "@noted/common/utils/to-dto";
import * as argon2 from "argon2";
import { ReadUserDto } from "./dto/read-user.dto";
import { UpdateUserDto } from "./dto/user-update.dto";
import { FileAccess } from "generated/prisma/enums";
import { isPrismaConstraintError } from "@noted/common/db/prisma-error.utils";
import { PrismaErrorCode } from "@noted/common/db/database-error-codes";
import { UploadAvatarDto } from "./dto/upload-avatar.dto";
import { ReadUploadAvatarDto } from "./dto/read-upload-avatar.dto";
import { AvatarConversionResult } from "../photo-queue/interface/avatar-conversion-result.interface";
import {  OnEvent } from "@nestjs/event-emitter";
import { AvatarConversionFailedEvent, AvatarEvent } from "../shared/events/types";
import { PhotoQueueService } from "../photo-queue/photo-queue.service";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
    private readonly queueService: PhotoQueueService
  ) {}

  async updateAvatar(file: { buffer: Buffer; originalname: string; mimetype: string; size: number }, userId: string) {
    const savedFile = await this.filesService.uploadFile(userId, FileAccess.PUBLIC, file)
    if (file.mimetype == "image/jpeg") {
      await this.queueService.sendToResizeConvert(savedFile.id, userId, FileAccess.PUBLIC)
    }
    if (file.mimetype == "image/heic" || file.mimetype == "image/heif") {
      await this.queueService.sendToHeicConvert(savedFile.id, userId, FileAccess.PUBLIC)
    } else {
      const uploadData = { userId, buffer: file.buffer, newName: file.originalname, mimeType: file.mimetype };
      this.uploadAvatar(toDto(uploadData, ReadUploadAvatarDto));
    }
  }


  @OnEvent(AvatarEvent.AVATAR_CONVERTED)
  async handleAvatarConverted(event: AvatarConversionResult) {
    try {
      await this.prisma.user.update({
        where: { id: event.userId },
        data: { avatarFileId: event.newFileId }
      })
    }
    catch (error) {
      this.logger.error(`Avatar processing error for user ${event.userId}:`, error);
    }
  }

  @OnEvent(AvatarEvent.AVATAR_CONVERSION_FAILED)
  async handleAvatarConversionFail(event: AvatarConversionFailedEvent) {
    throw new this.logger.error(`heic convert fail for user ${event.userId}`)
    }

  private async uploadAvatar(dto: UploadAvatarDto) {
    const { userId, buffer, newName, mimeType } = dto;
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new ApiException(ErrorCodes.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
      }

      const fileData = {
        buffer: buffer,
        originalname: newName,
        mimetype: mimeType,
        size: buffer.length,
      };

      const uploadResult = await this.filesService.uploadFile(userId, FileAccess.PUBLIC, fileData);

      try {
        await this.filesService.deleteFile(user.avatarFileId, userId);
      } catch (error) {
        this.logger.warn(`user ${userId}avatar delete failed ${error}`);
      }

      await this.prisma.user.update({
        where: { id: userId },
        data: {
          avatarFileId: uploadResult.id,
        },
      });

      this.logger.log(`✅ Avatar updated for user ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to update avatar for user ${userId}:`, error.message);
    }
  }

  async updateUser(userId: string, dto: UpdateUserDto) {
    try {
      const updateData: UpdateUserDto = {};

      if (dto.name) {
        updateData.name = dto.name;
      }
      if (dto.email) {
        updateData.email = dto.email;
      }
      if (dto.password) {
        updateData.password = await argon2.hash(dto.password);
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
      });

      return toDto(updatedUser, ReadUserDto);
    } catch (error) {
      this.handleAccountConstraintError(error);
    }
  }

  async deleteUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiException(ErrorCodes.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const result = await this.filesService.deleteAllUserFiles(userId);
    if (result.deletedCount === 0) {
      this.logger.log("User had no files to delete");
    }
    await this.prisma.user.delete({
      where: {
        id: userId,
      },
    });
  }

  private handleAccountConstraintError(error: unknown): never {
    if (!isPrismaConstraintError(error)) {
      throw new ApiException(ErrorCodes.REGISTRATION_FAILED, HttpStatus.INTERNAL_SERVER_ERROR);
    }

    if (error.code === PrismaErrorCode.UNIQUE_CONSTRAINT_FAILED && error.meta?.modelName === "User") {
      throw new ApiException(ErrorCodes.EMAIL_ALREADY_EXISTS, HttpStatus.CONFLICT);
    }

    throw new ApiException(ErrorCodes.DUPLICATE_VALUE, HttpStatus.CONFLICT);
  }
}
