export class UploadAvatarDto {
    userId: string;
    buffer: Buffer;
    newName: string;
    mimeType: string;
}
