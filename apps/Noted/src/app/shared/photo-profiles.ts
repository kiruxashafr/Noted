export enum PhotoConvertFormat {
    JPEG = 'jpeg',
    PNG = 'png',
    WEBP = 'webp',
    HEIF = 'heif',
    GIF = 'gif',
    TIFF = 'tiff',
    AVIF = 'avif'
}

export const PHOTO_PROFILES = {
    AVATAR_MINI: {
        format: PhotoConvertFormat.JPEG,
        width: 180,
        height: 180
    },
    AVATAR_PROFILE: {
        width: 900,
        height: 900
    }
}