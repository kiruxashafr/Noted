// events/avatar.events.ts
export enum AvatarEvent {
  AVATAR_CONVERTED = 'avatar.converted',
  AVATAR_CONVERSION_FAILED = 'avatar.conversion.failed',
}

export interface AvatarConvertedEvent {
  userId: string;
  jobId: string;
  originalFileId: string;
  newFileId: string;
}

export interface AvatarConversionFailedEvent {
  userId: string;
  jobId: string;
  fileId: string;
  error: string;
}