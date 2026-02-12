import { DeleteBlockRequest } from "@noted/types";
import { IsNotEmpty, IsString } from "class-validator";
export class DeleteBlockDto implements DeleteBlockRequest {
  @IsString()
  @IsNotEmpty()
  blockId: string;
}
