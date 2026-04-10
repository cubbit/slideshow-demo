import { NextRequest, NextResponse } from 'next/server';
import archiver from 'archiver';
import { Readable, PassThrough } from 'stream';
import { listAllKeys, getObjectStream, deleteAllPhotos } from '@/lib/s3/bulk';
import { emitWebhookEvent } from '@/lib/webhooks/service';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const date = searchParams.get('date') || undefined;

    try {
        const keys = await listAllKeys(date);

        if (keys.length === 0) {
            return NextResponse.json({ error: 'No photos found' }, { status: 404 });
        }

        emitWebhookEvent('photos.download.started', { photoCount: keys.length, date });

        const passthrough = new PassThrough();
        const archive = archiver('zip', { zlib: { level: 1 } }); // fast compression for images

        archive.pipe(passthrough);

        // Stream each photo into the zip
        for (const key of keys) {
            try {
                const body = await getObjectStream(key);
                if (body) {
                    const filename = key.split('/').pop() || key;
                    const dateDir = key.split('/').slice(0, 3).join('-');
                    archive.append(body as unknown as Readable, { name: `${dateDir}/${filename}` });
                }
            } catch {
                logger.warn('Failed to fetch photo for zip', { key });
            }
        }

        // Emit completed when the archive stream finishes (all bytes written)
        passthrough.on('finish', () => {
            emitWebhookEvent('photos.download.completed', { photoCount: keys.length, date });
        });

        archive.finalize();

        const webStream = Readable.toWeb(passthrough) as ReadableStream;
        const dateSuffix = date ? `-${date.replace(/\//g, '-')}` : '';

        return new Response(webStream, {
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': `attachment; filename="cubbit-slideshow${dateSuffix}.zip"`,
            },
        });
    } catch (error) {
        logger.error('Bulk download failed', { error });
        return NextResponse.json({ error: 'Download failed' }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const { searchParams } = request.nextUrl;
    const date = searchParams.get('date') || undefined;

    try {
        const deleted = await deleteAllPhotos(date);

        emitWebhookEvent('photos.deleted', { deletedCount: deleted, date });

        return NextResponse.json({ deleted });
    } catch (error) {
        logger.error('Bulk delete failed', { error });
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
