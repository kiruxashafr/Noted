import { BlockMeta } from "@noted/types";
import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from "class-validator";
import { BlockType } from "generated/prisma/enums";

export class UpadateBlockDto {
  @IsString()
  @IsNotEmpty()
  blockId: string;
  @IsNotEmpty()
  @IsEnum(BlockType)
  blockType: BlockType;
  @IsObject()
  meta: BlockMeta;
  @IsNumber()
  @IsOptional()
  order?: number;
}
