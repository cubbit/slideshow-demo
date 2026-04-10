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
    const effectiveRowCount = Math.min(rowCount, maxRows);
    const perRow = Math.ceil(photos.length / effectiveRowCount);

    const rows: PhotoMeta[][] = [];
    for (let i = 0; i < effectiveRowCount; i++) {
        rows.push(photos.slice(i * perRow, (i + 1) * perRow));
    }

    return rows;
}
