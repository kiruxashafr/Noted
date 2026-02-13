import { HttpException, HttpStatus } from "@nestjs/common";

export interface ApiErrorResponse {
  errorCode: string;
  details?: Record<string, unknown> | string[] | null;
}

export class ApiException extends HttpException {
  constructor(
    public readonly errorCode: string,
    status: HttpStatus,
    public readonly details?: Record<string, unknown> | string[],
  ) {
    super(
      {
        errorCode,
        details: details ?? null,
      } as ApiErrorResponse,
      status,
    );
  }
}
