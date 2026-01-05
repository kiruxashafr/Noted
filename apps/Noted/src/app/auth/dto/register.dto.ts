import { IsNotEmpty, MaxLength, IsString, IsEmail, Matches } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
import { PASSWORD_REGEX } from "@noted/common/constants";

export class RegisterRequest implements RegisterRequest {
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
  @IsString()
  @Matches(PASSWORD_REGEX)
  password: string;
}
