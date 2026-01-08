export interface AvatarConversionResult {
  success: boolean;
  convertedBuffer: string;
  fileName: string;
  mimeType: string;
  convertedSize?: number;
}