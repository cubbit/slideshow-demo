'use client';

import type { UploadItem as UploadItemType } from '@/hooks/useUploadQueue';

interface Props {
    item: UploadItemType;
    onRemove: (id: string) => void;
}

function formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadItem({ item, onRemove }: Props) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--bg-secondary)] border border-[var(--border-secondary)]">
            {/* Status indicator */}
            <div className="shrink-0">
                {item.status === 'pending' && (
                    <div className="w-5 h-5 rounded-full border-2 border-[var(--border-primary)]" />
                )}
                {item.status === 'uploading' && (
                    <div className="w-5 h-5 rounded-full border-2 border-blue-500 border-t-transparent animate-spin" />
                )}
                {item.status === 'success' && (
                    <div className="w-5 h-5 rounded-full bg-success flex items-center justify-center text-white text-xs">
                        ✓
                    </div>
                )}
                {item.status === 'error' && (
                    <div className="w-5 h-5 rounded-full bg-error flex items-center justify-center text-white text-xs">
                        ✕
                    </div>
                )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-primary)] truncate">{item.file.name}</p>
                <p className="text-xs text-[var(--text-tertiary)]">
                    {formatSize(item.file.size)}
                    {item.status === 'uploading' && ` — ${item.progress}%`}
                    {item.status === 'error' && (
                        <span className="text-error ml-1">{item.error}</span>
                    )}
                </p>

                {/* Progress bar */}
                {item.status === 'uploading' && (
                    <div className="mt-1.5 h-1 rounded-full bg-[var(--bg-tertiary)] overflow-hidden">
                        <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-200"
                            style={{ width: `${item.progress}%` }}
                        />
                    </div>
                )}
            </div>

            {/* Remove button */}
            {item.status !== 'uploading' && (
                <button
                    onClick={() => onRemove(item.id)}
                    className="shrink-0 text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors text-lg"
                    aria-label="Remove"
                >
                    ×
                </button>
            )}
        </div>
    );
}
