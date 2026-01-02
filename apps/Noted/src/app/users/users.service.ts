// src/users/users.service.ts
import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { PrismaService } from "../prisma.service";
import { FilesService } from "../files/files.service";

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
      throw new NotFoundException("Пользователь не найден");
    }

    // 2. Загружаем файл в MinIO
    // const uploadResult = await this.minioService.uploadUserPhoto(userId, file);
    const uploadResult = await this.filesService.uploadPhoto(userId, file);
    // 3. Сохраняем URL аватара в БД
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: uploadResult.filePath,
      },
    });

    // 4. Удаляем старый аватар, если он был
    if (user.avatarUrl) {
      try {
        // Можно добавить логику удаления старого файла из MinIO
        // await this.minioService.deleteOldAvatar(user.avatarUrl);
      } catch (error) {
        // Игнорируем ошибку удаления старого файла
        console.warn("Не удалось удалить старый аватар:", error);
      }
    }

    return {
      userId: updatedUser.id,
      avatarUrl: updatedUser.avatarUrl,
      originalName: file.originalname,
      size: file.size,
    };
  }

  /**
   * Получает информацию о пользователе с аватаром
   */
  async getUserWithAvatar(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException("Пользователь не найден");
    }

    return user;
  }

  /**
   * Удаляет аватар пользователя
   */
  async removeAvatar(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException("Пользователь не найден");
    }

    if (!user.avatarUrl) {
      throw new BadRequestException("У пользователя нет аватара");
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: null,
      },
    });

    // Можно добавить удаление файла из MinIO
    // await this.minioService.deleteAvatar(user.avatarUrl);

    return {
      message: "Аватар удален",
      userId: updatedUser.id,
    };
  }
}
