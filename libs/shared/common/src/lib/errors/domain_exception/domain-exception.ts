import { HttpStatus } from "@nestjs/common";
import { ErrorCodes } from "../error-codes.const";

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

const createException = (code: string, httpStatus: HttpStatus) => {
  return class extends DomainException {
    constructor(message?: string) {
      super(code, httpStatus, message);
      this.name = code;
    }
  };
};

// ========== Общие ошибки ==========
export const ValidationException = createException(ErrorCodes.VALIDATION_ERROR, HttpStatus.BAD_REQUEST);

export const BadRequestException = createException(ErrorCodes.BAD_REQUEST, HttpStatus.BAD_REQUEST);

export const AccessDeniedException = createException(ErrorCodes.ACCESS_DENIED, HttpStatus.FORBIDDEN)
// ========== Auth ошибки ==========
export const InvalidCredentialsException = createException(ErrorCodes.INVALID_CREDENTIALS, HttpStatus.UNAUTHORIZED);

export const InvalidTokenException = createException(ErrorCodes.INVALID_TOKEN, HttpStatus.UNAUTHORIZED);

export const InvalidRefreshTokenException = createException(ErrorCodes.INVALID_REFRESH_TOKEN, HttpStatus.UNAUTHORIZED);

export const TokenExpiredException = createException(ErrorCodes.TOKEN_EXPIRED, HttpStatus.UNAUTHORIZED);

export const LoginFailedException = createException(ErrorCodes.LOGIN_FAILED, HttpStatus.UNAUTHORIZED);

export const RefreshFailedException = createException(ErrorCodes.REFRESH_FAILED, HttpStatus.UNAUTHORIZED);

export const UnauthorizedException = createException(ErrorCodes.UNAUTHORIZED, HttpStatus.UNAUTHORIZED);

export const InvalidAuthSchemeException = createException(ErrorCodes.INVALID_AUTH_SCHEME, HttpStatus.BAD_REQUEST);

export const RefreshTokenMissingException = createException(ErrorCodes.REFRESH_TOKEN_MISSING, HttpStatus.BAD_REQUEST);

export const MissingTokenException = createException(ErrorCodes.MISSING_TOKEN, HttpStatus.BAD_REQUEST);

// ========== Регистрация ==========
export const RegistrationFailedException = createException(
  ErrorCodes.REGISTRATION_FAILED,
  HttpStatus.INTERNAL_SERVER_ERROR,
);

export const EmailAlreadyExistsException = createException(ErrorCodes.EMAIL_ALREADY_EXISTS, HttpStatus.CONFLICT);

export const DuplicateValueException = createException(ErrorCodes.DUPLICATE_VALUE, HttpStatus.CONFLICT);

// ========== Пользователи ==========
export const UserNotFoundException = createException(ErrorCodes.USER_NOT_FOUND, HttpStatus.NOT_FOUND);

export const UpdateUserException = createException(ErrorCodes.UPDATE_USER_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);

export const UpdateUserAvatarException = createException(
  ErrorCodes.UPDATE_USER_AVATAR_ERROR,
  HttpStatus.INTERNAL_SERVER_ERROR,
);

export const GetProfileException = createException(ErrorCodes.GET_PROFILE_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);

export const FailedToCreateAccountException = createException(
  ErrorCodes.FAILED_TO_CREATE_ACCOUNT,
  HttpStatus.INTERNAL_SERVER_ERROR,
);

export const FailedToUpdateAccountException = createException(
  ErrorCodes.FAILED_TO_UPDATE_ACCOUNT,
  HttpStatus.INTERNAL_SERVER_ERROR,
);

// ========== Файлы ==========
export const FileUploadFailedException = createException(
  ErrorCodes.FILE_UPLOAD_FAILED,
  HttpStatus.INTERNAL_SERVER_ERROR,
);

export const FileDeleteFailedException = createException(
  ErrorCodes.FILE_DELETE_FAILED,
  HttpStatus.INTERNAL_SERVER_ERROR,
);

export const FileNotFoundException = createException(ErrorCodes.FILE_NOT_FOUND, HttpStatus.NOT_FOUND);

export const FileAccessDeniedException = createException(ErrorCodes.FILE_ACCESS_DENIED, HttpStatus.FORBIDDEN);

export const FileTooLargeException = createException(ErrorCodes.FILE_TOO_LARGE, HttpStatus.PAYLOAD_TOO_LARGE);

export const PayloadTooLargeException = createException(ErrorCodes.PAYLOAD_TOO_LARGE, HttpStatus.PAYLOAD_TOO_LARGE);

export const InvalidFileTypeException = createException(ErrorCodes.INVALID_FILE_TYPE, HttpStatus.BAD_REQUEST);

export const FileRetrievalFailedException = createException(
  ErrorCodes.FILE_RETRIEVAL_FAILED,
  HttpStatus.INTERNAL_SERVER_ERROR,
);

export const MissingFileException = createException(ErrorCodes.MISSING_FILE, HttpStatus.BAD_REQUEST);

// ========== Изображения ==========
export const HeicConversionFailedException = createException(
  ErrorCodes.HEIC_CONVERSION_FAILED,
  HttpStatus.INTERNAL_SERVER_ERROR,
);

export const ImageInvalidFormatException = createException(ErrorCodes.IMAGE_INVALID_FORMAT, HttpStatus.BAD_REQUEST);

export const ImageTooLargeException = createException(ErrorCodes.IMAGE_TOO_LARGE, HttpStatus.PAYLOAD_TOO_LARGE);

// ========== Блоки ==========
export const BlockNotFoundException = createException(ErrorCodes.BLOCK_NOT_FOUND, HttpStatus.NOT_FOUND);

export const BlockAccessDeniedException = createException(ErrorCodes.BLOCK_ACCESS_DENIED, HttpStatus.FORBIDDEN);

export const FailedToCreateBlockException = createException(
  ErrorCodes.FAILED_TO_CREATE_BLOCK,
  HttpStatus.INTERNAL_SERVER_ERROR,
);

export const FailedToCheckBlockAccessException = createException(
  ErrorCodes.FAILED_TO_CHECK_ACCESS_BLOCK,
  HttpStatus.INTERNAL_SERVER_ERROR,
);

export const FailedToCheckPageAccessException = createException(
  ErrorCodes.FAILED_TO_CHECK_ACCESS_PAGE,
  HttpStatus.INTERNAL_SERVER_ERROR,
);

export const FailedToFindBlockException = createException(ErrorCodes.FAILED_TO_FIND_BLOCK, HttpStatus.NOT_FOUND);

// ========== Общие системные ==========
export const InternalErrorException = createException(ErrorCodes.INTERNAL_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);

export const HttpErrorException = createException(ErrorCodes.HTTP_ERROR, HttpStatus.INTERNAL_SERVER_ERROR);
