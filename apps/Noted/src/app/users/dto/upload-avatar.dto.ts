import { IsString, IsNotEmpty } from "class-validator";

export class UploadAvatarDto {
  userId: string;
  buffer: Buffer;
  newName: string;
  mimeType: string;
}

export class UploadAvatarPhotoDto {
  @IsString()
  @IsNotEmpty()
  socketId: string;
}
