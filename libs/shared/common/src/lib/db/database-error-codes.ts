/**
 * PostgreSQL SQLSTATE error codes.
 *
 * @see https://www.postgresql.org/docs/current/errcodes-appendix.html
 *
 * These constants help avoid "magic numbers" while handling database errors.
 * Use them when mapping low-level PG errors to domain-specific HTTP exceptions.
 */
export const PostgresErrorCode = {
  UNIQUE_VIOLATION: "23505",
  FOREIGN_KEY_VIOLATION: "23503",
  NOT_NULL_VIOLATION: "23502",
  CHECK_VIOLATION: "23514",
  EXCLUSION_VIOLATION: "23P01",
} as const;

export type PostgresErrorCode = (typeof PostgresErrorCode)[keyof typeof PostgresErrorCode];

export const PrismaErrorCode = {
  // Connection errors
  CONNECTION_FAILED: "P1000",
  CONNECTION_TIMEOUT: "P1001",

  // Constraint violations
  UNIQUE_CONSTRAINT_FAILED: "P2002",
  FOREIGN_KEY_CONSTRAINT_FAILED: "P2003",
  NULL_CONSTRAINT_VIOLATION: "P2011",

  // Record errors
  RECORD_NOT_FOUND: "P2025",

  // Validation errors
  VALUE_TOO_LONG: "P2000",
  INVALID_VALUE: "P2006",

  // Migration errors
  MIGRATION_FAILED: "P3000",
} as const;

export type PrismaErrorCode = (typeof PrismaErrorCode)[keyof typeof PrismaErrorCode];
