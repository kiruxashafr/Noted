import { IsNotEmpty, IsString } from "class-validator";
export class DeleteBlockDto {
  @IsString()
  @IsNotEmpty()
  blockId: string;
}
