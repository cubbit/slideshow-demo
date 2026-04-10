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
import type { WebhookConfig } from '@/types/webhook';

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

export async function testWebhookAction(id: string): Promise<ActionResult> {
    try {
        const webhook = getWebhookById(id);
        if (!webhook) {
            return { success: false, error: 'Webhook not found' };
        }

        const result = await deliverOnce(webhook, {
            event: 'upload.started',
            timestamp: new Date().toISOString(),
            data: {
                fileName: 'test-ping.jpg',
                fileSize: 0,
                mimeType: 'image/jpeg',
            },
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
