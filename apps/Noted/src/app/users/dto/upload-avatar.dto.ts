// src/users/dto/upload-avatar.dto.ts
import { ApiProperty } from "@nestjs/swagger";

export class UploadAvatarResponseDto {
  @ApiProperty({ description: "ID пользователя" })
  userId: string;

  @ApiProperty({ description: "URL загруженного аватара" })
  avatarUrl: string;

  @ApiProperty({ description: "Оригинальное имя файла" })
  originalName: string;

  @ApiProperty({ description: "Размер файла в байтах" })
  size: number;
}
