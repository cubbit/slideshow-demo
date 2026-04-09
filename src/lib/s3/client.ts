import { S3Client } from '@aws-sdk/client-s3';
import { getSettings } from '@/lib/settings/service';

let cachedClient: S3Client | null = null;
let cacheKey = '';

export function getS3Client(): S3Client {
    const settings = getSettings();
    const currentKey = `${settings.endpoint}|${settings.region}|${settings.accessKeyId}|${settings.secretAccessKey}|${settings.bucketName}`;

    if (cachedClient && cacheKey === currentKey) {
        return cachedClient;
    }

    cachedClient = new S3Client({
        region: settings.region,
        credentials: {
            accessKeyId: settings.accessKeyId,
            secretAccessKey: settings.secretAccessKey,
        },
        endpoint: settings.endpoint || undefined,
        forcePathStyle: true,
        maxAttempts: 3,
    });

    cacheKey = currentKey;
    return cachedClient;
}

export function invalidateS3Client(): void {
    cachedClient = null;
    cacheKey = '';
}
