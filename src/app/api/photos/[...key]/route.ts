import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getS3Client } from '@/lib/s3/client';
import { getSettings } from '@/lib/settings/service';
import { deletePhoto } from '@/lib/s3/delete';
import logger from '@/lib/logger';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ key: string[] }> }
) {
    try {
        const { key } = await params;
        const photoKey = decodeURIComponent(key.join('/'));

        if (photoKey.includes('..')) {
            return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
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

        return new Response(response.Body as ReadableStream, { headers });
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

        // Prevent path traversal
        if (photoKey.includes('..')) {
            return NextResponse.json({ error: 'Invalid key' }, { status: 400 });
        }

        await deletePhoto(photoKey);
        return NextResponse.json({ success: true });
    } catch (error) {
        logger.error('Failed to delete photo', { error });
        return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
    }
}
