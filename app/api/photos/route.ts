// This can be used in a Next.js API route to optimize performance
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';
import { NextResponse } from 'next/server';

// Cache mechanism - use Node-Cache, Redis or similar in production
let photoCache: {
    date: string;
    photos: unknown[];
    lastUpdated: number;
} = {
    date: '',
    photos: [],
    lastUpdated: 0,
};

// Cache TTL in milliseconds (10 seconds)
const CACHE_TTL = 10000;

// Get S3 client
const getS3Client = () => {
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

// Get today's prefix
const getTodayPrefix = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return {
        prefix: `${year}/${month}/${day}/`,
        dateKey: `${year}-${month}-${day}`,
    };
};

export async function GET(req: Request) {
    try {
        const { prefix, dateKey } = getTodayPrefix();
        const now = Date.now();

        // Return cached response if valid and not expired
        if (
            photoCache.date === dateKey &&
            photoCache.photos.length > 0 &&
            now - photoCache.lastUpdated < CACHE_TTL
        ) {
            // Check if client sent If-None-Match header matching our ETag
            const url = new URL(req.url);
            const clientEtag = req.headers.get('If-None-Match');
            const serverEtag = `"${photoCache.lastUpdated}"`;

            if (clientEtag === serverEtag && !url.searchParams.has('nocache')) {
                // Return 304 Not Modified if ETags match and no cache busting
                return new Response(null, {
                    status: 304,
                    headers: {
                        'Cache-Control': 'max-age=10, stale-while-revalidate=30',
                        ETag: serverEtag,
                    },
                });
            }

            // Return cached results with ETag
            return NextResponse.json(photoCache.photos, {
                headers: {
                    'Cache-Control': 'max-age=10, stale-while-revalidate=30',
                    ETag: serverEtag,
                },
            });
        }

        // Fetch fresh data from S3
        const s3Client = getS3Client();
        const command = new ListObjectsV2Command({
            Bucket: process.env.NEXT_PUBLIC_S3_BUCKET_NAME!,
            Prefix: prefix,
        });

        const response = await s3Client.send(command);
        const objects = response.Contents || [];

        // Filter objects (only images, not folders)
        const validObjects = objects.filter(
            obj =>
                obj.Key &&
                !obj.Key.endsWith('/') &&
                /\.(jpg|jpeg|png|gif|webp)$/i.test(obj.Key || '')
        );

        // Map each S3 object to a photo object
        const photos = validObjects.map(obj => ({
            key: obj.Key,
            url: `${process.env.NEXT_PUBLIC_S3_ENDPOINT}/${process.env.NEXT_PUBLIC_S3_BUCKET_NAME}/${obj.Key}`,
            lastModified: obj.LastModified?.toISOString(),
            size: obj.Size,
        }));

        // Update cache
        photoCache = {
            date: dateKey,
            photos,
            lastUpdated: now,
        };

        // Return response with ETag for client-side caching
        return NextResponse.json(photos, {
            headers: {
                'Cache-Control': 'max-age=10, stale-while-revalidate=30',
                ETag: `"${now}"`,
            },
        });
    } catch (error: unknown) {
        console.error('Error listing S3 objects:', error);

        return NextResponse.json(
            {
                error: 'Error listing photos',
                message: error.message,
            },
            {
                status: 500,
            }
        );
    }
}
