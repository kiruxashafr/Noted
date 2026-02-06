import { IsNotEmpty, IsString } from "class-validator";
export class GetPageTopBlocks {
  @IsString()
  @IsNotEmpty()
  pageId: string;
}
