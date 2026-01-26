import { HttpStatus, Injectable, Logger } from "@nestjs/common";
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
import { OnEvent } from "@nestjs/event-emitter";
import { PhotoConversionFailedEvent, PhotoConvertedEvent, PhotoEvent } from "../shared/events/photo-event.types";
import { PhotoQueueService } from "../photo-queue/photo-queue.service";

import { PhotoJobData } from "../photo-queue/interface/photo-job-data.interface";
import { PHOTO_PROFILES } from "../shared/photo-profiles";
import { UserAvatar, UserAvatarKeys } from "@noted/types";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly filesService: FilesService,
    private readonly queueService: PhotoQueueService,
  ) {}

  async updateAvatar(
    file: { buffer: Buffer; originalName: string; mimeType: string; size: number },
    userId: string,
    socketId,
  ) {
    try {
      const savedFile = await this.filesService.uploadFile(userId, FileAccess.PUBLIC, file);
      this.logger.log(
        `updateAvatar() | Original avatar uploaded for user ${userId} with the new file ${savedFile.id}, mimetype: ${file.mimeType}, size: ${file.size}`,
      );

      const data: PhotoJobData = {
        fileId: savedFile.id,
        userId: userId,
        access: FileAccess.PUBLIC,
        profile: PHOTO_PROFILES.AVATAR_MINI,
        socketId: socketId,
      };
      this.queueService.sendToPhotoEditor(data);
    } catch (error) {
      this.logger.error(`updateAvatar() | Failed to update avatar: ${error.message}`, error.stack);
      throw error;
    }
  }

  @OnEvent(PhotoEvent.PHOTO_CONVERTED)
  async handleAvatarConverted(event: PhotoConvertedEvent) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: event.userId },
        select: { avatars: true },
      });

      const currentAvatars: UserAvatar = (user?.avatars as object) || {};

      await this.filesService.deleteFile(currentAvatars.mini_avatar, event.userId);
      await this.filesService.deleteFile(currentAvatars.original, event.userId);
      
      const updatedAvatar = {
        ...currentAvatars,
        [UserAvatarKeys.ORIGINAL]: event.originalFileId,
        [UserAvatarKeys.MINI_AVATAR]: event.newFileId,
      };
      await this.prisma.user.update({
        where: { id: event.userId },
        data: {
          avatars: updatedAvatar,
        },
      });

      this.logger.log(
        `handleAvatarConverted() | Edited avatar updated for user ${event.userId} with new file ${event.newFileId}`,
      );
    } catch (error) {
      this.logger.error(`handleAvatarConverted() | Avatar processing error for user ${event.userId}:`, error);
    }
  }

  @OnEvent(PhotoEvent.PHOTO_CONVERSION_FAILED)
  async handleAvatarConversionFail(event: PhotoConversionFailedEvent) {
    this.logger.error(`handleAvatarConversionFail() | heic convert fail for user ${event.userId}`);
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
      this.logger.log(`updateUser | User ${userId} update profile`);
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
      this.logger.log("deleteUser() | User had no files to delete");
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
