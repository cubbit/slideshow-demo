import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

// Define the types for the settings
interface CubbitSettings {
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

// Get environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

// In-memory settings cache that will be updated on app restart
let currentSettings: CubbitSettings = {
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

// Helper to mask sensitive data
function maskSensitiveData(settings: CubbitSettings): Partial<CubbitSettings> {
    const maskedSettings = { ...settings };

    // Mask sensitive information
    if (maskedSettings.S3_SECRET_ACCESS_KEY) {
        maskedSettings.S3_SECRET_ACCESS_KEY =
            maskedSettings.S3_SECRET_ACCESS_KEY.substring(0, 4) + '••••••••••••';
    }

    if (maskedSettings.S3_ACCESS_KEY_ID) {
        maskedSettings.S3_ACCESS_KEY_ID =
            maskedSettings.S3_ACCESS_KEY_ID.substring(0, 4) + '••••••••••••';
    }

    return maskedSettings;
}

// Function to check if a user is authenticated
function isAuthenticated(request: NextRequest) {
    try {
        const token = request.cookies.get('auth_token')?.value;

        if (!token) {
            return false;
        }

        // Verify the token
        verify(token, JWT_SECRET);
        return true;
    } catch (error) {
        return false;
    }
}

// GET handler to retrieve current settings
export async function GET(request: NextRequest) {
    // Check authentication
    if (!isAuthenticated(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // Return masked settings for display
        return NextResponse.json({
            settings: maskSensitiveData(currentSettings),
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

// PATCH handler to update settings
export async function PATCH(request: NextRequest) {
    // Check authentication
    if (!isAuthenticated(request)) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const updatedSettings = await request.json();

        // Validate settings
        const validKeys = Object.keys(currentSettings);
        const invalidKeys = Object.keys(updatedSettings).filter(key => !validKeys.includes(key));

        if (invalidKeys.length > 0) {
            return NextResponse.json(
                { error: `Invalid settings keys: ${invalidKeys.join(', ')}` },
                { status: 400 }
            );
        }

        // Update our in-memory settings
        currentSettings = { ...currentSettings, ...updatedSettings };

        // Update environment variables for the runtime
        // Note: This only affects the current server instance and won't persist after restart
        if (updatedSettings.S3_BUCKET_NAME) {
            process.env.NEXT_PUBLIC_S3_BUCKET_NAME = updatedSettings.S3_BUCKET_NAME;
        }
        if (updatedSettings.MAX_FILE_SIZE) {
            process.env.NEXT_PUBLIC_MAX_FILE_SIZE = updatedSettings.MAX_FILE_SIZE;
        }
        if (updatedSettings.SLIDESHOW_SPEED_S) {
            process.env.NEXT_PUBLIC_SLIDESHOW_SPEED_S = updatedSettings.SLIDESHOW_SPEED_S;
        }
        if (updatedSettings.MIN_COUNT_FOR_MARQUEE) {
            process.env.NEXT_PUBLIC_MIN_COUNT_FOR_MARQUEE = updatedSettings.MIN_COUNT_FOR_MARQUEE;
        }
        if (updatedSettings.S3_REGION) {
            process.env.S3_REGION = updatedSettings.S3_REGION;
        }
        if (updatedSettings.S3_ACCESS_KEY_ID) {
            process.env.S3_ACCESS_KEY_ID = updatedSettings.S3_ACCESS_KEY_ID;
        }
        if (updatedSettings.S3_SECRET_ACCESS_KEY) {
            process.env.S3_SECRET_ACCESS_KEY = updatedSettings.S3_SECRET_ACCESS_KEY;
        }
        if (updatedSettings.S3_ENDPOINT) {
            process.env.NEXT_PUBLIC_S3_ENDPOINT = updatedSettings.S3_ENDPOINT;
        }
        if (updatedSettings.MULTIPART_THRESHOLD) {
            process.env.MULTIPART_THRESHOLD = updatedSettings.MULTIPART_THRESHOLD;
        }

        return NextResponse.json({
            success: true,
            settings: maskSensitiveData(currentSettings),
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
    }
}
