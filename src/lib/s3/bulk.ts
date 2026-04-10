import { ListObjectsV2Command, GetObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getS3Client } from './client';
import { getSettings } from '@/lib/settings/service';
import { THUMBNAIL_PREFIX } from '@/lib/constants';
import { invalidatePhotoCache } from './list';
import logger from '@/lib/logger';

function isImageKey(key: string): boolean {
    return /\.(jpe?g|png|gif|webp|bmp|tiff?|heic|heif)$/i.test(key);
}

/**
 * List all photo keys, optionally filtered by date prefix (YYYY/MM/DD).
 * If no date, lists all photos across all days.
 */
export async function listAllKeys(date?: string): Promise<string[]> {
    const settings = getSettings();
    const client = getS3Client();
    const prefix = settings.prefix
        ? date ? `${settings.prefix}/${date}/` : `${settings.prefix}/`
        : date ? `${date}/` : '';

    const keys: string[] = [];
    let continuationToken: string | undefined;

    do {
        const response = await client.send(
            new ListObjectsV2Command({
                Bucket: settings.bucketName,
                Prefix: prefix,
                ContinuationToken: continuationToken,
                MaxKeys: 1000,
            })
        );

        for (const obj of response.Contents || []) {
            if (!obj.Key) continue;
            if (obj.Key.includes(`/${THUMBNAIL_PREFIX}/`)) continue;
            if (!isImageKey(obj.Key)) continue;
            keys.push(obj.Key);
        }

        continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    return keys;
}

/**
 * Get an S3 object as a readable stream.
 */
export async function getObjectStream(key: string) {
    const settings = getSettings();
    const client = getS3Client();

    const response = await client.send(
        new GetObjectCommand({
            Bucket: settings.bucketName,
            Key: key,
        })
    );

    return response.Body;
}

/**
 * Delete all photos (and their thumbnails) for a given date or all dates.
 */
export async function deleteAllPhotos(date?: string): Promise<number> {
    const settings = getSettings();
    const client = getS3Client();
    const prefix = settings.prefix
        ? date ? `${settings.prefix}/${date}/` : `${settings.prefix}/`
        : date ? `${date}/` : '';

    let totalDeleted = 0;
    let continuationToken: string | undefined;

    do {
        const response = await client.send(
            new ListObjectsV2Command({
                Bucket: settings.bucketName,
                Prefix: prefix,
                ContinuationToken: continuationToken,
                MaxKeys: 1000,
            })
        );

        const objects = (response.Contents || [])
            .filter(obj => obj.Key)
            .map(obj => ({ Key: obj.Key! }));

        if (objects.length > 0) {
            // DeleteObjects supports max 1000 keys per request
            await client.send(
                new DeleteObjectsCommand({
                    Bucket: settings.bucketName,
                    Delete: { Objects: objects, Quiet: true },
                })
            );
            totalDeleted += objects.filter(o => !o.Key.includes(`/${THUMBNAIL_PREFIX}/`)).length;
        }

        continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    invalidatePhotoCache();
    logger.info('Bulk delete completed', { date: date || 'all', totalDeleted });

    return totalDeleted;
}
