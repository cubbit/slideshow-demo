import type Database from 'better-sqlite3';
import crypto from 'crypto';
import { v4 as uuid } from 'uuid';
import { hashPassword } from '@/lib/auth/password';
import { getDefaults } from '@/lib/settings/defaults';
import logger from '@/lib/logger';

export function initSchema(db: Database.Database): void {
    db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            s3_bucket_name TEXT NOT NULL DEFAULT '',
            s3_prefix TEXT NOT NULL DEFAULT '',
            s3_endpoint TEXT NOT NULL DEFAULT '',
            s3_region TEXT NOT NULL DEFAULT 'eu-central-1',
            s3_access_key_id TEXT NOT NULL DEFAULT '',
            s3_secret_access_key TEXT NOT NULL DEFAULT '',
            multipart_threshold INTEGER NOT NULL DEFAULT 5242880,
            max_file_size INTEGER NOT NULL DEFAULT 10485760,
            slideshow_speed_s INTEGER NOT NULL DEFAULT 200,
            slideshow_rows INTEGER NOT NULL DEFAULT 3,
            min_count_for_marquee INTEGER NOT NULL DEFAULT 6,
            cache_ttl_s INTEGER NOT NULL DEFAULT 30,
            auto_rows INTEGER NOT NULL DEFAULT 1,
            uploads_enabled INTEGER NOT NULL DEFAULT 1,
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS auth (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            password_hash TEXT NOT NULL,
            jwt_secret TEXT NOT NULL,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );

        CREATE TABLE IF NOT EXISTS webhooks (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL DEFAULT '',
            url TEXT NOT NULL,
            secret TEXT NOT NULL DEFAULT '',
            enabled INTEGER NOT NULL DEFAULT 1,
            on_upload_started INTEGER NOT NULL DEFAULT 1,
            on_upload_progress INTEGER NOT NULL DEFAULT 0,
            on_upload_completed INTEGER NOT NULL DEFAULT 1,
            on_upload_failed INTEGER NOT NULL DEFAULT 1,
            on_batch_started INTEGER NOT NULL DEFAULT 1,
            on_batch_completed INTEGER NOT NULL DEFAULT 1,
            on_s3_health_changed INTEGER NOT NULL DEFAULT 0,
            created_at TEXT NOT NULL DEFAULT (datetime('now')),
            updated_at TEXT NOT NULL DEFAULT (datetime('now'))
        );
    `);

    // Seed settings from env vars on first run
    const settingsRow = db.prepare('SELECT id FROM settings WHERE id = 1').get();
    if (!settingsRow) {
        const defaults = getDefaults();
        db.prepare(
            `INSERT INTO settings (id, s3_bucket_name, s3_prefix, s3_endpoint, s3_region,
                s3_access_key_id, s3_secret_access_key, multipart_threshold, max_file_size,
                slideshow_speed_s, slideshow_rows, min_count_for_marquee, cache_ttl_s)
            VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        ).run(
            defaults.bucketName,
            defaults.prefix,
            defaults.endpoint,
            defaults.region,
            defaults.accessKeyId,
            defaults.secretAccessKey,
            defaults.multipartThreshold,
            defaults.maxFileSize,
            defaults.speedS,
            defaults.rows,
            defaults.minCountForMarquee,
            defaults.cacheTtlS
        );
        logger.info('Settings initialized from environment variables');
    }

    // Migrations: add columns if missing
    const migrations = [
        'ALTER TABLE settings ADD COLUMN uploads_enabled INTEGER NOT NULL DEFAULT 1',
        'ALTER TABLE settings ADD COLUMN auto_rows INTEGER NOT NULL DEFAULT 1',
    ];
    for (const sql of migrations) {
        try {
            db.exec(sql);
        } catch {
            /* column already exists */
        }
    }

    // Seed auth on first run
    const authRow = db.prepare('SELECT id FROM auth WHERE id = 1').get();
    if (!authRow) {
        const envPassword = process.env.ADMIN_PASSWORD;
        const password = envPassword || crypto.randomBytes(12).toString('base64url').slice(0, 16);
        const passwordHash = hashPassword(password);
        let jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            jwtSecret = crypto.randomBytes(64).toString('hex');
            logger.warn(
                'JWT_SECRET env var not set — generated a random secret. ' +
                    'Set JWT_SECRET in your environment to ensure middleware and app use the same secret.'
            );
            logger.info('Add JWT_SECRET to your .env.local or deployment config.');
        }

        db.prepare('INSERT INTO auth (id, password_hash, jwt_secret) VALUES (1, ?, ?)').run(
            passwordHash,
            jwtSecret
        );

        if (!envPassword) {
            logger.info('='.repeat(60));
            logger.info('ADMIN PASSWORD GENERATED');
            logger.info(`Password: ${password}`);
            logger.info('Change it from the admin panel at /admin/password');
            logger.info('='.repeat(60));
        } else {
            logger.info('Admin password set from ADMIN_PASSWORD environment variable');
        }
    }

    // Seed webhooks from env vars on first run
    seedWebhooksFromEnv(db);
}

export interface WebhookEnvEntry {
    name: string;
    url: string;
    secret: string;
    events?: Partial<Record<string, boolean>>;
}

/** Parse webhook definitions from environment variables (pure, no side effects). */
export function parseWebhooksFromEnv(): WebhookEnvEntry[] {
    const webhooks: WebhookEnvEntry[] = [];

    const webhooksJson = process.env.WEBHOOKS;
    if (webhooksJson) {
        try {
            const parsed = JSON.parse(webhooksJson);
            if (Array.isArray(parsed)) {
                webhooks.push(...parsed);
            }
        } catch {
            logger.warn('WEBHOOKS env var is not valid JSON, ignoring');
        }
    }

    const singleUrl = process.env.WEBHOOK_URL;
    if (singleUrl) {
        webhooks.push({
            name: process.env.WEBHOOK_NAME || '',
            url: singleUrl,
            secret: process.env.WEBHOOK_SECRET || '',
        });
    }

    return webhooks;
}

function seedWebhooksFromEnv(db: Database.Database): void {
    const existingCount = (
        db.prepare('SELECT COUNT(*) as count FROM webhooks').get() as { count: number }
    ).count;
    if (existingCount > 0) return;

    const webhooks = parseWebhooksFromEnv();
    if (webhooks.length === 0) return;

    const insert = db.prepare(
        `INSERT INTO webhooks (id, name, url, secret, enabled,
            on_upload_started, on_upload_progress, on_upload_completed, on_upload_failed,
            on_batch_started, on_batch_completed, on_s3_health_changed)
        VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (const wh of webhooks) {
        if (!wh.url || typeof wh.url !== 'string') {
            logger.warn('Skipping webhook with missing url', { webhook: wh });
            continue;
        }
        const events = wh.events || {};
        insert.run(
            uuid(),
            wh.name || '',
            wh.url,
            wh.secret || '',
            events.onUploadStarted !== false ? 1 : 0,
            events.onUploadProgress === true ? 1 : 0,
            events.onUploadCompleted !== false ? 1 : 0,
            events.onUploadFailed !== false ? 1 : 0,
            events.onBatchStarted !== false ? 1 : 0,
            events.onBatchCompleted !== false ? 1 : 0,
            events.onS3HealthChanged === true ? 1 : 0
        );
        logger.info('Webhook seeded from environment', { name: wh.name, url: wh.url });
    }
}
