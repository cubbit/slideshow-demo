import type Database from 'better-sqlite3';
import crypto from 'crypto';
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
        try { db.exec(sql); } catch { /* column already exists */ }
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

        db.prepare(
            'INSERT INTO auth (id, password_hash, jwt_secret) VALUES (1, ?, ?)'
        ).run(passwordHash, jwtSecret);

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
}
