import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuid } from 'uuid';
import { uploadPhoto } from '@/lib/s3/upload';
import { getSettings } from '@/lib/settings/service';
import { emitWebhookEvent } from '@/lib/webhooks/service';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
    const uploadId = uuid();
    let fileName = 'unknown';

    try {
        const settings = getSettings();

        if (!settings.uploadsEnabled) {
            return NextResponse.json(
                { error: 'Uploads are currently disabled by the administrator.' },
                { status: 403 }
            );
        }

        if (!settings.endpoint || !settings.accessKeyId) {
            return NextResponse.json(
                { error: 'S3 is not configured. Please configure it in the admin panel.' },
                { status: 503 }
            );
        }

        const formData = await request.formData();
        const file = formData.get('file') as File | null;

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        fileName = file.name;

        if (file.size > settings.maxFileSize) {
            return NextResponse.json(
                {
                    error: `File too large. Maximum size is ${Math.round(settings.maxFileSize / (1024 * 1024))}MB`,
                },
                { status: 413 }
            );
        }

        emitWebhookEvent(
            'photo.upload.start',
            { fileName: file.name, fileSize: file.size, mimeType: file.type },
            { uploadId }
        );

        const buffer = Buffer.from(await file.arrayBuffer());
        const date = (formData.get('date') as string) || undefined;

        const onProgress = (bytesUploaded: number, totalBytes: number) => {
            emitWebhookEvent(
                'photo.upload.progress',
                {
                    fileName: file.name,
                    percentage: Math.round((bytesUploaded / totalBytes) * 100),
                    bytesUploaded,
                    totalBytes,
                },
                { uploadId }
            );
        };

        const result = await uploadPhoto(buffer, file.name, file.type, date, onProgress);

        emitWebhookEvent(
            'photo.upload.end',
            {
                fileName: file.name,
                fileSize: file.size,
                key: result.key,
                url: result.url,
                thumbnailUrl: result.thumbnailUrl,
            },
            { uploadId }
        );

        return NextResponse.json({
            message: 'Upload successful',
            key: result.key,
            url: result.url,
            thumbnailUrl: result.thumbnailUrl,
            fileName: file.name,
        });
    } catch (error) {
        const err = error as Error;
        logger.error('Upload failed', { error: err.message });

        emitWebhookEvent('photo.upload.error', { fileName, error: err.message }, { uploadId });

        if (err.message.startsWith('Unsupported file type')) {
            return NextResponse.json({ error: err.message }, { status: 400 });
        }

        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
