import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client } from '@/lib/s3/client';
import { getSettings } from '@/lib/settings/service';
import { deletePhoto } from '@/lib/s3/delete';
import { emitWebhookEvent } from '@/lib/webhooks/service';
import logger from '@/lib/logger';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ key: string[] }> }
) {
    try {
        const { key } = await params;
        const photoKey = decodeURIComponent(key.join('/'));

        if (photoKey.includes('..')) {
            return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
        }

        // Only emit download webhooks for explicit downloads, not carousel image serving
        const isDownload = request.nextUrl.searchParams.get('download') === 'true';

        if (isDownload) {
            emitWebhookEvent('photo.download.start', { key: photoKey });
        }

        const settings = getSettings();
        const client = getS3Client();
        const response = await client.send(
            new GetObjectCommand({
                Bucket: settings.bucketName,
                Key: photoKey,
            })
        );

        const headers = new Headers();
        if (response.ContentType) headers.set('Content-Type', response.ContentType);
        if (response.ContentLength) headers.set('Content-Length', String(response.ContentLength));
        headers.set('Cache-Control', 'public, max-age=86400');

        let bodyStream = response.Body as ReadableStream;

        if (isDownload) {
            const filename = photoKey.split('/').pop() || 'photo';
            headers.set('Content-Disposition', `attachment; filename="${filename}"`);

            const totalBytes = response.ContentLength ?? 0;
            let bytesDownloaded = 0;

            const progressStream = new TransformStream({
                transform(chunk, controller) {
                    bytesDownloaded += chunk.length;
                    if (totalBytes > 0) {
                        emitWebhookEvent('photo.download.progress', {
                            key: photoKey,
                            percentage: Math.round((bytesDownloaded / totalBytes) * 100),
                            bytesDownloaded,
                            totalBytes,
                        });
                    }
                    controller.enqueue(chunk);
                },
                flush() {
                    emitWebhookEvent('photo.download.end', { key: photoKey });
                },
            });

            bodyStream = bodyStream.pipeThrough(progressStream);
        }

        return new Response(bodyStream, { headers });
    } catch (error) {
        logger.error('Failed to proxy photo', { error });
        return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ key: string[] }> }
) {
    try {
        const { key } = await params;
        const photoKey = decodeURIComponent(key.join('/'));

        if (photoKey.includes('..')) {
            return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
        }

        await deletePhoto(photoKey);

        emitWebhookEvent('photo.delete.end', { key: photoKey });

        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Failed to delete photo', { error });
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
