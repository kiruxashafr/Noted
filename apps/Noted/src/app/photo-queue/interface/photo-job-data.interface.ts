import { FileAccess } from "generated/prisma/enums";

interface ResizeOptions {
  width: number,
  height: number
}
export enum PhotoConvertFormat {
    JPEG = 'jpeg',
    PNG = 'png',
    WEBP = 'webp',
    HEIF = 'heif',
    GIF = 'gif',
    TIFF = 'tiff',
    AVIF = 'avif'
}


export interface PhotoJobData {
  fileId: string;
  userId: string;
  access: FileAccess;
  convertTo?: PhotoConvertFormat;
  resizeTo?: ResizeOptions;
}
