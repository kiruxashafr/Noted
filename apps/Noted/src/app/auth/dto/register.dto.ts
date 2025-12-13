import { IsNotEmpty, MaxLength, IsString, IsEmail, MinLength } from "class-validator";
import { RegisterPayload } from "@noted/types/auth/register.types";

export class RegisterRequest implements RegisterPayload {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

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
