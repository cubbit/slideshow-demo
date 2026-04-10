import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { WebhookConfig } from '@/types/webhook';

const mockWebhook: WebhookConfig = {
    id: 'wh-1',
    name: 'Test',
    url: 'https://example.com/hook',
    secret: '',
    enabled: true,
    onPhotoUploadStart: true,
    onPhotoUploadProgress: true,
    onPhotoUploadEnd: true,
    onPhotoUploadError: true,
    onPhotosUploadStart: true,
    onPhotosUploadProgress: true,
    onPhotosUploadEnd: true,
    onPhotosUploadError: true,
    onPhotoDownloadStart: true,
    onPhotoDownloadProgress: true,
    onPhotoDownloadEnd: true,
    onPhotosDownloadStart: true,
    onPhotosDownloadProgress: true,
    onPhotosDownloadEnd: true,
    onPhotoDeleteEnd: true,
    onPhotosDeleteEnd: true,
    onS3HealthChanged: true,
    createdAt: '',
    updatedAt: '',
};

const mockDispatch = vi.fn();
const mockGetWebhooks = vi.fn();

vi.mock('./repository', () => ({
    getWebhooksForEvent: (...args: unknown[]) => mockGetWebhooks(...args),
}));

vi.mock('./dispatcher', () => ({
    dispatchWebhook: (...args: unknown[]) => mockDispatch(...args),
}));

import { emitWebhookEvent } from './service';

