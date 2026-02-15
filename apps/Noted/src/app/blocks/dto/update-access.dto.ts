import { Type } from "class-transformer";
import { IsBoolean, IsDate, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { BlockPermission } from "generated/prisma/enums";
export class UpdateAccessDto {
  @IsString()
  @IsNotEmpty()
  accessId: string;

  @IsEnum(BlockPermission)
  @IsOptional()
  permission?: BlockPermission;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expiresAt?: Date | null;
}
