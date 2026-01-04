import { Expose } from "class-transformer";

export class ReadUploadAvatarDto {
  @Expose()
  userId: string;

  @Expose()
  avatarUrl: string;

  @Expose()
  originalName: string;

  @Expose()
  size: number;
}
