import { getWebhooksForEvent } from './repository';
import { dispatchWebhook } from './dispatcher';
import type { WebhookEventType, WebhookEventData, WebhookPayload } from '@/types/webhook';

// Throttle progress events: Map<"webhookId:uploadId", lastEmitTimestamp>
const progressThrottle = new Map<string, number>();
const PROGRESS_THROTTLE_MS = 2000;
const THROTTLE_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

function sweepStaleThrottleEntries() {
    const now = Date.now();
    for (const [key, timestamp] of progressThrottle) {
        if (now - timestamp > THROTTLE_MAX_AGE_MS) {
            progressThrottle.delete(key);
        }
    }
}

/** Best-effort webhook emission — never throws, so it can't break upload flows */
export function emitWebhookEvent(
    event: WebhookEventType,
    data: WebhookEventData,
    options?: { uploadId?: string; batchId?: string }
): void {
    try {
        const webhooks = getWebhooksForEvent(event);
        if (webhooks.length === 0) return;

        const payload: WebhookPayload = {
            event,
            timestamp: new Date().toISOString(),
            data,
            ...(options?.uploadId && { uploadId: options.uploadId }),
            ...(options?.batchId && { batchId: options.batchId }),
        };

        for (const webhook of webhooks) {
            // Throttle progress events per webhook+upload pair
            if (event === 'photo.upload.progress' && options?.uploadId) {
                const key = `${webhook.id}:${options.uploadId}`;
                const lastEmit = progressThrottle.get(key) ?? 0;
                const now = Date.now();
                if (now - lastEmit < PROGRESS_THROTTLE_MS) continue;
                progressThrottle.set(key, now);
            }

            dispatchWebhook(webhook, payload);
        }

        // Clean up throttle entries when upload finishes
        if ((event === 'photo.upload.end' || event === 'photo.upload.error') && options?.uploadId) {
            for (const key of progressThrottle.keys()) {
                if (key.endsWith(`:${options.uploadId}`)) {
                    progressThrottle.delete(key);
                }
            }
        }

        // Periodic sweep of stale entries from abandoned uploads
        sweepStaleThrottleEntries();
    } catch {
        // Webhook emission is best-effort — never fail the caller
    }
}
