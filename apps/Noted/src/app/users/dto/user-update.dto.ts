import { MaxLength, IsString, IsEmail, Matches, IsOptional } from "class-validator";
import { ApiPropertyOptional } from "@nestjs/swagger";
import { UpdateUserRequest } from "@noted/types";
import { PASSWORD_REGEX } from "@noted/common/constants";

export class UpdateUserDto implements UpdateUserRequest {
  @ApiPropertyOptional({
    description: "User name",
    example: "user",
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({
    description: "User email address",
    example: "user@example.com",
  })
  @IsString()
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({
    description: "User password",
    example: "SecurePass123!",
    minLength: 8,
    maxLength: 64,
  })
  @IsOptional()
  @IsString({ message: "Password must be a string" })
  @Matches(PASSWORD_REGEX)
  password?: string;
}
