import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from "@nestjs/common";
import { DomainException } from "./domain-exception";
import { Response } from "express";

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(exception: DomainException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    const status = exception.httpStatus || HttpStatus.BAD_REQUEST;

    response.status(status).json({
      errorCode: exception.code,
      message: exception.message,
    });
  }
}
