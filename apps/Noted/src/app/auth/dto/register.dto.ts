import { IsNotEmpty, MaxLength, IsString, IsEmail, MinLength } from "class-validator";
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
    example: "Password123",
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(64)
  password: string;
}
