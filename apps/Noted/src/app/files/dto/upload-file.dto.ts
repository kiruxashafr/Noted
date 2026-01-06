import { IsEnum, IsOptional } from "class-validator";
import { FileAccess } from "generated/prisma/enums";

export class UploadFileDto {
 @IsOptional()
  @IsEnum(FileAccess)
  access?: FileAccess = FileAccess.PRIVATE;
}
