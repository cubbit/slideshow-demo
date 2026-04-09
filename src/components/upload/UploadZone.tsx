'use client';

import { useRef, useState, useEffect, useCallback, DragEvent } from 'react';
import { useUploadQueue } from '@/hooks/useUploadQueue';
import UploadItem from './UploadItem';

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/gif,image/webp,image/bmp,image/tiff,image/heic,image/heif';

export default function UploadZone() {
    const { items, addFiles, removeFile, clearCompleted, processNext, isUploading } =
        useUploadQueue();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

    // Process queue whenever items change
    useEffect(() => {
        processNext();
    }, [items, processNext]);

    function handleFiles(files: FileList | null) {
        if (!files || files.length === 0) return;
        addFiles(Array.from(files));
    }

    function handleDrag(e: DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    }

    function handleDrop(e: DragEvent) {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        handleFiles(e.dataTransfer.files);
    }

    const hasCompleted = items.some(i => i.status === 'success');
    const hasItems = items.length > 0;

    return (
        <div className="w-full max-w-lg mx-auto space-y-4">
            {/* Drop zone */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                    dragActive
                        ? 'border-blue-500 bg-blue-500/5'
                        : 'border-[var(--border-primary)] hover:border-[var(--border-accent)]'
                }`}
            >
                <input
                    ref={fileInputRef}
                    type="file"
                    accept={ACCEPTED_TYPES}
                    multiple
                    onChange={e => {
                        handleFiles(e.target.files);
                        e.target.value = '';
                    }}
                    className="hidden"
                />

                <div className="space-y-2">
                    <div className="text-4xl text-[var(--text-tertiary)]">📷</div>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                        Tap to select photos or drag & drop
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                        JPEG, PNG, GIF, WebP, HEIC — multiple selection supported
                    </p>
                </div>
            </div>

            {/* Queue */}
            {hasItems && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-[var(--text-secondary)]">
                            {items.length} file{items.length !== 1 ? 's' : ''}
                            {isUploading && ' — uploading...'}
                        </p>
                        {hasCompleted && (
                            <button
                                onClick={clearCompleted}
                                className="text-xs text-[var(--text-accent)] hover:underline"
                            >
                                Clear completed
                            </button>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        {items.map(item => (
                            <UploadItem
                                key={item.id}
                                item={item}
                                onRemove={removeFile}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
