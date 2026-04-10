'use server';

import {
    getAllWebhooks,
    getWebhookById,
    createWebhook,
    updateWebhook,
    deleteWebhook,
} from '@/lib/webhooks/repository';
import { deliverOnce } from '@/lib/webhooks/dispatcher';
import { webhookSchema } from '@/lib/validation';
import logger from '@/lib/logger';
import type { ActionResult } from '@/types/api';
import type { WebhookConfig, WebhookEventType, WebhookEventData } from '@/types/webhook';

function parseWebhookFormData(formData: FormData): ActionResult<WebhookConfig> {
    const raw = Object.fromEntries(formData.entries());
    const parsed = webhookSchema.safeParse(raw);

    if (!parsed.success) {
        return { success: false, error: parsed.error.errors[0].message };
    }

    return { success: true, data: parsed.data as unknown as WebhookConfig };
}

export async function getWebhooksAction(): Promise<ActionResult<WebhookConfig[]>> {
    try {
        return { success: true, data: getAllWebhooks() };
    } catch (error) {
        logger.error('Failed to get webhooks', { error });
        return { success: false, error: 'Failed to load webhooks' };
    }
}

export async function createWebhookAction(
    formData: FormData
): Promise<ActionResult<WebhookConfig>> {
    try {
        const validation = parseWebhookFormData(formData);
        if (!validation.success) return validation;

        const webhook = createWebhook(validation.data);
        logger.info('Webhook created', { id: webhook.id, name: webhook.name });
        return { success: true, data: webhook };
    } catch (error) {
        logger.error('Failed to create webhook', { error });
        return { success: false, error: 'Failed to create webhook' };
    }
}

export async function updateWebhookAction(
    id: string,
    formData: FormData
): Promise<ActionResult<WebhookConfig>> {
    try {
        const validation = parseWebhookFormData(formData);
        if (!validation.success) return validation;

        const webhook = updateWebhook(id, validation.data);
        if (!webhook) {
            return { success: false, error: 'Webhook not found' };
        }

        logger.info('Webhook updated', { id, name: webhook.name });
        return { success: true, data: webhook };
    } catch (error) {
        logger.error('Failed to update webhook', { error });
        return { success: false, error: 'Failed to update webhook' };
    }
}

export async function deleteWebhookAction(id: string): Promise<ActionResult> {
    try {
        const deleted = deleteWebhook(id);
        if (!deleted) {
            return { success: false, error: 'Webhook not found' };
        }
        logger.info('Webhook deleted', { id });
        return { success: true, data: undefined };
    } catch (error) {
        logger.error('Failed to delete webhook', { error });
        return { success: false, error: 'Failed to delete webhook' };
    }
}

const TEST_PAYLOADS: Record<WebhookEventType, WebhookEventData> = {
    'upload.started': { fileName: 'test-photo.jpg', fileSize: 2048000, mimeType: 'image/jpeg' },
    'upload.progress': { fileName: 'test-photo.jpg', percentage: 50, bytesUploaded: 1024000, totalBytes: 2048000 },
    'upload.completed': { fileName: 'test-photo.jpg', fileSize: 2048000, key: 'photos/2026/01/01/test.jpg', url: 'https://example.com/test.jpg', thumbnailUrl: 'https://example.com/test_thumb.jpg' },
    'upload.failed': { fileName: 'test-photo.jpg', error: 'Test error' },
    'batch.started': { batchId: 'test-batch-id', fileCount: 5 },
    'batch.completed': { batchId: 'test-batch-id', fileCount: 5, successCount: 4, failedCount: 1 },
    'photo.download.started': { key: 'photos/2026/01/01/test.jpg' },
    'photo.download.completed': { key: 'photos/2026/01/01/test.jpg' },
    'photos.download.started': { photoCount: 10, date: '2026/01/01' },
    'photos.download.completed': { photoCount: 10, date: '2026/01/01' },
    'photo.deleted': { key: 'photos/2026/01/01/test.jpg' },
    'photos.deleted': { deletedCount: 10, date: '2026/01/01' },
    's3.health.changed': { status: 'ok', previousStatus: 'error', endpoint: 'https://s3.example.com', bucket: 'slideshow' },
};

export async function testWebhookAction(
    id: string,
    event: WebhookEventType = 'upload.started'
): Promise<ActionResult> {
    try {
        const webhook = getWebhookById(id);
        if (!webhook) {
            return { success: false, error: 'Webhook not found' };
        }

        const data = TEST_PAYLOADS[event];
        if (!data) {
            return { success: false, error: `Unknown event type: ${event}` };
        }

        const result = await deliverOnce(webhook, {
            event,
            timestamp: new Date().toISOString(),
            data,
        });

        if (!result.ok) {
            return { success: false, error: `Delivery failed: ${result.error}` };
        }

        return { success: true, data: undefined };
    } catch (error) {
        logger.error('Failed to test webhook', { error });
        return { success: false, error: 'Failed to send test' };
    }
}
