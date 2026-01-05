import {  MaxLength, IsString, IsEmail, Length, Matches, NotContains, IsOptional } from "class-validator";
import {  ApiPropertyOptional } from "@nestjs/swagger";

export class UpdateUserDto  {
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
  password?: string;
}
