import { Injectable, PipeTransform } from "@nestjs/common";
import { InvalidFileTypeException, MissingFileException } from "@noted/common/errors/domain-exception";

@Injectable()
export class ImageValidationPipe implements PipeTransform {
  private readonly allowedMimeTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
    "image/heic-sequence",
    "image/heif-sequence",
    "image/tiff",
    "image/avif",
    "image/jp2",
    "image/jpx",
    "image/jpm",
  ];

  transform(file: Express.Multer.File) {
    if (!file) {
      throw new MissingFileException();
    }

    if (!this.allowedMimeTypes.includes(file.mimetype)) {
      throw new InvalidFileTypeException();
    }
    return file;
  }
}
