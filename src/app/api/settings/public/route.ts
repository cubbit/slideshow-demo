import { NextResponse } from 'next/server';
import { getPublicSettings } from '@/lib/settings/service';

export async function GET() {
    const settings = getPublicSettings();
    return NextResponse.json(settings, {
        headers: {
            'Cache-Control': 'public, max-age=30, stale-while-revalidate=60',
        },
    });
}
