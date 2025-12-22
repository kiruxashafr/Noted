import { IsNotEmpty, MaxLength, IsString, IsEmail, Length, Matches, NotContains } from "class-validator";
import { RegisterPayload } from "@noted/types/auth/register.types";
import { ApiProperty } from "@nestjs/swagger";

export class RegisterRequest implements RegisterPayload {
  @ApiProperty({
    description: "User name",
    example: "user",
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({
    description: "User email address",
    example: "user@example.com",
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: "User password",
    example: "SecurePass123!",
    minLength: 8,
    maxLength: 64,
  })
  @IsString({ message: "Password must be a string" })
  @IsNotEmpty({ message: "Password is required" })
  @Length(8, 64, {
    message: "Password must be between 8 and 64 characters",
  })
  @Matches(/(?=.*[a-z])/, {
    message: "Password must contain at least one lowercase letter",
  })
  @Matches(/(?=.*[A-Z])/, {
    message: "Password must contain at least one uppercase letter",
  })
  @Matches(/(?=.*\d)/, {
    message: "Password must contain at least one number",
  })
  @Matches(/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/, {
    message: "Password must contain at least one special character",
  })
  @NotContains(" ", {
    message: "Password must not contain spaces",
  })
  password: string;
}
