import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { WebhookConfig } from '@/types/webhook';

const mockWebhook: WebhookConfig = {
    id: 'wh-1',
    name: 'Test',
    url: 'https://example.com/hook',
    secret: '',
    enabled: true,
    onUploadStarted: true,
    onUploadProgress: true,
    onUploadCompleted: true,
    onUploadFailed: true,
    onBatchStarted: true,
    onBatchCompleted: true,
    onPhotoDownloadStarted: true,
    onPhotoDownloadCompleted: true,
    onPhotosDownloadStarted: true,
    onPhotosDownloadCompleted: true,
    onPhotoDeleted: true,
    onPhotosDeleted: true,
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

        emitWebhookEvent('upload.started', {
            fileName: 'test.jpg',
            fileSize: 1000,
            mimeType: 'image/jpeg',
        });

        expect(mockDispatch).toHaveBeenCalledTimes(2);
    });

    it('does nothing when no webhooks match', () => {
        mockGetWebhooks.mockReturnValue([]);

        emitWebhookEvent('upload.started', {
            fileName: 'test.jpg',
            fileSize: 1000,
            mimeType: 'image/jpeg',
        });

        expect(mockDispatch).not.toHaveBeenCalled();
    });

    it('includes uploadId in payload when provided', () => {
        mockGetWebhooks.mockReturnValue([mockWebhook]);

        emitWebhookEvent(
            'upload.started',
            { fileName: 'test.jpg', fileSize: 1000, mimeType: 'image/jpeg' },
            { uploadId: 'up-123' }
        );

        const payload = mockDispatch.mock.calls[0][1];
        expect(payload.uploadId).toBe('up-123');
        expect(payload.event).toBe('upload.started');
    });

    it('includes batchId in payload when provided', () => {
        mockGetWebhooks.mockReturnValue([mockWebhook]);

        emitWebhookEvent('batch.started', { batchId: 'b-1', fileCount: 5 }, { batchId: 'b-1' });

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
        emitWebhookEvent('upload.progress', progressData, { uploadId: 'up-1' });
        expect(mockDispatch).toHaveBeenCalledTimes(1);

        // Second call within 2s window should be throttled
        emitWebhookEvent('upload.progress', progressData, { uploadId: 'up-1' });
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

        emitWebhookEvent('upload.progress', progressData, { uploadId: 'unique-a' });
        emitWebhookEvent('upload.progress', progressData, { uploadId: 'unique-b' });

        expect(mockDispatch).toHaveBeenCalledTimes(2);
    });

    it('dispatches photo.download.started event', () => {
        mockGetWebhooks.mockReturnValue([mockWebhook]);

        emitWebhookEvent('photo.download.started', { key: 'photos/2026/04/10/test.jpg' });

        const payload = mockDispatch.mock.calls[0][1];
        expect(payload.event).toBe('photo.download.started');
        expect(payload.data.key).toBe('photos/2026/04/10/test.jpg');
    });

    it('dispatches photo.download.completed event', () => {
        mockGetWebhooks.mockReturnValue([mockWebhook]);

        emitWebhookEvent('photo.download.completed', { key: 'photos/2026/04/10/test.jpg' });

        const payload = mockDispatch.mock.calls[0][1];
        expect(payload.event).toBe('photo.download.completed');
        expect(payload.data.key).toBe('photos/2026/04/10/test.jpg');
    });

    it('dispatches photos.download.completed event with date', () => {
        mockGetWebhooks.mockReturnValue([mockWebhook]);

        emitWebhookEvent('photos.download.completed', { photoCount: 15, date: '2026/04/10' });

        const payload = mockDispatch.mock.calls[0][1];
        expect(payload.event).toBe('photos.download.completed');
        expect(payload.data.photoCount).toBe(15);
        expect(payload.data.date).toBe('2026/04/10');
    });

    it('dispatches photo.deleted event', () => {
        mockGetWebhooks.mockReturnValue([mockWebhook]);

        emitWebhookEvent('photo.deleted', { key: 'photos/2026/04/10/test.jpg' });

        const payload = mockDispatch.mock.calls[0][1];
        expect(payload.event).toBe('photo.deleted');
        expect(payload.data.key).toBe('photos/2026/04/10/test.jpg');
    });

    it('dispatches photos.deleted event with count', () => {
        mockGetWebhooks.mockReturnValue([mockWebhook]);

        emitWebhookEvent('photos.deleted', { deletedCount: 42, date: '2026/04/10' });

        const payload = mockDispatch.mock.calls[0][1];
        expect(payload.event).toBe('photos.deleted');
        expect(payload.data.deletedCount).toBe(42);
    });

    it('never throws even if repository throws', () => {
        mockGetWebhooks.mockImplementation(() => {
            throw new Error('DB error');
        });

        expect(() =>
            emitWebhookEvent('upload.started', {
                fileName: 'test.jpg',
                fileSize: 1000,
                mimeType: 'image/jpeg',
            })
        ).not.toThrow();
    });
});
