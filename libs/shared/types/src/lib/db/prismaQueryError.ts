// prisma-error.types.ts (или добавьте в prisma-error.utils.ts)
export interface PrismaError {
  code: string;
  meta?: {
    target?: string[];
    modelName?: string;
  };
  clientVersion?: string;
}

export interface PrismaConstraintError extends PrismaError {
  code: "P2002" | "P2003" | "P2011";
}
