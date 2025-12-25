import { plainToInstance, ClassConstructor } from "class-transformer";

export function toDto<T>(data: object, dtoClass: ClassConstructor<T>): T {
  return plainToInstance(dtoClass, data, {
    excludeExtraneousValues: true,
  });
}
