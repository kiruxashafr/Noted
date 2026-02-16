import { ArgumentsHost, Catch, ExceptionFilter } from "@nestjs/common";
import { Response } from "express";
import { ApiException, ApiErrorResponse } from "./api-exception";

@Catch(ApiException)
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: ApiException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const resBody = exception.getResponse() as ApiErrorResponse;

    response.status(status).json({
      errorCode: resBody.errorCode,
      details: resBody.details || null,
    });
  }
}
