import { IsNotEmpty, IsString } from "class-validator";
export class GetTopBlocksDto {
  @IsString()
  @IsNotEmpty()
  pageId: string;
}

export class GetChildBlocksDto {
  @IsString()
  @IsNotEmpty()
  blockId: string;
}
