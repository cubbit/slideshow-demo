import { NextResponse } from 'next/server';
import { checkS3Health } from '@/lib/s3/health';

export async function GET() {
    const health = await checkS3Health();
    return NextResponse.json(health, {
        headers: { 'Cache-Control': 'no-cache, max-age=0' },
    });
}
