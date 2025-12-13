// libs/common/src/errors/prisma-error.utils.ts
import { PostgresQueryError } from "@noted/types";

export interface PrismaConstraintError {
  code: string;
  meta?: {
    modelName?: string;
    target?: string[];
    driverAdapterError?: {
      cause: PostgresQueryError;
    };
  };
}

export function isPrismaConstraintError(error: unknown): error is PrismaConstraintError {
  if (typeof error !== "object" || error === null) return false;

  // Явное приведение типа
  const err = error as Record<string, unknown>;
  return err["code"] === "P2002" && "meta" in err;
}

// Извлекает PostgreSQL ошибку из Prisma ошибки
export function extractPostgresErrorFromPrisma(error: PrismaConstraintError): PostgresQueryError | null {
  return error.meta?.driverAdapterError?.cause || null;
}
