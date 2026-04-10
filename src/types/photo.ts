export interface PhotoMeta {
    key: string;
    url: string;
    thumbnailUrl: string;
    lastModified: string;
    size: number;
}

export interface PhotoPage {
    photos: PhotoMeta[];
    nextCursor: string | null;
    totalCount: number;
    hasMore: boolean;
}
