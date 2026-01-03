import { BadRequestException, Injectable, PipeTransform } from "@nestjs/common";

@Injectable()
export class ImageConverterPipe implements PipeTransform {
    async transform(file: Express.Multer.File): Promise<Express.Multer.File> {
        if (!['image/heic', 'image/heif'].includes(file.mimetype)) {
            return file;
        }
        
        try {
            const heicConvert = require('heic-convert');

            const outputBuffer = await heicConvert({
                buffer: file.buffer,
                format: 'JPEG',
                quality: 0.9
            });

            return {
                ...file,
                buffer: outputBuffer,
                mimetype: 'image/jpeg',
                originalname: file.originalname,
                size: outputBuffer.length
            };
            
        } catch (error) {

            
            throw new BadRequestException(`ошибка конвертации ${error.message}`);
        }
    }
}