import { getSettings as dbGetSettings, updateSettings as dbUpdateSettings } from '@/lib/db/repository';
import type { AllSettings, PublicSettings } from '@/types/settings';

let cachedSettings: AllSettings | null = null;

export function getSettings(): AllSettings {
    if (!cachedSettings) {
        cachedSettings = dbGetSettings();
    }
    return cachedSettings;
}

export function updateSettings(settings: Partial<AllSettings>): AllSettings {
    const updated = dbUpdateSettings(settings);
    cachedSettings = updated;
    return updated;
}

export function invalidateCache(): void {
    cachedSettings = null;
}

export function getPublicSettings(): PublicSettings {
    const s = getSettings();
    return {
        bucketName: s.bucketName,
        prefix: s.prefix,
        endpoint: s.endpoint,
        speedS: s.speedS,
        rows: s.rows,
        minCountForMarquee: s.minCountForMarquee,
        maxFileSize: s.maxFileSize,
        autoRows: s.autoRows,
        uploadsEnabled: s.uploadsEnabled,
    };
}
