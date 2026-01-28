import { Expose } from "class-transformer";

export class ReadUploadAvatarDto {
  @Expose()
  userId: string;

  @Expose()
  buffer: Buffer;

  @Expose()
  newName: string;

  @Expose()
  mimeType: string;
}
