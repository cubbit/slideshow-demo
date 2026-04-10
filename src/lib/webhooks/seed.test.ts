import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parseWebhooksFromEnv } from '@/lib/db/schema';

const originalEnv = process.env;

beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.WEBHOOK_URL;
    delete process.env.WEBHOOK_SECRET;
    delete process.env.WEBHOOK_NAME;
    delete process.env.WEBHOOKS;
});

afterEach(() => {
    process.env = originalEnv;
});

describe('parseWebhooksFromEnv', () => {
    it('parses WEBHOOK_URL single webhook', () => {
        process.env.WEBHOOK_URL = 'https://example.com/hook';
        process.env.WEBHOOK_SECRET = 'my-secret';
        process.env.WEBHOOK_NAME = 'Test Hook';

        const result = parseWebhooksFromEnv();

        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({
            name: 'Test Hook',
            url: 'https://example.com/hook',
            secret: 'my-secret',
        });
    });

    it('parses WEBHOOKS JSON array', () => {
        process.env.WEBHOOKS = JSON.stringify([
            { name: 'Hook 1', url: 'https://a.com/hook', secret: 's1' },
            {
                name: 'Hook 2',
                url: 'https://b.com/hook',
                secret: 's2',
                events: { onPhotoUploadProgress: true },
            },
        ]);

        const result = parseWebhooksFromEnv();

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe('Hook 1');
        expect(result[1].events).toEqual({ onPhotoUploadProgress: true });
    });

    it('ignores invalid WEBHOOKS JSON', () => {
        process.env.WEBHOOKS = 'not-json{';

        const result = parseWebhooksFromEnv();

        expect(result).toHaveLength(0);
    });

    it('combines WEBHOOKS and WEBHOOK_URL', () => {
        process.env.WEBHOOKS = JSON.stringify([
            { name: 'A', url: 'https://a.com', secret: '' },
        ]);
        process.env.WEBHOOK_URL = 'https://b.com';
        process.env.WEBHOOK_SECRET = 'sec';
        process.env.WEBHOOK_NAME = 'B';

        const result = parseWebhooksFromEnv();

        expect(result).toHaveLength(2);
        expect(result[0].url).toBe('https://a.com');
        expect(result[1].url).toBe('https://b.com');
    });

    it('returns empty array when no webhook env vars set', () => {
        const result = parseWebhooksFromEnv();

        expect(result).toHaveLength(0);
    });

    it('preserves event overrides from WEBHOOKS JSON', () => {
        process.env.WEBHOOKS = JSON.stringify([
            {
                name: 'Custom',
                url: 'https://c.com',
                secret: '',
                events: {
                    onPhotoUploadStart: false,
                    onPhotoUploadProgress: true,
                    onS3HealthChanged: true,
                },
            },
        ]);

        const result = parseWebhooksFromEnv();
        const events = result[0].events!;

        expect(events.onPhotoUploadStart).toBe(false);
        expect(events.onPhotoUploadProgress).toBe(true);
        expect(events.onS3HealthChanged).toBe(true);
    });

    it('defaults name and secret to empty string for WEBHOOK_URL', () => {
        process.env.WEBHOOK_URL = 'https://example.com/hook';

        const result = parseWebhooksFromEnv();

        expect(result[0].name).toBe('');
        expect(result[0].secret).toBe('');
    });
});
