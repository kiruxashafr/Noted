import { IsNotEmpty, MaxLength, IsString, IsEmail, MinLength } from "class-validator";
import { LoginPayload } from "@noted/types/auth/login.types";
import { ApiProperty } from "@nestjs/swagger";

export class LoginDto implements LoginPayload {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com'
  })
  @IsString()
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'Password123'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @MaxLength(64)
  password: string;
}
