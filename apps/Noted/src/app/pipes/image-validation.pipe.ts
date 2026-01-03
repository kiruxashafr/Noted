import { HttpStatus, Injectable, PipeTransform } from "@nestjs/common";
import { ApiException } from "@noted/common/errors/api-exception";
import { ErrorCodes } from "@noted/common/errors/error-codes.const";

@Injectable()
export class ImageValidationPipe implements PipeTransform {
  private readonly allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg"];

  transform(file: Express.Multer.File) {
    if (!file) {
      throw new ApiException(ErrorCodes.MISSING_FILE, HttpStatus.BAD_REQUEST);
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new ApiException(ErrorCodes.INVALID_FILE_TYPE, HttpStatus.BAD_REQUEST);
    }
    return file;
  }
}
