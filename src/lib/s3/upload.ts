import path from 'path';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { fileTypeFromBuffer } from 'file-type';
import sharp from 'sharp';
import { v4 as uuid } from 'uuid';
import { getS3Client } from './client';
import { getTodayPrefix, buildS3Url } from './utils';
import { getSettings } from '@/lib/settings/service';
import {
    SUPPORTED_MIME_TYPES,
    THUMBNAIL_SIZE,
    THUMBNAIL_QUALITY,
    THUMBNAIL_PREFIX,
} from '@/lib/constants';
import logger from '@/lib/logger';

interface UploadResult {
    key: string;
    url: string;
    thumbnailUrl: string;
}

export async function uploadPhoto(
    buffer: Buffer,
    originalName: string,
    mimeType: string,
    date?: string,
    onProgress?: (bytesUploaded: number, totalBytes: number) => void
): Promise<UploadResult> {
    // Validate MIME type via magic bytes
    const detectedType = await fileTypeFromBuffer(buffer);
    const effectiveMime = detectedType?.mime || mimeType;

    if (!SUPPORTED_MIME_TYPES.includes(effectiveMime as (typeof SUPPORTED_MIME_TYPES)[number])) {
        throw new Error(`Unsupported file type: ${effectiveMime}`);
    }

    const settings = getSettings();
    const client = getS3Client();
    const ext = detectedType?.ext || path.extname(originalName).slice(1) || 'jpg';
    const id = uuid();
    const datePrefix = date || getTodayPrefix();
    const prefix = settings.prefix ? `${settings.prefix}/` : '';
    const key = `${prefix}${datePrefix}/${id}.${ext}`;
    const thumbnailKey = `${prefix}${datePrefix}/${THUMBNAIL_PREFIX}/${id}_thumb.jpg`;

    // Upload original
    const metadata = {
        'original-filename': originalName,
        'upload-date': new Date().toISOString(),
    };

    if (buffer.length > settings.multipartThreshold) {
        const upload = new Upload({
            client,
            params: {
                Bucket: settings.bucketName,
                Key: key,
                Body: buffer,
                ContentType: effectiveMime,
                Metadata: metadata,
            },
            partSize: 10 * 1024 * 1024, // 10MB parts
        });
        if (onProgress) {
            upload.on('httpUploadProgress', progress => {
                if (progress.loaded != null && progress.total != null) {
                    onProgress(progress.loaded, progress.total);
                }
            });
        }
        await upload.done();
    } else {
        if (onProgress) onProgress(0, buffer.length);
        await client.send(
            new PutObjectCommand({
                Bucket: settings.bucketName,
                Key: key,
                Body: buffer,
                ContentType: effectiveMime,
                Metadata: metadata,
            })
        );
        if (onProgress) onProgress(buffer.length, buffer.length);
    }

    logger.info('Photo uploaded', { key, size: buffer.length });

    // Generate and upload thumbnail
    try {
        const thumbnail = await sharp(buffer)
            .rotate() // auto-apply EXIF orientation
            .resize(THUMBNAIL_SIZE, THUMBNAIL_SIZE, { fit: 'cover', position: 'centre' })
            .jpeg({ quality: THUMBNAIL_QUALITY, progressive: true })
            .toBuffer();

        await client.send(
            new PutObjectCommand({
                Bucket: settings.bucketName,
                Key: thumbnailKey,
                Body: thumbnail,
                ContentType: 'image/jpeg',
            })
        );

        logger.info('Thumbnail generated', { thumbnailKey, size: thumbnail.length });
    } catch (err) {
        logger.warn('Thumbnail generation failed, using original', { key, error: err });
    }

    const url = buildS3Url(settings.endpoint, settings.bucketName, key);
    const thumbnailUrl = buildS3Url(settings.endpoint, settings.bucketName, thumbnailKey);

    return { key, url, thumbnailUrl };
}
