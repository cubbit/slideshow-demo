import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';
import winston from 'winston';
import { runtimeSettings } from '@/app/lib/settingsService';

// Configure Winston logger with structured logging
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
    defaultMeta: { service: 'image-list-api' },
    transports: [new winston.transports.Console()],
});

export async function GET() {
    try {
        // Construct prefix using today's date
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const prefix = `${year}/${month}/${day}/`;

        // Create a new S3 client with current settings
        const s3Client = new S3Client({
            region: runtimeSettings.S3_REGION,
            credentials: {
                accessKeyId: runtimeSettings.S3_ACCESS_KEY_ID,
                secretAccessKey: runtimeSettings.S3_SECRET_ACCESS_KEY,
            },
            endpoint: runtimeSettings.S3_ENDPOINT,
            forcePathStyle: true,
        });

        const command = new ListObjectsV2Command({
            Bucket: runtimeSettings.S3_BUCKET_NAME,
            Prefix: prefix,
        });

        logger.debug(`Performing GET request to ${runtimeSettings.S3_BUCKET_NAME}/${prefix}`);

        const response = await s3Client.send(command);
        const objects = response.Contents || [];

        // Filter to only include image files and create full URLs
        const imageRegex = /\.(jpg|jpeg|png|gif|webp)$/i;

        const images = objects
            .filter(obj => obj.Key && !obj.Key.endsWith('/') && imageRegex.test(obj.Key || ''))
            .map(obj => ({
                key: obj.Key,
                // Make sure the URL is properly formed
                url: `${runtimeSettings.S3_ENDPOINT}/${runtimeSettings.S3_BUCKET_NAME}/${obj.Key}`,
                lastModified: obj.LastModified?.toISOString(),
                size: obj.Size,
            }));

        logger.info(`Listed ${images.length} images`);

        // Add debug info to response headers
        return NextResponse.json(images, {
            headers: {
                'X-Images-Count': String(images.length),
                'Cache-Control': 'no-store, max-age=0',
            },
        });
    } catch (error) {
        logger.error('Error listing S3 objects:', error);

        // Return empty array with error info
        return NextResponse.json([], {
            status: 200, // Still return 200 to prevent breaking the UI
            headers: {
                'X-Error': (error as { message: string }).message || 'Unknown error',
                'X-Error-Type': (error as { name: string }).name || 'Error',
            },
        });
    }
}
