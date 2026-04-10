export type WebhookEventType =
    | 'upload.started'
    | 'upload.progress'
    | 'upload.completed'
    | 'upload.failed'
    | 'batch.started'
    | 'batch.completed'
    | 'photo.download.started'
    | 'photo.download.completed'
    | 'photos.download.started'
    | 'photos.download.completed'
    | 'photo.deleted'
    | 'photos.deleted'
    | 's3.health.changed';

export interface WebhookConfig {
    id: string;
    name: string;
    url: string;
    secret: string;
    enabled: boolean;
    onUploadStarted: boolean;
    onUploadProgress: boolean;
    onUploadCompleted: boolean;
    onUploadFailed: boolean;
    onBatchStarted: boolean;
    onBatchCompleted: boolean;
    onPhotoDownloadStarted: boolean;
    onPhotoDownloadCompleted: boolean;
    onPhotosDownloadStarted: boolean;
    onPhotosDownloadCompleted: boolean;
    onPhotoDeleted: boolean;
    onPhotosDeleted: boolean;
    onS3HealthChanged: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface WebhookPayload {
    event: WebhookEventType;
    uploadId?: string;
    batchId?: string;
    timestamp: string;
    data: WebhookEventData;
}

export type WebhookEventData =
    | UploadStartedData
    | UploadProgressData
    | UploadCompletedData
    | UploadFailedData
    | BatchStartedData
    | BatchCompletedData
    | PhotoDownloadStartedData
    | PhotoDownloadCompletedData
    | PhotosDownloadStartedData
    | PhotosDownloadCompletedData
    | PhotoDeletedData
    | PhotosDeletedData
    | S3HealthChangedData;

export interface UploadStartedData {
    fileName: string;
    fileSize: number;
    mimeType: string;
}

export interface UploadProgressData {
    fileName: string;
    percentage: number;
    bytesUploaded: number;
    totalBytes: number;
}

export interface UploadCompletedData {
    fileName: string;
    fileSize: number;
    key: string;
    url: string;
    thumbnailUrl: string;
}

export interface UploadFailedData {
    fileName: string;
    error: string;
}

export interface BatchStartedData {
    batchId: string;
    fileCount: number;
}

export interface BatchCompletedData {
    batchId: string;
    fileCount: number;
    successCount: number;
    failedCount: number;
}

export interface PhotoDownloadStartedData {
    key: string;
}

export interface PhotoDownloadCompletedData {
    key: string;
}

export interface PhotosDownloadStartedData {
    photoCount: number;
    date?: string;
}

export interface PhotosDownloadCompletedData {
    photoCount: number;
    date?: string;
}

export interface PhotoDeletedData {
    key: string;
}

export interface PhotosDeletedData {
    deletedCount: number;
    date?: string;
}

export interface S3HealthChangedData {
    status: 'ok' | 'error';
    previousStatus: 'ok' | 'error';
    endpoint: string;
    bucket: string;
    error?: string;
}
