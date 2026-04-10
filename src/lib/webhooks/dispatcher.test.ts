import { describe, it, expect, vi, beforeEach } from 'vitest';

import { deliverOnce } from './dispatcher';
import type { WebhookConfig, WebhookPayload } from '@/types/webhook';

const webhook: WebhookConfig = {
    id: 'wh-1',
    name: 'Test',
    url: 'https://example.com/hook',
    secret: 'test-secret',
    enabled: true,
    onUploadStarted: true,
    onUploadProgress: false,
    onUploadCompleted: true,
    onUploadFailed: true,
    onBatchStarted: true,
    onBatchCompleted: true,
    onPhotoDownloadStarted: false,
    onPhotoDownloadCompleted: false,
    onPhotosDownloadStarted: false,
    onPhotosDownloadCompleted: false,
    onPhotoDeleted: true,
    onPhotosDeleted: true,
    onS3HealthChanged: false,
    createdAt: '',
    updatedAt: '',
};

const payload: WebhookPayload = {
    event: 'upload.started',
    timestamp: new Date().toISOString(),
    data: { fileName: 'test.jpg', fileSize: 1000, mimeType: 'image/jpeg' },
};

describe('deliverOnce', () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it('returns ok:true on successful delivery', async () => {
        global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });

        const result = await deliverOnce(webhook, payload);
        expect(result.ok).toBe(true);
        expect(result.status).toBe(200);
    });

    it('returns ok:false on HTTP error', async () => {
        global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });

        const result = await deliverOnce(webhook, payload);
        expect(result.ok).toBe(false);
        expect(result.error).toBe('HTTP 500');
    });

    it('returns ok:false on network error', async () => {
        global.fetch = vi.fn().mockRejectedValue(new Error('Connection refused'));

        const result = await deliverOnce(webhook, payload);
        expect(result.ok).toBe(false);
        expect(result.error).toBe('Connection refused');
    });

    it('sends correct headers with valid HMAC signature', async () => {
        const crypto = await import('crypto');
        global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });

        await deliverOnce(webhook, payload);

        const [url, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(url).toBe('https://example.com/hook');
        expect(options.method).toBe('POST');
        expect(options.headers['Content-Type']).toBe('application/json');
        expect(options.headers['X-Webhook-Event']).toBe('upload.started');
        expect(options.headers['X-Webhook-Delivery']).toBeDefined();

        // Verify HMAC is correct, not just well-formatted
        const expectedSig =
            'sha256=' +
            crypto.createHmac('sha256', 'test-secret').update(options.body).digest('hex');
        expect(options.headers['X-Webhook-Signature']).toBe(expectedSig);
    });

    it('omits signature header when secret is empty', async () => {
        global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });
        const noSecretWebhook = { ...webhook, secret: '' };

        await deliverOnce(noSecretWebhook, payload);

        const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
        expect(options.headers['X-Webhook-Signature']).toBeUndefined();
    });

    it('sends JSON body matching payload', async () => {
        global.fetch = vi.fn().mockResolvedValue({ ok: true, status: 200 });

        await deliverOnce(webhook, payload);

        const [, options] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
        const body = JSON.parse(options.body);
        expect(body.event).toBe('upload.started');
        expect(body.data.fileName).toBe('test.jpg');
    });
});
