import { ApiProperty } from "@nestjs/swagger";
import { TokenResponse } from "@noted/types";
import { Expose } from "class-transformer";

export class ReadRefreshDto implements TokenResponse {
  @ApiProperty({ description: "JWT Access Token" })
  @Expose()
  accessToken: string;
}
