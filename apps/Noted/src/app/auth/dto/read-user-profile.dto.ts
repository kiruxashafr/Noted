import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class ReadUserProfileDto {
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

  @ApiProperty({
    description: "Account creation date",
    example: "2024-01-01T10:00:00.000Z",
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: "Date of last profile update",
    example: "2024-01-02T12:00:00.000Z",
  })
  @Expose()
  updatedAt: Date;
}
