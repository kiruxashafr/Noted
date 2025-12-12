import { IsString } from "class-validator";

export class ReadTokenDto {
  @IsString({ message: "Токен должен быть строкой" })
  accessToken: string;

  @IsString({ message: "Токен должен быть строкой" })
  refreshToken: string;
}
