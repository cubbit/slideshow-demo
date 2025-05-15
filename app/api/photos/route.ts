import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';

// Create the S3 client
const createS3Client = () => {
    const { S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_REGION, NEXT_PUBLIC_S3_ENDPOINT } =
        process.env;

    return new S3Client({
        region: S3_REGION!,
        credentials: {
            accessKeyId: S3_ACCESS_KEY_ID!,
            secretAccessKey: S3_SECRET_ACCESS_KEY!,
        },
        endpoint: NEXT_PUBLIC_S3_ENDPOINT,
        forcePathStyle: true,
    });
};

export async function GET() {
    try {
        // Construct prefix using today's date
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const prefix = `${year}/${month}/${day}/`;

        const s3Client = createS3Client();

        const command = new ListObjectsV2Command({
            Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
            Prefix: prefix,
        });

        const response = await s3Client.send(command);
        const objects = response.Contents || [];

        // Filter to only include image files and create full URLs
        const imageRegex = /\.(jpg|jpeg|png|gif|webp)$/i;

        const images = objects
            .filter(obj => obj.Key && !obj.Key.endsWith('/') && imageRegex.test(obj.Key || ''))
            .map(obj => ({
                key: obj.Key,
                // Make sure the URL is properly formed
                url: `${process.env.NEXT_PUBLIC_S3_ENDPOINT}/${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}/${obj.Key}`,
                lastModified: obj.LastModified?.toISOString(),
                size: obj.Size,
            }));

        // Add debug info to response headers
        return NextResponse.json(images, {
            headers: {
                'X-Images-Count': String(images.length),
                'Cache-Control': 'no-store, max-age=0',
            },
        });
    } catch (error) {
        console.error('Error listing S3 objects:', error);

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
