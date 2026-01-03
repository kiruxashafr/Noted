import { HttpStatus, Injectable, PipeTransform } from "@nestjs/common";
import { ApiException } from "@noted/common/errors/api-exception";
import { ErrorCodes } from "@noted/common/errors/error-codes.const";

@Injectable()
export class ImageConverterPipe implements PipeTransform {
  async transform(file: Express.Multer.File): Promise<Express.Multer.File> {
    if (!["image/heic", "image/heif"].includes(file.mimetype)) {
      return file;
    }

    try {
      const heicConvert = require("heic-convert");

      const outputBuffer = await heicConvert({
        buffer: file.buffer,
        format: "JPEG",
        quality: 0.9,
      });

      return {
        ...file,
        buffer: outputBuffer,
        mimetype: "image/jpeg",
        originalname: file.originalname,
        size: outputBuffer.length,
      };
    } catch (error) {
      throw new ApiException(ErrorCodes.HEIC_CONVERSION_FAILED, HttpStatus.BAD_REQUEST, [error.message]);
    }
  }
}
