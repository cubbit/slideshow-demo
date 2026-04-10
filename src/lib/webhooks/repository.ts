import { v4 as uuid } from 'uuid';
import { getDb } from '@/lib/db/index';
import type { WebhookConfig, WebhookEventType } from '@/types/webhook';

interface WebhookRow {
    id: string;
    name: string;
    url: string;
    secret: string;
    enabled: number;
    on_upload_started: number;
    on_upload_progress: number;
    on_upload_completed: number;
    on_upload_failed: number;
    on_batch_started: number;
    on_batch_completed: number;
    on_photo_download_started: number;
    on_photo_download_completed: number;
    on_photos_download_started: number;
    on_photos_download_completed: number;
    on_photo_deleted: number;
    on_photos_deleted: number;
    on_s3_health_changed: number;
    created_at: string;
    updated_at: string;
}

const EVENT_TO_COLUMN: Record<WebhookEventType, keyof WebhookRow> = {
    'upload.started': 'on_upload_started',
    'upload.progress': 'on_upload_progress',
    'upload.completed': 'on_upload_completed',
    'upload.failed': 'on_upload_failed',
    'batch.started': 'on_batch_started',
    'batch.completed': 'on_batch_completed',
    'photo.download.started': 'on_photo_download_started',
    'photo.download.completed': 'on_photo_download_completed',
    'photos.download.started': 'on_photos_download_started',
    'photos.download.completed': 'on_photos_download_completed',
    'photo.deleted': 'on_photo_deleted',
    'photos.deleted': 'on_photos_deleted',
    's3.health.changed': 'on_s3_health_changed',
};

function rowToConfig(row: WebhookRow): WebhookConfig {
    return {
        id: row.id,
        name: row.name,
        url: row.url,
        secret: row.secret,
        enabled: row.enabled === 1,
        onUploadStarted: row.on_upload_started === 1,
        onUploadProgress: row.on_upload_progress === 1,
        onUploadCompleted: row.on_upload_completed === 1,
        onUploadFailed: row.on_upload_failed === 1,
        onBatchStarted: row.on_batch_started === 1,
        onBatchCompleted: row.on_batch_completed === 1,
        onPhotoDownloadStarted: row.on_photo_download_started === 1,
        onPhotoDownloadCompleted: row.on_photo_download_completed === 1,
        onPhotosDownloadStarted: row.on_photos_download_started === 1,
        onPhotosDownloadCompleted: row.on_photos_download_completed === 1,
        onPhotoDeleted: row.on_photo_deleted === 1,
        onPhotosDeleted: row.on_photos_deleted === 1,
        onS3HealthChanged: row.on_s3_health_changed === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
}

export function getAllWebhooks(): WebhookConfig[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM webhooks ORDER BY created_at ASC').all() as WebhookRow[];
    return rows.map(rowToConfig);
}

export function getWebhookById(id: string): WebhookConfig | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM webhooks WHERE id = ?').get(id) as WebhookRow | undefined;
    return row ? rowToConfig(row) : null;
}

export function getWebhooksForEvent(event: WebhookEventType): WebhookConfig[] {
    const column = EVENT_TO_COLUMN[event];
    if (!column) return [];
    const db = getDb();
    const rows = db
        .prepare(`SELECT * FROM webhooks WHERE enabled = 1 AND ${column} = 1`)
        .all() as WebhookRow[];
    return rows.map(rowToConfig);
}

export function createWebhook(
    config: Omit<WebhookConfig, 'id' | 'createdAt' | 'updatedAt'>
): WebhookConfig {
    const db = getDb();
    const id = uuid();
    db.prepare(
        `INSERT INTO webhooks (id, name, url, secret, enabled,
            on_upload_started, on_upload_progress, on_upload_completed, on_upload_failed,
            on_batch_started, on_batch_completed,
            on_photo_download_started, on_photo_download_completed,
            on_photos_download_started, on_photos_download_completed,
            on_photo_deleted, on_photos_deleted,
            on_s3_health_changed)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
        id,
        config.name,
        config.url,
        config.secret,
        config.enabled ? 1 : 0,
        config.onUploadStarted ? 1 : 0,
        config.onUploadProgress ? 1 : 0,
        config.onUploadCompleted ? 1 : 0,
        config.onUploadFailed ? 1 : 0,
        config.onBatchStarted ? 1 : 0,
        config.onBatchCompleted ? 1 : 0,
        config.onPhotoDownloadStarted ? 1 : 0,
        config.onPhotoDownloadCompleted ? 1 : 0,
        config.onPhotosDownloadStarted ? 1 : 0,
        config.onPhotosDownloadCompleted ? 1 : 0,
        config.onPhotoDeleted ? 1 : 0,
        config.onPhotosDeleted ? 1 : 0,
        config.onS3HealthChanged ? 1 : 0
    );
    return getWebhookById(id)!;
}

export function updateWebhook(
    id: string,
    config: Partial<Omit<WebhookConfig, 'id' | 'createdAt' | 'updatedAt'>>
): WebhookConfig | null {
    const existing = getWebhookById(id);
    if (!existing) return null;

    const merged = { ...existing, ...config };
    const db = getDb();
    db.prepare(
        `UPDATE webhooks SET
            name = ?, url = ?, secret = ?, enabled = ?,
            on_upload_started = ?, on_upload_progress = ?, on_upload_completed = ?, on_upload_failed = ?,
            on_batch_started = ?, on_batch_completed = ?,
            on_photo_download_started = ?, on_photo_download_completed = ?,
            on_photos_download_started = ?, on_photos_download_completed = ?,
            on_photo_deleted = ?, on_photos_deleted = ?,
            on_s3_health_changed = ?,
            updated_at = datetime('now')
        WHERE id = ?`
    ).run(
        merged.name,
        merged.url,
        merged.secret,
        merged.enabled ? 1 : 0,
        merged.onUploadStarted ? 1 : 0,
        merged.onUploadProgress ? 1 : 0,
        merged.onUploadCompleted ? 1 : 0,
        merged.onUploadFailed ? 1 : 0,
        merged.onBatchStarted ? 1 : 0,
        merged.onBatchCompleted ? 1 : 0,
        merged.onPhotoDownloadStarted ? 1 : 0,
        merged.onPhotoDownloadCompleted ? 1 : 0,
        merged.onPhotosDownloadStarted ? 1 : 0,
        merged.onPhotosDownloadCompleted ? 1 : 0,
        merged.onPhotoDeleted ? 1 : 0,
        merged.onPhotosDeleted ? 1 : 0,
        merged.onS3HealthChanged ? 1 : 0,
        id
    );
    return getWebhookById(id);
}

export function deleteWebhook(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM webhooks WHERE id = ?').run(id);
    return result.changes > 0;
}
