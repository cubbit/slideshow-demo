import { describe, it, expect } from 'vitest';
import { formatFileSize } from './format';

describe('formatFileSize', () => {
    it('formats bytes', () => {
        expect(formatFileSize(0)).toBe('0 B');
        expect(formatFileSize(512)).toBe('512 B');
        expect(formatFileSize(1023)).toBe('1023 B');
    });

    it('formats kilobytes', () => {
        expect(formatFileSize(1024)).toBe('1.0 KB');
        expect(formatFileSize(1536)).toBe('1.5 KB');
        expect(formatFileSize(1024 * 100)).toBe('100.0 KB');
    });

    it('formats megabytes', () => {
        expect(formatFileSize(1024 * 1024)).toBe('1.0 MB');
        expect(formatFileSize(1024 * 1024 * 5.5)).toBe('5.5 MB');
        expect(formatFileSize(1024 * 1024 * 100)).toBe('100.0 MB');
    });
});
