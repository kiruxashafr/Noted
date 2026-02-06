import { Expose, Transform } from "class-transformer";

export class ReadBlockDto {
  @Expose()
  id: string;

  @Expose()
  type: string;

  @Expose()
  meta: unknown;

  @Expose()
  pageId: string;

  @Expose()
  createdAt: Date;

  @Expose()
  updatedAt: Date;

  @Expose()
  order: number;
}
