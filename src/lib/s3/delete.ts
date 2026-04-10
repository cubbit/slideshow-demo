import { DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client } from './client';
import { getSettings } from '@/lib/settings/service';
import { THUMBNAIL_PREFIX } from '@/lib/constants';
import { invalidatePhotoCache } from './list';
import logger from '@/lib/logger';

export async function deletePhoto(key: string): Promise<void> {
    const settings = getSettings();
    const client = getS3Client();

    // Delete original
    await client.send(
        new DeleteObjectCommand({
            Bucket: settings.bucketName,
            Key: key,
        })
    );

    // Try to delete thumbnail
    const thumbnailKey = key
        .replace(/\/([^/]+)$/, `/${THUMBNAIL_PREFIX}/$1`)
        .replace(/\.[^.]+$/, '_thumb.jpg');

    try {
        await client.send(
            new DeleteObjectCommand({
                Bucket: settings.bucketName,
                Key: thumbnailKey,
            })
        );
    } catch {
        // Thumbnail may not exist, ignore
    }

    invalidatePhotoCache();
    logger.info('Photo deleted', { key });
}
