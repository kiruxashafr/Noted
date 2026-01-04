import { Expose } from "class-transformer";

export class UploadAvatarDto {
  @Expose()
  userId: string;

  @Expose()
  file: Express.Multer.File;
}
