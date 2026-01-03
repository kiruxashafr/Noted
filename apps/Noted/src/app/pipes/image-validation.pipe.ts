import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";

@Injectable()
export class ImageValidationPipe implements PipeTransform {
    private readonly allowedMimeTypes = ['image/jpeg', 'image/png', 'image/jpg'];

    transform(file: Express.Multer.File) {
        if (!file) {
            throw new BadRequestException('file not download');
        }

        if (!this.allowedMimeTypes.includes(file.mimetype)) {
            throw new BadRequestException('недопустимый формат ');

        }
        return file
    }
}