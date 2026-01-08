import { Expose } from "class-transformer";

export class ReadConvertPhotoDto {
  @Expose()
  success: boolean;
    
  @Expose()
  convertedBuffer: string;
    
  @Expose()
  fileName: string;
    
  @Expose()
  mimeType: string;
    
  @Expose()
  convertedSize?: number;
}
