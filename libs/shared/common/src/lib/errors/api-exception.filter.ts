// libs/api-common/src/filters/api-exception.filter.ts
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, BadRequestException, HttpStatus } from "@nestjs/common";
import { Response } from "express";
import { ApiException, ApiErrorResponse } from "./api-exception";

type ValidationErrorResponse = {
  message: string | string[];
};

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = "INTERNAL_ERROR";
    let details: Record<string, unknown> | string[] | null = null;

    if (exception instanceof ApiException) {
      status = exception.getStatus();
      const payload = exception.getResponse() as ApiErrorResponse;
      errorCode = payload.errorCode;
      details = payload.details ?? null;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();

      if (exception instanceof BadRequestException) {
        const res = exception.getResponse();

        if (typeof res === "object" && res !== null && "message" in res) {
          const validationRes = res as ValidationErrorResponse;
          errorCode = "VALIDATION_ERROR";

          if (Array.isArray(validationRes.message)) {
            details = validationRes.message;
          } else if (typeof validationRes.message === "string") {
            details = [validationRes.message];
          }
        }
      } else {
        errorCode = "HTTP_ERROR";
      }
    }

    response.status(status).json({
      errorCode,
      details,
    });
  }
}
