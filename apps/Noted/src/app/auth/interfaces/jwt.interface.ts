import { ApiProperty } from "@nestjs/swagger";

export class RefreshTokenPayload {
  @ApiProperty({ description: "User id" })
  sub: string;
}

export class AccessTokenPayload {
  @ApiProperty({ description: "User id" })
  sub: string;
}
