// Define the types for the settings
export interface RuntimeSettings {
    S3_BUCKET_NAME: string;
    MAX_FILE_SIZE: string;
    SLIDESHOW_SPEED_S: string;
    MIN_COUNT_FOR_MARQUEE: string;
    S3_REGION: string;
    S3_ACCESS_KEY_ID: string;
    S3_SECRET_ACCESS_KEY: string;
    S3_ENDPOINT: string;
    MULTIPART_THRESHOLD: string;
}

// Global settings store that exists for the lifetime of the server
// This is initialized with environment variables but can be updated at runtime
export const runtimeSettings: RuntimeSettings = {
    S3_BUCKET_NAME: process.env.NEXT_PUBLIC_S3_BUCKET_NAME || '',
    MAX_FILE_SIZE: process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '',
    SLIDESHOW_SPEED_S: process.env.NEXT_PUBLIC_SLIDESHOW_SPEED_S || '',
    MIN_COUNT_FOR_MARQUEE: process.env.NEXT_PUBLIC_MIN_COUNT_FOR_MARQUEE || '',
    S3_REGION: process.env.S3_REGION || '',
    S3_ACCESS_KEY_ID: process.env.S3_ACCESS_KEY_ID || '',
    S3_SECRET_ACCESS_KEY: process.env.S3_SECRET_ACCESS_KEY || '',
    S3_ENDPOINT: process.env.NEXT_PUBLIC_S3_ENDPOINT || '',
    MULTIPART_THRESHOLD: process.env.MULTIPART_THRESHOLD || '',
};

// Helper function to get setting
export function getSetting<K extends keyof RuntimeSettings>(key: K): RuntimeSettings[K] {
    return runtimeSettings[key];
}

// Helper function to update setting
export function updateSetting<K extends keyof RuntimeSettings>(
    key: K,
    value: RuntimeSettings[K]
): void {
    runtimeSettings[key] = value;
}

// Helper function to update multiple settings
export function updateSettings(settings: Partial<RuntimeSettings>): void {
    Object.assign(runtimeSettings, settings);
}