describe('emitWebhookEvent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('dispatches to all matching webhooks', () => {
        const wh2 = { ...mockWebhook, id: 'wh-2' };
        mockGetWebhooks.mockReturnValue([mockWebhook, wh2]);

        emitWebhookEvent('photo.upload.start', {
            fileName: 'test.jpg',
            fileSize: 1000,
            mimeType: 'image/jpeg',
        });

        expect(mockDispatch).toHaveBeenCalledTimes(2);
    });

    it('does nothing when no webhooks match', () => {
        mockGetWebhooks.mockReturnValue([]);

        emitWebhookEvent('photo.upload.start', {
            fileName: 'test.jpg',
            fileSize: 1000,
            mimeType: 'image/jpeg',
        });

        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('includes uploadId in payload when provided', () => {
        mockGetWebhooks.mockReturnValue([mockWebhook]);

        emitWebhookEvent(
            'photo.upload.start',
            { fileName: 'test.jpg', fileSize: 1000, mimeType: 'image/jpeg' },
            { uploadId: 'up-123' }
        );

        const payload = mockDispatch.mock.calls[0][1];
        expect(payload.uploadId).toBe('up-123');
        expect(payload.event).toBe('photo.upload.start');
    });

    it('includes batchId in payload when provided', () => {
        mockGetWebhooks.mockReturnValue([mockWebhook]);

        emitWebhookEvent('photos.upload.start', { batchId: 'b-1', fileCount: 5 }, { batchId: 'b-1' });

        const payload = mockDispatch.mock.calls[0][1];
        expect(payload.batchId).toBe('b-1');
    });

    it('throttles progress events within 2s window', () => {
        mockGetWebhooks.mockReturnValue([mockWebhook]);

        const progressData = {
            fileName: 'test.jpg',
            percentage: 50,
            bytesUploaded: 500,
            totalBytes: 1000,
        };

        // First call should dispatch
        emitWebhookEvent('photo.upload.progress', progressData, { uploadId: 'up-1' });
        expect(mockDispatch).toHaveBeenCalledTimes(1);

        // Second call within 2s window should be throttled
        emitWebhookEvent('photo.upload.progress', progressData, { uploadId: 'up-1' });
        expect(mockDispatch).toHaveBeenCalledTimes(1);
    });

    it('does not throttle progress events for different uploads', () => {
        mockGetWebhooks.mockReturnValue([mockWebhook]);

        const progressData = {
            fileName: 'test.jpg',
            percentage: 50,
            bytesUploaded: 500,
            totalBytes: 1000,
        };

        emitWebhookEvent('photo.upload.progress', progressData, { uploadId: 'unique-a' });
        emitWebhookEvent('photo.upload.progress', progressData, { uploadId: 'unique-b' });

        expect(mockDispatch).toHaveBeenCalledTimes(2);
    });

    it('dispatches photo.download.start event', () => {
        mockGetWebhooks.mockReturnValue([mockWebhook]);

        emitWebhookEvent('photo.download.start', { key: 'photos/2026/04/10/test.jpg' });

        const payload = mockDispatch.mock.calls[0][1];
        expect(payload.event).toBe('photo.download.start');
        expect(payload.data.key).toBe('photos/2026/04/10/test.jpg');
    });

    it('dispatches photo.download.end event', () => {
        mockGetWebhooks.mockReturnValue([mockWebhook]);

        emitWebhookEvent('photo.download.end', { key: 'photos/2026/04/10/test.jpg' });

        const payload = mockDispatch.mock.calls[0][1];
        expect(payload.event).toBe('photo.download.end');
        expect(payload.data.key).toBe('photos/2026/04/10/test.jpg');
    });

    it('dispatches photos.download.start event', () => {
        mockGetWebhooks.mockReturnValue([mockWebhook]);

        emitWebhookEvent('photos.download.start', { photoCount: 10, date: '2026/04/10' });

        const payload = mockDispatch.mock.calls[0][1];
        expect(payload.event).toBe('photos.download.start');
        expect(payload.data.photoCount).toBe(10);
    });

    it('dispatches photos.download.progress event', () => {
        mockGetWebhooks.mockReturnValue([mockWebhook]);

        emitWebhookEvent('photos.download.progress', {
            photoCount: 10,
            completedCount: 5,
            date: '2026/04/10',
        });

        const payload = mockDispatch.mock.calls[0][1];
        expect(payload.event).toBe('photos.download.progress');
        expect(payload.data.photoCount).toBe(10);
        expect(payload.data.completedCount).toBe(5);
    });

    it('dispatches photos.upload.progress event', () => {
        mockGetWebhooks.mockReturnValue([mockWebhook]);

        emitWebhookEvent('photos.upload.progress', {
            batchId: 'b-1',
            fileCount: 5,
            completedCount: 3,
            successCount: 2,
            failedCount: 1,
        });

        const payload = mockDispatch.mock.calls[0][1];
        expect(payload.event).toBe('photos.upload.progress');
        expect(payload.data.completedCount).toBe(3);
    });

    it('dispatches photos.download.end event with date', () => {
        mockGetWebhooks.mockReturnValue([mockWebhook]);

        emitWebhookEvent('photos.download.end', { photoCount: 15, date: '2026/04/10' });

        const payload = mockDispatch.mock.calls[0][1];
        expect(payload.event).toBe('photos.download.end');
        expect(payload.data.photoCount).toBe(15);
        expect(payload.data.date).toBe('2026/04/10');
    });

    it('dispatches photo.delete.end event', () => {
        mockGetWebhooks.mockReturnValue([mockWebhook]);

        emitWebhookEvent('photo.delete.end', { key: 'photos/2026/04/10/test.jpg' });

        const payload = mockDispatch.mock.calls[0][1];
        expect(payload.event).toBe('photo.delete.end');
        expect(payload.data.key).toBe('photos/2026/04/10/test.jpg');
    });

    it('dispatches photos.delete.end event with count', () => {
        mockGetWebhooks.mockReturnValue([mockWebhook]);

        emitWebhookEvent('photos.delete.end', { deletedCount: 42, date: '2026/04/10' });

        const payload = mockDispatch.mock.calls[0][1];
        expect(payload.event).toBe('photos.delete.end');
        expect(payload.data.deletedCount).toBe(42);
    });

    it('never throws even if repository throws', () => {
        mockGetWebhooks.mockImplementation(() => {
            throw new Error('DB error');
        });

        expect(() =>
            emitWebhookEvent('photo.upload.start', {
                fileName: 'test.jpg',
                fileSize: 1000,
                mimeType: 'image/jpeg',
            })
        ).not.toThrow();
    });
});
