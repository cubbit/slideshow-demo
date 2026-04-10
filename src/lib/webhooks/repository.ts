import { v4 as uuid } from 'uuid';
import { getDb } from '@/lib/db/index';
import type { WebhookConfig, WebhookEventType } from '@/types/webhook';

interface WebhookRow {
    id: string;
    name: string;
    url: string;
    secret: string;
    enabled: number;
    on_photo_upload_start: number;
    on_photo_upload_progress: number;
    on_photo_upload_end: number;
    on_photo_upload_error: number;
    on_photos_upload_start: number;
    on_photos_upload_progress: number;
    on_photos_upload_end: number;
    on_photos_upload_error: number;
    on_photo_download_start: number;
    on_photo_download_progress: number;
    on_photo_download_end: number;
    on_photos_download_start: number;
    on_photos_download_progress: number;
    on_photos_download_end: number;
    on_photo_delete_end: number;
    on_photos_delete_end: number;
    on_s3_health_changed: number;
    created_at: string;
    updated_at: string;
}

/**
 * Single source of truth mapping event types to their DB column and config field.
 * Adding a new event only requires a new entry here (plus the schema migration).
 */
const EVENT_FIELDS: {
    event: WebhookEventType;
    column: keyof WebhookRow;
    configKey: keyof WebhookConfig;
}[] = [
    { event: 'photo.upload.start', column: 'on_photo_upload_start', configKey: 'onPhotoUploadStart' },
    { event: 'photo.upload.progress', column: 'on_photo_upload_progress', configKey: 'onPhotoUploadProgress' },
    { event: 'photo.upload.end', column: 'on_photo_upload_end', configKey: 'onPhotoUploadEnd' },
    { event: 'photo.upload.error', column: 'on_photo_upload_error', configKey: 'onPhotoUploadError' },
    { event: 'photos.upload.start', column: 'on_photos_upload_start', configKey: 'onPhotosUploadStart' },
    { event: 'photos.upload.progress', column: 'on_photos_upload_progress', configKey: 'onPhotosUploadProgress' },
    { event: 'photos.upload.end', column: 'on_photos_upload_end', configKey: 'onPhotosUploadEnd' },
    { event: 'photos.upload.error', column: 'on_photos_upload_error', configKey: 'onPhotosUploadError' },
    { event: 'photo.download.start', column: 'on_photo_download_start', configKey: 'onPhotoDownloadStart' },
    { event: 'photo.download.progress', column: 'on_photo_download_progress', configKey: 'onPhotoDownloadProgress' },
    { event: 'photo.download.end', column: 'on_photo_download_end', configKey: 'onPhotoDownloadEnd' },
    { event: 'photos.download.start', column: 'on_photos_download_start', configKey: 'onPhotosDownloadStart' },
    { event: 'photos.download.progress', column: 'on_photos_download_progress', configKey: 'onPhotosDownloadProgress' },
    { event: 'photos.download.end', column: 'on_photos_download_end', configKey: 'onPhotosDownloadEnd' },
    { event: 'photo.delete.end', column: 'on_photo_delete_end', configKey: 'onPhotoDeleteEnd' },
    { event: 'photos.delete.end', column: 'on_photos_delete_end', configKey: 'onPhotosDeleteEnd' },
    { event: 's3.health.changed', column: 'on_s3_health_changed', configKey: 'onS3HealthChanged' },
];

const EVENT_TO_COLUMN: Record<WebhookEventType, keyof WebhookRow> = Object.fromEntries(
    EVENT_FIELDS.map(f => [f.event, f.column])
) as Record<WebhookEventType, keyof WebhookRow>;

const EVENT_COLUMNS = EVENT_FIELDS.map(f => f.column);
const EVENT_CONFIG_KEYS = EVENT_FIELDS.map(f => f.configKey);

function rowToConfig(row: WebhookRow): WebhookConfig {
    const config: Record<string, unknown> = {
        id: row.id,
        name: row.name,
        url: row.url,
        secret: row.secret,
        enabled: row.enabled === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
    };
    for (const { column, configKey } of EVENT_FIELDS) {
        config[configKey] = (row[column] as number) === 1;
    }
    return config as unknown as WebhookConfig;
}

/** Convert a WebhookConfig (or partial) into ordered boolean params for SQL statements. */
function eventBoolParams(config: Record<string, unknown>): number[] {
    return EVENT_CONFIG_KEYS.map(key => (config[key] ? 1 : 0));
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

const INSERT_COLUMNS = ['id', 'name', 'url', 'secret', 'enabled', ...EVENT_COLUMNS].join(', ');
const INSERT_PLACEHOLDERS = Array.from(
    { length: 5 + EVENT_COLUMNS.length },
    () => '?'
).join(', ');

export function createWebhook(
    config: Omit<WebhookConfig, 'id' | 'createdAt' | 'updatedAt'>
): WebhookConfig {
    const db = getDb();
    const id = uuid();
    db.prepare(`INSERT INTO webhooks (${INSERT_COLUMNS}) VALUES (${INSERT_PLACEHOLDERS})`).run(
        id,
        config.name,
        config.url,
        config.secret,
        config.enabled ? 1 : 0,
        ...eventBoolParams(config as unknown as Record<string, unknown>)
    );
    return getWebhookById(id)!;
}

const UPDATE_SET = [
    'name = ?',
    'url = ?',
    'secret = ?',
    'enabled = ?',
    ...EVENT_COLUMNS.map(col => `${col} = ?`),
    "updated_at = datetime('now')",
].join(', ');

export function updateWebhook(
    id: string,
    config: Partial<Omit<WebhookConfig, 'id' | 'createdAt' | 'updatedAt'>>
): WebhookConfig | null {
    const existing = getWebhookById(id);
    if (!existing) return null;

    const merged = { ...existing, ...config };
    const db = getDb();
    db.prepare(`UPDATE webhooks SET ${UPDATE_SET} WHERE id = ?`).run(
        merged.name,
        merged.url,
        merged.secret,
        merged.enabled ? 1 : 0,
        ...eventBoolParams(merged as unknown as Record<string, unknown>),
        id
    );
    return getWebhookById(id);
}

export function deleteWebhook(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM webhooks WHERE id = ?').run(id);
    return result.changes > 0;
}
