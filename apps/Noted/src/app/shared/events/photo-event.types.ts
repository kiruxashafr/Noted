export enum PhotoEvent {
  PHOTO_CONVERTED = "avatar.converted",
  PHOTO_CONVERSION_FAILED = "avatar.conversion.failed",
}

export interface PhotoConvertedEvent {
  userId: string;
  originalFileId: string;
  newFileId: string;
}

export interface PhotoConversionFailedEvent {
  userId: string;
  fileId: string;
  error: string;
}
