import { IsNotEmpty, MaxLength, IsString, IsEmail, MinLength } from "class-validator";
import { LoginPayload } from "@noted/types/auth/login.types";

export class LoginDto implements LoginPayload {
  @IsString({ message: "Email должен быть строкой" })
  @IsNotEmpty({ message: "Почта обязательна для заполнения" })
  @IsEmail({}, { message: "Некорректный формат email" })
  email: string;

  @IsString({ message: "Пароль должен быть строкой" })
  @IsNotEmpty({ message: "Пароль не должен быть пустым" })
  @MinLength(6, { message: "Пароль должен быть не менее 6 символов" })
  @MaxLength(64, { message: "Пароль не должен превышать 32 символа" })
  password: string;
}
