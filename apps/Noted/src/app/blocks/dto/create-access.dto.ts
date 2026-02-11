import { Type } from "class-transformer";
import { IsDate, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
import { BlockPermission } from "generated/prisma/enums";
export class CreateAccessDto {
  @IsString()
  @IsNotEmpty()
  granteeId: string;

  @IsString()
  @IsNotEmpty()
  blockId: string;

  @IsEnum(BlockPermission)
  @IsNotEmpty()
  permission: BlockPermission;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  expiresAt?: Date | null;
}
