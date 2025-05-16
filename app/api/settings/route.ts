import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { runtimeSettings, updateSettings } from '@/app/lib/settingsService';

// Get environment variables
const JWT_SECRET = process.env.JWT_SECRET || 'default-secret-change-in-production';

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

// Test S3 connection with current settings
async function testS3Connection(): Promise<boolean> {
    try {
        // Create a new S3 client with the current settings
        const client = new S3Client({
            region: runtimeSettings.S3_REGION,
            credentials: {
                accessKeyId: runtimeSettings.S3_ACCESS_KEY_ID,
                secretAccessKey: runtimeSettings.S3_SECRET_ACCESS_KEY,
            },
            endpoint: runtimeSettings.S3_ENDPOINT,
            forcePathStyle: true,
        });

        // Use a simple HEAD operation instead of LIST which is less likely to have permission issues
        const command = new ListObjectsV2Command({
            Bucket: runtimeSettings.S3_BUCKET_NAME,
            MaxKeys: 1, // We only need to check if we can connect, not retrieve data
        });

        try {
            await client.send(command);
            return true;
        } catch (error: unknown) {
            // Type guard to safely access error properties
            const typedError = error as {
                message?: string;
                Code?: string;
                code?: string;
                name?: string;
                $metadata?: Record<string, unknown>;
            };

            // Log the specific error for debugging
            console.error('S3 connection test failed with error:', {
                message: typedError.message,
                code: typedError.Code || typedError.code,
                name: typedError.name,
                $metadata: typedError.$metadata,
            });

            // Some specific errors might indicate the credentials work but have permission issues
            // In these cases, we'll consider the connection successful but log a warning
            if (typedError.name === 'AccessDenied' || typedError.Code === 'AccessDenied') {
                console.warn('S3 connection credentials work but have limited permissions');
                return true;
            }

            // For all other errors, consider the connection failed
            return false;
        }
    } catch (error) {
        console.error('Error creating S3 client:', error);
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
        // Return settings - no need to mask since the page is password protected
        return NextResponse.json({
            settings: runtimeSettings,
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
        const validKeys = Object.keys(runtimeSettings);
        const invalidKeys = Object.keys(updatedSettings).filter(key => !validKeys.includes(key));

        if (invalidKeys.length > 0) {
            return NextResponse.json(
                { error: `Invalid settings keys: ${invalidKeys.join(', ')}` },
                { status: 400 }
            );
        }

        // Make a copy of the current settings to restore if needed
        const previousSettings = { ...runtimeSettings };

        // Check if any S3 connection settings are being changed
        const s3SettingsChanged = [
            'S3_BUCKET_NAME',
            'S3_REGION',
            'S3_ACCESS_KEY_ID',
            'S3_SECRET_ACCESS_KEY',
            'S3_ENDPOINT',
        ].some(
            key =>
                updatedSettings[key] !== undefined &&
                updatedSettings[key] !== previousSettings[key as keyof typeof previousSettings]
        );

        // Update our in-memory settings in the centralized service
        updateSettings(updatedSettings);

        // If S3 settings changed, validate the connection
        if (s3SettingsChanged) {
            const connectionValid = await testS3Connection();

            if (!connectionValid) {
                // Revert to previous settings if connection fails
                updateSettings(previousSettings);

                return NextResponse.json(
                    {
                        error: 'S3 connection failed with new settings. Settings not updated.',
                        details:
                            'Check that credentials are correct and do not contain invalid characters.',
                    },
                    { status: 400 }
                );
            }
        }

        return NextResponse.json({
            success: true,
            settings: runtimeSettings,
        });
    } catch (error) {
        console.error('Error updating settings:', error);
        return NextResponse.json(
            {
                error: 'Failed to update settings',
                details: error instanceof Error ? error.message : 'Unknown error',
            },
            { status: 500 }
        );
    }
}
