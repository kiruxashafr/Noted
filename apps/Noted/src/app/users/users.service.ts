// src/users/users.service.ts
import { HttpStatus, Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { FilesService } from "../files/files.service";
import { ApiException } from "@noted/common/errors/api-exception";
import { ErrorCodes } from "@noted/common/errors/error-codes.const";

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly filesService: FilesService,
  ) {}

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiException(ErrorCodes.USER_NOT_FOUND, HttpStatus.NOT_FOUND);
    }

    const uploadResult = await this.filesService.uploadPhoto(userId, file);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: uploadResult.filePath,
      },
    });

    return {
      userId: updatedUser.id,
      avatarUrl: updatedUser.avatarUrl,
      originalName: file.originalname,
      size: file.size,
    };
  }
}
