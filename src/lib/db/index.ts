import fs from 'fs';
import path from 'path';
import Database from 'better-sqlite3';
import { initSchema } from './schema';

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data');
const DB_PATH = path.join(DATA_DIR, 'slideshow.db');

let db: Database.Database | null = null;

export function getDb(): Database.Database {
    if (!db) {
        fs.mkdirSync(DATA_DIR, { recursive: true });

        db = new Database(DB_PATH);
        db.pragma('journal_mode = WAL');
        db.pragma('foreign_keys = ON');

        initSchema(db);
    }
    return db;
}
