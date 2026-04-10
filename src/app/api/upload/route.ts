import { NextRequest, NextResponse } from 'next/server';
import { uploadPhoto } from '@/lib/s3/upload';
import { getSettings } from '@/lib/settings/service';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
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

        if (file.size > settings.maxFileSize) {
            return NextResponse.json(
                {
                    error: `File too large. Maximum size is ${Math.round(settings.maxFileSize / (1024 * 1024))}MB`,
                },
                { status: 413 }
            );
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        const result = await uploadPhoto(buffer, file.name, file.type);

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

        if (err.message.startsWith('Unsupported file type')) {
            return NextResponse.json({ error: err.message }, { status: 400 });
        }

        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}
