import type { AllSettings } from '@/types/settings';

export function getDefaults(): AllSettings {
    return {
        bucketName: process.env.S3_BUCKET_NAME || 'slideshow',
        prefix: process.env.S3_PREFIX || '',
        endpoint: process.env.S3_ENDPOINT || '',
        region: process.env.S3_REGION || 'eu-central-1',
        accessKeyId: process.env.S3_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || '',
        multipartThreshold: parseInt(process.env.MULTIPART_THRESHOLD || '5242880', 10),
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
        speedS: parseInt(process.env.SLIDESHOW_SPEED_S || '200', 10),
        rows: parseInt(process.env.SLIDESHOW_ROWS || '3', 10),
        minCountForMarquee: parseInt(process.env.MIN_COUNT_FOR_MARQUEE || '6', 10),
        cacheTtlS: parseInt(process.env.CACHE_TTL_S || '30', 10),
    };
}
