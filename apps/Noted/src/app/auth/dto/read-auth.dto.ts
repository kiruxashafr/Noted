import { ApiProperty } from "@nestjs/swagger";
import { TokenResponse } from "@noted/types";
import { Expose } from "class-transformer";

export class ReadAuthDto implements TokenResponse {
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
