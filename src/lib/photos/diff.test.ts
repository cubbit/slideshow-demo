import { describe, it, expect } from 'vitest';
import { shuffleArray, diffPhotos } from './diff';
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

describe('shuffleArray', () => {
    it('returns a new array with the same elements', () => {
        const input = [1, 2, 3, 4, 5];
        const result = shuffleArray(input);
        expect(result).toHaveLength(input.length);
        expect(result.sort()).toEqual(input.sort());
    });

    it('does not mutate the original array', () => {
        const input = [1, 2, 3];
        const copy = [...input];
        shuffleArray(input);
        expect(input).toEqual(copy);
    });

    it('handles empty array', () => {
        expect(shuffleArray([])).toEqual([]);
    });

    it('handles single element', () => {
        expect(shuffleArray([42])).toEqual([42]);
    });
});

describe('diffPhotos', () => {
    it('returns all incoming photos when existing is empty', () => {
        const incoming = [photo('a'), photo('b')];
        const result = diffPhotos([], incoming);
        expect(result).toHaveLength(2);
        expect(result.map(p => p.key).sort()).toEqual(['a', 'b']);
    });

    it('preserves order of existing photos', () => {
        const existing = [photo('c'), photo('a'), photo('b')];
        const incoming = [photo('a'), photo('b'), photo('c')];
        const result = diffPhotos(existing, incoming);
        expect(result.map(p => p.key)).toEqual(['c', 'a', 'b']);
    });

    it('removes photos not in incoming', () => {
        const existing = [photo('a'), photo('b'), photo('c')];
        const incoming = [photo('a'), photo('c')];
        const result = diffPhotos(existing, incoming);
        expect(result.map(p => p.key)).toEqual(['a', 'c']);
    });

    it('adds new photos from incoming', () => {
        const existing = [photo('a'), photo('b')];
        const incoming = [photo('a'), photo('b'), photo('c')];
        const result = diffPhotos(existing, incoming);
        expect(result).toHaveLength(3);
        expect(result.map(p => p.key)).toContain('c');
        // a and b should still be present
        expect(result.map(p => p.key)).toContain('a');
        expect(result.map(p => p.key)).toContain('b');
    });

    it('handles simultaneous adds and removes', () => {
        const existing = [photo('a'), photo('b'), photo('c')];
        const incoming = [photo('b'), photo('d'), photo('e')];
        const result = diffPhotos(existing, incoming);
        expect(result).toHaveLength(3);
        expect(result.map(p => p.key)).toContain('b');
        expect(result.map(p => p.key)).toContain('d');
        expect(result.map(p => p.key)).toContain('e');
        expect(result.map(p => p.key)).not.toContain('a');
        expect(result.map(p => p.key)).not.toContain('c');
    });

    it('preserves relative order of kept photos after removal', () => {
        const existing = [photo('a'), photo('b'), photo('c'), photo('d')];
        const incoming = [photo('a'), photo('c'), photo('d')];
        const result = diffPhotos(existing, incoming);
        const keys = result.map(p => p.key);
        expect(keys.indexOf('a')).toBeLessThan(keys.indexOf('c'));
        expect(keys.indexOf('c')).toBeLessThan(keys.indexOf('d'));
    });

    it('returns empty when both are empty', () => {
        expect(diffPhotos([], [])).toEqual([]);
    });

    it('returns empty when incoming is empty', () => {
        const existing = [photo('a'), photo('b')];
        expect(diffPhotos(existing, [])).toEqual([]);
    });

    it('is idempotent when no changes', () => {
        const existing = [photo('a'), photo('b'), photo('c')];
        const incoming = [photo('a'), photo('b'), photo('c')];
        const result = diffPhotos(existing, incoming);
        expect(result.map(p => p.key)).toEqual(['a', 'b', 'c']);
    });

    it('does not mutate existing array', () => {
        const existing = [photo('a'), photo('b')];
        const copy = existing.map(p => p.key);
        diffPhotos(existing, [photo('a'), photo('c')]);
        expect(existing.map(p => p.key)).toEqual(copy);
    });

    it('inserts new photos within visible range', () => {
        const existing = Array.from({ length: 20 }, (_, i) => photo(`p${i}`));
        const incoming = [...existing, photo('new1'), photo('new2')];
        // With visibleCount=3, new photos should be at index 0, 1, or 2
        const result = diffPhotos(existing, incoming, 3);
        const newIndices = [
            result.findIndex(p => p.key === 'new1'),
            result.findIndex(p => p.key === 'new2'),
        ];
        for (const idx of newIndices) {
            expect(idx).toBeLessThan(4); // within first few positions
        }
    });
});
