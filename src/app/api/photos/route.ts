import { NextRequest, NextResponse } from 'next/server';
import { getPhotos } from '@/lib/s3/list';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = request.nextUrl;
        const date = searchParams.get('date') || undefined;
        const cursor = searchParams.get('cursor') || undefined;
        const rawLimit = parseInt(searchParams.get('limit') || '200', 10);
        const limit = Number.isFinite(rawLimit) && rawLimit > 0 ? Math.min(rawLimit, 500) : 200;

        const page = await getPhotos(date, cursor, limit);

        return NextResponse.json(page, {
            headers: {
                'Cache-Control': 'no-store, max-age=0',
                'X-Total-Count': String(page.totalCount),
            },
        });
    } catch (error) {
        logger.error('Failed to list photos', { error });
        return NextResponse.json(
            { photos: [], nextCursor: null, totalCount: 0, hasMore: false, error: 'Failed to fetch photos' },
            { status: 502 }
        );
    }
}
