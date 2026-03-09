import { ApiProperty } from "@nestjs/swagger";
import { AccountResponse } from "@noted/types";
import { Expose } from "class-transformer";
import { IsOptional } from "class-validator";

export class ReadUserProfileDto implements AccountResponse {
  @ApiProperty({
    description: "User id",
    example: "user_123",
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: "User email address",
    example: "user@example.com",
  })
  @Expose()
  email: string;

  @ApiProperty({
    description: "User name",
    example: "user",
  })
  @Expose()
  name: string;

  @Expose()
  @IsOptional()
  avatars: string

  @ApiProperty({
    description: "Account creation date",
    example: "2024-01-01T10:00:00.000Z",
  })
  @Expose()
  createdAt: Date;
}
