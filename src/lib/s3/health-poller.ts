import { checkS3Health } from './health';
import { emitWebhookEvent } from '@/lib/webhooks/service';
import logger from '@/lib/logger';

const POLL_INTERVAL_MS = 5_000;

let lastKnownStatus: 'ok' | 'error' | null = null;
let started = false;

async function poll() {
    try {
        const health = await checkS3Health();
        const previousStatus = lastKnownStatus;
        lastKnownStatus = health.status;

        if (previousStatus !== null && health.status !== previousStatus) {
            logger.info('S3 health status changed', {
                from: previousStatus,
                to: health.status,
                latencyMs: health.latencyMs,
            });
            emitWebhookEvent('s3.health.changed', {
                status: health.status,
                previousStatus,
                endpoint: health.endpoint,
                bucket: health.bucket,
                ...(health.error && { error: health.error }),
            });
        }
    } catch {
        // Best-effort — don't crash the poller
    }
}

export function startHealthPoller() {
    if (started) return;
    started = true;
    logger.info('S3 health poller started', { intervalMs: POLL_INTERVAL_MS });
    // Initial check after a short delay to let the app initialize
    setTimeout(() => {
        poll();
        setInterval(poll, POLL_INTERVAL_MS);
    }, 2_000);
}
