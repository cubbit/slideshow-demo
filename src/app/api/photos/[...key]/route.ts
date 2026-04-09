import { NextRequest, NextResponse } from 'next/server';
import { deletePhoto } from '@/lib/s3/delete';
import logger from '@/lib/logger';

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
