import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class ReadAuthDto {
  @ApiProperty({ description: "JWT Access Token" })
  @Expose()
  accessToken: string;

  @ApiProperty({ description: "JWT Refresh Token" })
  @Expose()
  refreshToken: string;
  @ApiProperty({ description: "User id" })
  @Expose()
  userId: string;
}
