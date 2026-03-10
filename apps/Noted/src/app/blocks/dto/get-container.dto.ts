import { IsNotEmpty, IsString } from "class-validator";
export class GetContainerDto {
  @IsString()
  @IsNotEmpty()
  containerId: string;
}


