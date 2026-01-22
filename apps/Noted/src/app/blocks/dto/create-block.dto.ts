import { BlockMeta, CreateBlockRequest } from "@noted/types";
import { IsEnum, IsNotEmpty, IsNumber, IsObject, IsOptional, IsString } from "class-validator";
import { BlockType } from "generated/prisma/enums";

export class CreateBlockDto implements CreateBlockRequest {
  @IsNotEmpty()
  @IsEnum(BlockType)
  blockType: BlockType;
  @IsObject()
  meta: BlockMeta;
  @IsString()
  @IsOptional()
  parentId?: string;
  @IsString()
  @IsOptional()
  pageId?: string;
  @IsNumber()
  @IsOptional()
  order?: number;
}
