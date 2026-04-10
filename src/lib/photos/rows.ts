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

    // Reduce rows so each row has enough photos to fill the viewport width.
    // The marquee duplicates photos, so even a few photos loop seamlessly,
    // but we need at least 2 per row for the animation to work.
    while (effectiveRowCount > 1) {
        const minPerRow = Math.floor(photos.length / effectiveRowCount);
        if (minPerRow >= 2) break;
        effectiveRowCount--;
    }

    // Distribute evenly: first `extra` rows get one more photo
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
