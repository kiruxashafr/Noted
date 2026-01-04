// src/users/users.service.ts
import { HttpStatus, Injectable, Logger } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { FilesService } from "../files/files.service";
import { ApiException } from "@noted/common/errors/api-exception";
import { ErrorCodes } from "@noted/common/errors/error-codes.const";
import { UploadAvatarDto } from "./dto/upload-avatar.dto";
import { toDto } from "@noted/common/utils/to-dto";
import { ReadUploadAvatarDto } from "./dto/read-upload-avatar.dto";

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  constructor(
    private readonly prisma: PrismaService,

    private readonly filesService: FilesService,
  ) {}

  async uploadAvatar(dto: UploadAvatarDto): Promise<ReadUploadAvatarDto> {
    const { userId, file } = dto;
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiException(ErrorCodes.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    if (user.avatarUrl) {
      try {
        await this.filesService.deleteFile(user.avatarUrl);
      } catch (error) {
        if (error instanceof ApiException && error.getStatus() === HttpStatus.NOT_FOUND) {
          this.logger.warn(
            `Avatar file ${user.avatarUrl} not found in MinIO for user ${userId}, ` + `but continuing upload process`,
          );
        } else {
          this.logger.error(`Error deleting old avatar for user ${userId}:`, error.message || error);
        }
      }
    }

    const uploadResult = await this.filesService.uploadPhoto(userId, file);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: uploadResult.filePath,
      },
    });

    const updateData = {
      userId: updatedUser.id,
      avatarUrl: updatedUser.avatarUrl,
      originalName: file.originalname,
      size: file.size,
    };

    return toDto(updateData, ReadUploadAvatarDto);
  }
}
