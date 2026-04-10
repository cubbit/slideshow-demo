import { getDb } from './index';
import type { AllSettings } from '@/types/settings';

interface AuthRow {
    password_hash: string;
    jwt_secret: string;
}

interface SettingsRow {
    s3_bucket_name: string;
    s3_prefix: string;
    s3_endpoint: string;
    s3_region: string;
    s3_access_key_id: string;
    s3_secret_access_key: string;
    multipart_threshold: number;
    max_file_size: number;
    slideshow_speed_s: number;
    slideshow_rows: number;
    min_count_for_marquee: number;
    cache_ttl_s: number;
    uploads_enabled: number;
    updated_at: string;
}

export function getAuth(): AuthRow {
    const db = getDb();
    return db.prepare('SELECT password_hash, jwt_secret FROM auth WHERE id = 1').get() as AuthRow;
}

export function updatePasswordHash(newHash: string): void {
    const db = getDb();
    db.prepare(
        "UPDATE auth SET password_hash = ?, updated_at = datetime('now') WHERE id = 1"
    ).run(newHash);
}

export function getSettings(): AllSettings {
    const db = getDb();
    const row = db.prepare('SELECT * FROM settings WHERE id = 1').get() as SettingsRow;
    return {
        bucketName: row.s3_bucket_name,
        prefix: row.s3_prefix,
        endpoint: row.s3_endpoint,
        region: row.s3_region,
        accessKeyId: row.s3_access_key_id,
        secretAccessKey: row.s3_secret_access_key,
        multipartThreshold: row.multipart_threshold,
        maxFileSize: row.max_file_size,
        speedS: row.slideshow_speed_s,
        rows: row.slideshow_rows,
        minCountForMarquee: row.min_count_for_marquee,
        cacheTtlS: row.cache_ttl_s,
        uploadsEnabled: row.uploads_enabled === 1,
    };
}

export function updateSettings(settings: Partial<AllSettings>): AllSettings {
    const db = getDb();
    const current = getSettings();
    const merged = { ...current, ...settings };

    db.prepare(
        `UPDATE settings SET
            s3_bucket_name = ?, s3_prefix = ?, s3_endpoint = ?, s3_region = ?,
            s3_access_key_id = ?, s3_secret_access_key = ?,
            multipart_threshold = ?, max_file_size = ?,
            slideshow_speed_s = ?, slideshow_rows = ?,
            min_count_for_marquee = ?, cache_ttl_s = ?,
            uploads_enabled = ?,
            updated_at = datetime('now')
        WHERE id = 1`
    ).run(
        merged.bucketName,
        merged.prefix,
        merged.endpoint,
        merged.region,
        merged.accessKeyId,
        merged.secretAccessKey,
        merged.multipartThreshold,
        merged.maxFileSize,
        merged.speedS,
        merged.rows,
        merged.minCountForMarquee,
        merged.cacheTtlS,
        merged.uploadsEnabled ? 1 : 0
    );

    return merged;
}
