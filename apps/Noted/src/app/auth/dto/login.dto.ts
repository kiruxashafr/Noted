import { IsNotEmpty, MaxLength, IsString, IsEmail, MinLength } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { LoginRequest } from "@noted/types";

export class LoginDto implements LoginRequest {
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
