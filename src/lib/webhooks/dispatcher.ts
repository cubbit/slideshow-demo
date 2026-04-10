import crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import type { WebhookConfig, WebhookPayload } from '@/types/webhook';
import { getWebhookById } from './repository';
import logger from '@/lib/logger';

const MAX_RETRIES = 3;
const TIMEOUT_MS = 10_000;

function computeSignature(secret: string, body: string): string {
    if (!secret) return '';
    return 'sha256=' + crypto.createHmac('sha256', secret).update(body).digest('hex');
}

async function sendRequest(
    webhook: WebhookConfig,
    payload: WebhookPayload
): Promise<{ ok: boolean; status?: number; error?: string }> {
    const body = JSON.stringify(payload);
    const deliveryId = uuid();
    const signature = computeSignature(webhook.secret, body);

    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'X-Webhook-Event': payload.event,
        'X-Webhook-Delivery': deliveryId,
    };
    if (signature) {
        headers['X-Webhook-Signature'] = signature;
    }

    try {
        const response = await fetch(webhook.url, {
            method: 'POST',
            headers,
            body,
            signal: AbortSignal.timeout(TIMEOUT_MS),
        });

        if (!response.ok) {
            return { ok: false, status: response.status, error: `HTTP ${response.status}` };
        }

        logger.info('Webhook delivered', {
            webhookId: webhook.id,
            event: payload.event,
            deliveryId,
            status: response.status,
        });
        return { ok: true, status: response.status };
    } catch (error) {
        return { ok: false, error: (error as Error).message };
    }
}

async function deliver(
    webhook: WebhookConfig,
    payload: WebhookPayload,
    attempt: number
): Promise<void> {
    // On retries, verify the webhook still exists and is enabled
    if (attempt > 0) {
        const current = getWebhookById(webhook.id);
        if (!current || !current.enabled) return;
    }

    const result = await sendRequest(webhook, payload);
    if (result.ok) return;

    if (attempt < MAX_RETRIES) {
        // Exponential backoff: attempt 0 -> 1s, attempt 1 -> 4s, attempt 2 -> 16s
        const delayMs = Math.pow(4, attempt) * 1000;
        logger.warn('Webhook delivery failed, retrying', {
            webhookId: webhook.id,
            event: payload.event,
            attempt,
            nextRetryMs: delayMs,
            error: result.error,
        });
        setTimeout(() => deliver(webhook, payload, attempt + 1), delayMs);
    } else {
        logger.error('Webhook delivery failed permanently', {
            webhookId: webhook.id,
            event: payload.event,
            attempts: attempt + 1,
            error: result.error,
        });
    }
}

/** Fire-and-forget dispatch with retries */
export function dispatchWebhook(webhook: WebhookConfig, payload: WebhookPayload): void {
    deliver(webhook, payload, 0);
}

/** Single delivery attempt — awaitable, used by test action */
export async function deliverOnce(
    webhook: WebhookConfig,
    payload: WebhookPayload
): Promise<{ ok: boolean; status?: number; error?: string }> {
    return sendRequest(webhook, payload);
}
