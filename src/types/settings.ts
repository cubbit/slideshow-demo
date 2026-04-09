export interface S3Settings {
    bucketName: string;
    prefix: string;
    endpoint: string;
    region: string;
    accessKeyId: string;
    secretAccessKey: string;
    multipartThreshold: number;
    maxFileSize: number;
}

export interface SlideshowSettings {
    speedS: number;
    rows: number;
    minCountForMarquee: number;
    cacheTtlS: number;
}

export interface AllSettings extends S3Settings, SlideshowSettings {}

export interface PublicSettings {
    bucketName: string;
    prefix: string;
    endpoint: string;
    speedS: number;
    rows: number;
    minCountForMarquee: number;
    maxFileSize: number;
}
