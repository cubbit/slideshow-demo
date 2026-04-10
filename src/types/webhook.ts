export type WebhookEventType =
    | 'upload.started'
    | 'upload.progress'
    | 'upload.completed'
    | 'upload.failed'
    | 'batch.started'
    | 'batch.completed'
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

export interface S3HealthChangedData {
    status: 'ok' | 'error';
    previousStatus: 'ok' | 'error';
    endpoint: string;
    bucket: string;
    error?: string;
}
