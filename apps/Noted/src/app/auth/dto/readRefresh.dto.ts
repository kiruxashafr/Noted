import { ApiProperty } from "@nestjs/swagger";
import { Expose } from "class-transformer";

export class ReadRefreshDto {
  @ApiProperty({ description: 'JWT Access Token'})
  @Expose()
  accessToken: string;
}
