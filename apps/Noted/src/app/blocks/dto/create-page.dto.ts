import { CreatePageRequest } from "@noted/types";
import { IsNotEmpty, IsOptional, IsString } from "class-validator";

export class CreatePageDto implements CreatePageRequest {
  @IsNotEmpty()
  @IsString()
  title: string;
  @IsOptional()
  order: number;
}
