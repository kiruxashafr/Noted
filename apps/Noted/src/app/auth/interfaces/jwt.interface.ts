export interface RefreshTokenPayload {
  sub: string;
  iat?: number;
  exp?: number;
}

export interface AccessTokenPayload extends RefreshTokenPayload {
  sub: string;
}
