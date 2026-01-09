import { Expose } from "class-transformer";

export class ReadConvertPhotoDto {
  @Expose()
  userId: string;
    
  @Expose()
  newFileId: string;

}
