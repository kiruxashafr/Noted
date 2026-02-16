import { BlockMeta, CreateBlockRequest } from "@noted/types";
import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from "class-validator";
import { BlockType } from "generated/prisma/enums";

export class CreateBlockDto implements CreateBlockRequest {
  @IsNotEmpty()
  @IsEnum(BlockType)
  blockType: BlockType;
  @IsObject()
  meta: BlockMeta;
  @IsNumber()
  @IsOptional()
  order: number;
  @IsString()
  @IsOptional()
  parentId?: string;
}
