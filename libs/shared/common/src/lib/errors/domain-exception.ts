import { HttpStatus } from "@nestjs/common";
import { ErrorCodes } from "./error-codes.const";

export class DomainException extends Error {
  constructor(
    public readonly code: string,
    public readonly httpStatus: HttpStatus = HttpStatus.BAD_REQUEST,
    message?: string,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class UserNotFoundException extends DomainException {
  constructor(message?: string) {
    super(
        ErrorCodes.USER_NOT_FOUND, 
        HttpStatus.NOT_FOUND,
        message, 
    );
  }
}
