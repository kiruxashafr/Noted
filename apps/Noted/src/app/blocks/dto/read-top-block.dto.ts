import { Expose, Transform } from "class-transformer";

export class ReadTopBlockDto {
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
  @Transform(({ obj }) => obj.parentRelations?.[0]?.order)
  order: number;
}
