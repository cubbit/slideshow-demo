import { ListObjectsV2Command } from '@aws-sdk/client-s3';
import { getS3Client } from './client';
import { getTodayPrefix, buildS3Url } from './utils';
import { getSettings } from '@/lib/settings/service';
import { THUMBNAIL_PREFIX, SUPPORTED_EXTENSIONS } from '@/lib/constants';
import type { PhotoMeta, PhotoPage } from '@/types/photo';

interface CacheEntry {
    photos: PhotoMeta[];
    fetchedAt: number;
}

const MAX_CACHE_ENTRIES = 10;
const cache = new Map<string, CacheEntry>();

function isImageKey(key: string): boolean {
    const ext = key.split('.').pop()?.toLowerCase() || '';
    return SUPPORTED_EXTENSIONS.includes(ext as typeof SUPPORTED_EXTENSIONS[number]);
}

export function invalidatePhotoCache(datePrefix?: string): void {
    if (datePrefix) {
        cache.delete(datePrefix);
    } else {
        cache.clear();
    }
}

async function fetchAllPhotos(datePrefix: string): Promise<PhotoMeta[]> {
    const settings = getSettings();
    const client = getS3Client();
    const prefix = settings.prefix
        ? `${settings.prefix}/${datePrefix}/`
        : `${datePrefix}/`;

    const photos: PhotoMeta[] = [];
    let continuationToken: string | undefined;

    do {
        const response = await client.send(
            new ListObjectsV2Command({
                Bucket: settings.bucketName,
                Prefix: prefix,
                ContinuationToken: continuationToken,
                MaxKeys: 1000,
            })
        );

        for (const obj of response.Contents || []) {
            if (!obj.Key || !isImageKey(obj.Key)) continue;
            // Skip thumbnails
            if (obj.Key.includes(`/${THUMBNAIL_PREFIX}/`)) continue;

            const thumbnailKey = obj.Key.replace(
                /\/([^/]+)$/,
                `/${THUMBNAIL_PREFIX}/$1`
            ).replace(/\.[^.]+$/, '_thumb.jpg');

            photos.push({
                key: obj.Key,
                url: `/api/photos/${obj.Key}`,
                thumbnailUrl: `/api/photos/${thumbnailKey}`,
                lastModified: obj.LastModified?.toISOString() || '',
                size: obj.Size || 0,
            });
        }

        continuationToken = response.NextContinuationToken;
    } while (continuationToken);

    // Sort by most recent first
    photos.sort(
        (a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime()
    );

    return photos;
}

export async function getPhotos(
    date?: string,
    cursor?: string,
    limit: number = 200
): Promise<PhotoPage> {
    const datePrefix = date || getTodayPrefix();
    const settings = getSettings();
    const cacheTtl = settings.cacheTtlS * 1000;

    // Check cache
    const cached = cache.get(datePrefix);
    if (cached && Date.now() - cached.fetchedAt < cacheTtl) {
        return paginatePhotos(cached.photos, cursor, limit);
    }

    // Fetch from S3
    const photos = await fetchAllPhotos(datePrefix);
    // Evict oldest entry if cache is at capacity
    if (cache.size >= MAX_CACHE_ENTRIES && !cache.has(datePrefix)) {
        const oldestKey = cache.keys().next().value;
        if (oldestKey !== undefined) cache.delete(oldestKey);
    }
    cache.set(datePrefix, { photos, fetchedAt: Date.now() });

    return paginatePhotos(photos, cursor, limit);
}

function paginatePhotos(
    allPhotos: PhotoMeta[],
    cursor: string | undefined,
    limit: number
): PhotoPage {
    let startIndex = 0;
    if (cursor) {
        const idx = allPhotos.findIndex(p => p.key === cursor);
        if (idx >= 0) startIndex = idx + 1;
    }

    const slice = allPhotos.slice(startIndex, startIndex + limit);
    const hasMore = startIndex + limit < allPhotos.length;
    const nextCursor = hasMore ? slice[slice.length - 1]?.key || null : null;

    return {
        photos: slice,
        nextCursor,
        totalCount: allPhotos.length,
        hasMore,
    };
}
