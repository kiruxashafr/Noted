import { Expose } from "class-transformer";

export class ReadAuthDto {
  @Expose()
  accessToken: string;

  @Expose()
  refreshToken: string;

  @Expose()
  userId: string;
}
