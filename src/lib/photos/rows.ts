import type { PhotoMeta } from '@/types/photo';

/**
 * Distribute photos evenly across a given number of rows.
 * Returns at most `rowCount` rows, each containing a slice of photos.
 * If there are fewer photos than `2 * rowCount`, the row count is reduced
 * to ensure at least 2 photos per row.
 */
export function distributeIntoRows(photos: PhotoMeta[], rowCount: number): PhotoMeta[][] {
    if (photos.length === 0) return [];

    const maxRows = Math.max(1, Math.floor(photos.length / 2));
    let effectiveRowCount = Math.min(rowCount, maxRows);

    // Reduce rows if the last row would be too short (less than half of others)
    while (effectiveRowCount > 1) {
        const perRow = Math.ceil(photos.length / effectiveRowCount);
        const lastRowCount = photos.length - perRow * (effectiveRowCount - 1);
        if (lastRowCount >= perRow / 2) break;
        effectiveRowCount--;
    }

    // Distribute evenly: some rows get one extra photo
    const base = Math.floor(photos.length / effectiveRowCount);
    const extra = photos.length % effectiveRowCount;

    const rows: PhotoMeta[][] = [];
    let offset = 0;
    for (let i = 0; i < effectiveRowCount; i++) {
        const count = base + (i < extra ? 1 : 0);
        rows.push(photos.slice(offset, offset + count));
        offset += count;
    }

    return rows;
}
