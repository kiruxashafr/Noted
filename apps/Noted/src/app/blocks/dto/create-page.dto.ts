import { BlockMeta, CreatePageRequest } from "@noted/types";
import { IsNumber, IsObject, IsOptional, IsString } from "class-validator";


export class CreatePageDto implements CreatePageRequest {
  @IsObject()
  meta: BlockMeta;
  @IsString()
  @IsOptional()
  title: string;
  @IsNumber()
  @IsOptional()
  order: number;
}
