import { IsNotEmpty, MaxLength, IsString, IsEmail, MinLength } from "class-validator";
import { LoginPayload } from "@noted/types/auth/login.types";

export class LoginDto implements LoginPayload {
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(64)
  password: string;
}
