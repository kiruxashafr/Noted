import { Expose } from "class-transformer";

export class ReadRefreshDto {
  @Expose()
  accessToken: string;
}
