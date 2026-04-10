import { describe, it, expect } from 'vitest';
import { distributeIntoRows } from './rows';
import type { PhotoMeta } from '@/types/photo';

function photo(key: string): PhotoMeta {
    return {
        key,
        url: `http://example.com/${key}`,
        thumbnailUrl: `http://example.com/${key}_thumb`,
        lastModified: new Date().toISOString(),
        size: 1000,
    };
}

describe('distributeIntoRows', () => {
    it('returns empty array for no photos', () => {
        expect(distributeIntoRows([], 3)).toEqual([]);
    });

    it('returns single row when only 1 photo', () => {
        const photos = [photo('a')];
        const rows = distributeIntoRows(photos, 3);
        expect(rows).toHaveLength(1);
        expect(rows[0]).toHaveLength(1);
    });

    it('distributes photos evenly across rows', () => {
        const photos = Array.from({ length: 9 }, (_, i) => photo(`p${i}`));
        const rows = distributeIntoRows(photos, 3);
        expect(rows).toHaveLength(3);
        expect(rows[0]).toHaveLength(3);
        expect(rows[1]).toHaveLength(3);
        expect(rows[2]).toHaveLength(3);
    });

    it('reduces row count when too few photos', () => {
        const photos = [photo('a'), photo('b'), photo('c')];
        // 3 photos, requested 5 rows -> maxRows = 1 (floor(3/2))
        const rows = distributeIntoRows(photos, 5);
        expect(rows).toHaveLength(1);
        expect(rows[0]).toHaveLength(3);
    });

    it('handles uneven distribution with last row shorter', () => {
        const photos = Array.from({ length: 7 }, (_, i) => photo(`p${i}`));
        const rows = distributeIntoRows(photos, 3);
        expect(rows).toHaveLength(3);
        // perRow = ceil(7/3) = 3
        expect(rows[0]).toHaveLength(3);
        expect(rows[1]).toHaveLength(3);
        expect(rows[2]).toHaveLength(1);
    });

    it('preserves photo order within rows', () => {
        const photos = Array.from({ length: 6 }, (_, i) => photo(`p${i}`));
        const rows = distributeIntoRows(photos, 2);
        expect(rows[0].map(p => p.key)).toEqual(['p0', 'p1', 'p2']);
        expect(rows[1].map(p => p.key)).toEqual(['p3', 'p4', 'p5']);
    });

    it('includes all photos across all rows', () => {
        const photos = Array.from({ length: 10 }, (_, i) => photo(`p${i}`));
        const rows = distributeIntoRows(photos, 3);
        const allKeys = rows.flat().map(p => p.key);
        expect(allKeys).toHaveLength(10);
        for (let i = 0; i < 10; i++) {
            expect(allKeys).toContain(`p${i}`);
        }
    });
});
