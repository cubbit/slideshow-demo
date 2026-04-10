import { NextResponse } from 'next/server';
import { checkS3Health } from '@/lib/s3/health';
import { emitWebhookEvent } from '@/lib/webhooks/service';

let lastKnownStatus: 'ok' | 'error' | null = null;

export async function GET() {
    const health = await checkS3Health();

    // Capture and update atomically (no await between read and write)
    const previousStatus = lastKnownStatus;
    lastKnownStatus = health.status;

    if (previousStatus !== null && health.status !== previousStatus) {
        emitWebhookEvent('s3.health.changed', {
            status: health.status,
            previousStatus,
            endpoint: health.endpoint,
            bucket: health.bucket,
            ...(health.error && { error: health.error }),
        });
    }

    return NextResponse.json(health, {
        headers: { 'Cache-Control': 'no-cache, max-age=0' },
    });
}
