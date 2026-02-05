import { ArgumentsHost, BadRequestException, Catch, ExceptionFilter, HttpException, HttpStatus } from "@nestjs/common";
import { DomainException } from "./domain-exception";
import { Response } from "express";

type ValidationErrorResponse = {
  message: string | string[];
};

@Catch()
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = "INTERNAL_ERROR";
    let message: string | null = null;
    let details: Record<string, unknown> | string[] | null = null;

    if (exception instanceof DomainException) {
      status = exception.httpStatus;
      errorCode = exception.code;
      message = exception.message;
    }
    else if (exception instanceof BadRequestException) {
      status = exception.getStatus();
      errorCode = "VALIDATION_ERROR";
      message = "Validation failed";
      
      const res = exception.getResponse();
      if (typeof res === "object" && res !== null && "message" in res) {
        const validationRes = res as ValidationErrorResponse;
        
        if (Array.isArray(validationRes.message)) {
          details = validationRes.message;
        } else if (typeof validationRes.message === "string") {
          details = [validationRes.message];
        }
      }
    }
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      errorCode = "HTTP_ERROR";
      message = exception.message;
    }
    else if (exception instanceof Error) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorCode = "INTERNAL_ERROR";
      message = "Internal server error";
    }

    response.status(status).json({
      errorCode,
      ...(message && { message }),
      ...(details && { details }),
    });
  }
}