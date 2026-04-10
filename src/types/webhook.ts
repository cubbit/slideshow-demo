export type WebhookEventType =
    // Single photo upload
    | 'photo.upload.start'
    | 'photo.upload.progress'
    | 'photo.upload.end'
    | 'photo.upload.error'
    // Batch upload
    | 'photos.upload.start'
    | 'photos.upload.progress'
    | 'photos.upload.end'
    | 'photos.upload.error'
    // Single photo download
    | 'photo.download.start'
    | 'photo.download.progress'
    | 'photo.download.end'
    // Bulk download
    | 'photos.download.start'
    | 'photos.download.progress'
    | 'photos.download.end'
    // Delete
    | 'photo.delete.end'
    | 'photos.delete.end'
    // System
    | 's3.health.changed';

export interface WebhookConfig {
    id: string;
    name: string;
    url: string;
    secret: string;
    enabled: boolean;
    onPhotoUploadStart: boolean;
    onPhotoUploadProgress: boolean;
    onPhotoUploadEnd: boolean;
    onPhotoUploadError: boolean;
    onPhotosUploadStart: boolean;
    onPhotosUploadProgress: boolean;
    onPhotosUploadEnd: boolean;
    onPhotosUploadError: boolean;
    onPhotoDownloadStart: boolean;
    onPhotoDownloadProgress: boolean;
    onPhotoDownloadEnd: boolean;
    onPhotosDownloadStart: boolean;
    onPhotosDownloadProgress: boolean;
    onPhotosDownloadEnd: boolean;
    onPhotoDeleteEnd: boolean;
    onPhotosDeleteEnd: boolean;
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
    | PhotoUploadStartData
    | PhotoUploadProgressData
    | PhotoUploadEndData
    | PhotoUploadErrorData
    | PhotosUploadStartData
    | PhotosUploadProgressData
    | PhotosUploadEndData
    | PhotosUploadErrorData
    | PhotoDownloadProgressData
    | BulkProgressData
    | SinglePhotoKeyData
    | BulkPhotosData
    | PhotosDeletedData
    | S3HealthChangedData;

export interface PhotoUploadStartData {
    fileName: string;
    fileSize: number;
    mimeType: string;
}

export interface PhotoUploadProgressData {
    fileName: string;
    percentage: number;
    bytesUploaded: number;
    totalBytes: number;
}

export interface PhotoUploadEndData {
    fileName: string;
    fileSize: number;
    key: string;
    url: string;
    thumbnailUrl: string;
}

export interface PhotoUploadErrorData {
    fileName: string;
    error: string;
}

export interface PhotosUploadStartData {
    batchId: string;
    fileCount: number;
}

export interface PhotosUploadProgressData {
    batchId: string;
    fileCount: number;
    completedCount: number;
    successCount: number;
    failedCount: number;
}

export interface PhotosUploadEndData {
    batchId: string;
    fileCount: number;
    successCount: number;
    failedCount: number;
}

export interface PhotosUploadErrorData {
    batchId: string;
    fileCount: number;
    error: string;
}

export interface PhotoDownloadProgressData {
    key: string;
    percentage: number;
    bytesDownloaded: number;
    totalBytes: number;
}

export interface SinglePhotoKeyData {
    key: string;
}

export interface BulkPhotosData {
    photoCount: number;
    date?: string;
}

export interface BulkProgressData {
    photoCount: number;
    completedCount: number;
    date?: string;
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
