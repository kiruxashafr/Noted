import { Expose } from "class-transformer";
import { FileAccess } from "generated/prisma/enums";

export class ReadFileDto {
  @Expose()
  id!: string;

  @Expose()
  url!: string;

  @Expose()
  originalName!: string;

  @Expose()
  mimeType!: string;

  @Expose()
  access!: FileAccess;

  @Expose()
  size!: number;

  @Expose()
  key!: string;

  @Expose()
  ownerId!: string;

  @Expose()
  createdAt!: Date;
}
