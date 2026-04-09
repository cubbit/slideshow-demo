export const SUPPORTED_MIME_TYPES = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/bmp',
    'image/tiff',
    'image/heic',
    'image/heif',
] as const;

export const SUPPORTED_EXTENSIONS = [
    'jpg',
    'jpeg',
    'png',
    'gif',
    'webp',
    'bmp',
    'tiff',
    'tif',
    'heic',
    'heif',
] as const;

export const THUMBNAIL_SIZE = 480;
export const THUMBNAIL_QUALITY = 80;
export const THUMBNAIL_PREFIX = '.thumbnails';

export const JWT_EXPIRY = '4h';
export const JWT_COOKIE_NAME = 'auth_token';

export const DEFAULT_POLL_INTERVAL_MS = 5000;
export const DEFAULT_SSE_CHECK_INTERVAL_MS = 3000;
export const DEFAULT_SETTINGS_REFRESH_MS = 30000;
