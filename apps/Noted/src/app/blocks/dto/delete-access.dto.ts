import { DeleteAccessRequest } from "@noted/types";
import { IsNotEmpty, IsString } from "class-validator";
export class DeleteAccessDto implements DeleteAccessRequest {
  @IsString()
  @IsNotEmpty()
  accessId: string;
}
