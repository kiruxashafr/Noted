import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { FilesService } from "../files/files.service";
import { ApiException } from "@noted/common/errors/api-exception";
import { ErrorCodes } from "@noted/common/errors/error-codes.const";
import { toDto } from "@noted/common/utils/to-dto";
import { ReadUploadAvatarDto } from "./dto/read-upload-avatar.dto";
import * as argon2 from "argon2";
import { ReadUserDto } from "./dto/read-user.dto";
import { UpdateUserDto } from "./dto/user-update.dto";
import { FileAccess } from "generated/prisma/enums";
import { isPrismaConstraintError } from "@noted/common/db/prisma-error.utils";
import { PrismaErrorCode } from "@noted/common/db/database-error-codes";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    private readonly prisma: PrismaService,

    private readonly filesService: FilesService,
  ) {}

  async uploadAvatar(
    file: { buffer: Buffer; originalname: string; mimetype: string; size: number },
    userId: string,
  ): Promise<ReadUploadAvatarDto> {
    const access = FileAccess.PUBLIC;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiException(ErrorCodes.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (user.avatarFileId) {
      try {
        await this.filesService.deleteFile(user.avatarFileId, userId);
      } catch (error) {
        if (error instanceof ApiException && error.getStatus() === HttpStatus.NOT_FOUND) {
          this.logger.warn(
            `Avatar file ${user.avatarFileId} not found in MinIO for user ${userId}, ` +
              `but continuing upload process`,
          );
        } else {
          this.logger.error(`Error deleting old avatar for user ${userId}:`, error.message || error);
        }
      }
    }

    const uploadResult = await this.filesService.uploadFile(userId, access, file);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarFileId: uploadResult.id,
      },
    });

    const updateData = {
      userId: updatedUser.id,
      avatarUrl: uploadResult.url,
      originalName: file.originalname,
      size: file.size,
    };

    return toDto(updateData, ReadUploadAvatarDto);
  }

  async updateUser(userId: string, dto: UpdateUserDto) {
    try {
      const updateData: UpdateUserDto = {};

      if (dto.name ) {
        updateData.name = dto.name;
      }
      if (dto.email) {
        updateData.email= dto.email
      }
      if (dto.password) {
        updateData.password = await argon2.hash(dto.password)
      }

      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: updateData
      })

      return toDto(updatedUser, ReadUserDto);
    } catch (error) {
      this.handleAccountConstraintError(error)
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
    if (result.deletedCount == 0) {
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
