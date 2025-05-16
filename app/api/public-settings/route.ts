import { NextResponse } from 'next/server';
import { runtimeSettings } from '@/app/lib/settingsService';

// Define which settings are public and can be exposed to the client
const PUBLIC_SETTINGS = [
    'S3_BUCKET_NAME',
    'MAX_FILE_SIZE',
    'SLIDESHOW_SPEED_S',
    'MIN_COUNT_FOR_MARQUEE',
    'S3_ENDPOINT',
];

// Helper to mask sensitive data for public API
function getSafePublicSettings() {
    return PUBLIC_SETTINGS.reduce(
        (obj, key) => {
            obj[key] = runtimeSettings[key as keyof typeof runtimeSettings];
            return obj;
        },
        {} as Record<string, string>
    );
}

// Public GET handler to retrieve current public settings
export async function GET() {
    try {
        // Build a safe object with only public settings
        const publicSettings = getSafePublicSettings();

        return NextResponse.json({
            settings: publicSettings,
        });
    } catch (error) {
        console.error('Error fetching public settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}
