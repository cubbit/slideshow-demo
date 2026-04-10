'use server';

import { updateSettings } from '@/lib/settings/service';
import { invalidateS3Client } from '@/lib/s3/client';
import { checkS3Health } from '@/lib/s3/health';
import { s3SettingsSchema, slideshowSettingsSchema } from '@/lib/validation';
import { S3Client } from '@aws-sdk/client-s3';
import logger from '@/lib/logger';
import type { ActionResult } from '@/types/api';
import type { AllSettings } from '@/types/settings';

export async function updateS3Settings(formData: FormData): Promise<ActionResult<AllSettings>> {
    try {
        const raw = Object.fromEntries(formData.entries());
        const parsed = s3SettingsSchema.safeParse(raw);

        if (!parsed.success) {
            return { success: false, error: parsed.error.errors[0].message };
        }

        // Test connection with new credentials before saving
        const testClient = new S3Client({
            region: parsed.data.region,
            credentials: {
                accessKeyId: parsed.data.accessKeyId,
                secretAccessKey: parsed.data.secretAccessKey,
            },
            endpoint: parsed.data.endpoint || undefined,
            forcePathStyle: true,
        });

        const health = await checkS3Health(testClient);
        if (health.status === 'error') {
            testClient.destroy();
            return { success: false, error: `S3 connection failed: ${health.error}` };
        }
        testClient.destroy();

        const updated = updateSettings(parsed.data);
        invalidateS3Client();
        logger.info('S3 settings updated');

        return { success: true, data: updated };
    } catch (error) {
        logger.error('Failed to update S3 settings', { error });
        return { success: false, error: 'Failed to update settings' };
    }
}

export async function updateSlideshowSettings(
    formData: FormData
): Promise<ActionResult<AllSettings>> {
    try {
        const raw = Object.fromEntries(formData.entries());
        const parsed = slideshowSettingsSchema.safeParse(raw);

        if (!parsed.success) {
            return { success: false, error: parsed.error.errors[0].message };
        }

        const updated = updateSettings(parsed.data);
        logger.info('Slideshow settings updated');

        return { success: true, data: updated };
    } catch (error) {
        logger.error('Failed to update slideshow settings', { error });
        return { success: false, error: 'Failed to update settings' };
    }
}

export async function testS3Connection(): Promise<ActionResult<{ latencyMs: number }>> {
    try {
        const health = await checkS3Health();
        if (health.status === 'ok') {
            return { success: true, data: { latencyMs: health.latencyMs } };
        }
        return { success: false, error: health.error || 'Connection failed' };
    } catch (error) {
        logger.error('S3 connection test failed', { error });
        return { success: false, error: 'Connection test failed' };
    }
}
