import { Prisma } from "generated/prisma/client";
import { PostgresErrorCode, PrismaErrorCode } from "./database-error-codes";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface PrismaErrorMeta extends Record<string, any> {
  modelName?: string;
  target?: string[];
  code?: string; 
  message?: string;
}

export function isPrismaError(error: unknown): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

export function isConstraintError(error: unknown): boolean {
  if (!isPrismaError(error)) return false;

  const code = error.code;
  const meta = error.meta as PrismaErrorMeta | undefined;

  const isDirectConstraint = [
    PrismaErrorCode.UNIQUE_CONSTRAINT_FAILED,
    PrismaErrorCode.FOREIGN_KEY_CONSTRAINT_FAILED,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ].includes(code as any);

  if (isDirectConstraint) return true;

  if (code === PrismaErrorCode.RAW_QUERY_FAILED && meta?.['code']) {
    return [
      PostgresErrorCode.UNIQUE_VIOLATION,
      PostgresErrorCode.FOREIGN_KEY_VIOLATION,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ].includes(meta['code'] as any);
  }

  return false;
}

export function getInternalErrorCode(error: unknown): string | undefined {
  if (!isPrismaError(error)) return undefined;
  
  const meta = error.meta as PrismaErrorMeta | undefined;

  if (error.code === PrismaErrorCode.RAW_QUERY_FAILED && meta) {
    let pgCode = meta['code'] || meta['database_error_code'];

    if (!pgCode && meta['driverAdapterError']?.['cause']) {
      pgCode = meta['driverAdapterError']['cause']['originalCode'];
    }

    if (pgCode) return String(pgCode);
  }

  return error.code;
}


export function getPrismaModelName(error: unknown): string | undefined {
  if (!isPrismaError(error)) return undefined;
  const meta = error.meta as PrismaErrorMeta | undefined;
  return meta?.['modelName'];
}