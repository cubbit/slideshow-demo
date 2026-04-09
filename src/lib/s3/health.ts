import { HeadBucketCommand } from '@aws-sdk/client-s3';
import type { S3Client } from '@aws-sdk/client-s3';
import { getS3Client } from './client';
import { getSettings } from '@/lib/settings/service';
import type { HealthStatus } from '@/types/api';

export async function checkS3Health(customClient?: S3Client): Promise<HealthStatus> {
    const settings = getSettings();
    const client = customClient || getS3Client();
    const start = Date.now();

    const base: Omit<HealthStatus, 'status'> = {
        endpoint: settings.endpoint,
        bucket: settings.bucketName,
        latencyMs: 0,
    };

    try {
        await client.send(new HeadBucketCommand({ Bucket: settings.bucketName }));
        return { ...base, status: 'ok', latencyMs: Date.now() - start };
    } catch (error) {
        const err = error as Error;
        const latencyMs = Date.now() - start;

        // AccessDenied means credentials work but permissions are limited — still reachable
        if (err.name === 'AccessDenied' || err.name === '403') {
            return { ...base, status: 'ok', latencyMs };
        }

        return { ...base, status: 'error', latencyMs, error: err.message };
    }
}
