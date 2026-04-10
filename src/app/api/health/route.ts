import { NextResponse } from 'next/server';
import { checkS3Health } from '@/lib/s3/health';
import { emitWebhookEvent } from '@/lib/webhooks/service';

let lastKnownStatus: 'ok' | 'error' | null = null;

export async function GET() {
    const health = await checkS3Health();

    if (lastKnownStatus !== null && health.status !== lastKnownStatus) {
        emitWebhookEvent('s3.health.changed', {
            status: health.status,
            previousStatus: lastKnownStatus,
            endpoint: health.endpoint,
            bucket: health.bucket,
            ...(health.error && { error: health.error }),
        });
    }
    lastKnownStatus = health.status;

    return NextResponse.json(health, {
        headers: { 'Cache-Control': 'no-cache, max-age=0' },
    });
}
