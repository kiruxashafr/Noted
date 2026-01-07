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
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
      });
      if (!user) throw new ApiException(ErrorCodes.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
      if (dto.name && dto.name !== user.name) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { name: dto.name },
        });
      }
      if (dto.email && dto.email !== user.email) {
        await this.prisma.user.update({
          where: { id: userId },
          data: { email: dto.email },
        });
      }
      if (dto.password) {
        const hashPassword = await argon2.hash(dto.password);
        await this.prisma.user.update({
          where: { id: userId },
          data: { password: hashPassword },
        });
      }

      const updatedUser = await this.prisma.user.findUnique({
        where: { id: userId },
      });

      return toDto(updatedUser, ReadUserDto);
    } catch (error: unknown) {
      this.logger.error(`error in ${(error as Error).message}`, (error as Error).stack);
      if (error instanceof ApiException) {
        throw error;
      }
      throw new ApiException(ErrorCodes.FAILED_TO_CREATE_ACCOUNT, HttpStatus.BAD_REQUEST);
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
}
