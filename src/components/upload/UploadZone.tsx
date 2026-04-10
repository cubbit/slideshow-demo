'use client';

import { useRef, useState, useEffect, DragEvent } from 'react';
import { useUploadQueue } from '@/hooks/useUploadQueue';
import UploadItem from './UploadItem';

const ACCEPTED_TYPES = 'image/jpeg,image/png,image/gif,image/webp,image/bmp,image/tiff,image/heic,image/heif';

export default function UploadZone() {
    const { items, addFiles, removeFile, clearCompleted, processNext, isUploading } =
        useUploadQueue();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [dragActive, setDragActive] = useState(false);

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
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Drop zone */}
            <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                    border: dragActive ? '2px dashed #0065FF' : '2px dashed rgba(255,255,255,0.12)',
                    backgroundColor: dragActive ? 'rgba(0,101,255,0.05)' : 'rgba(255,255,255,0.03)',
                    borderRadius: '16px',
                    padding: '48px',
                    textAlign: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                }}
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
                    style={{ display: 'none' }}
                />

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '56px',
                            height: '56px',
                            borderRadius: '12px',
                            backgroundColor: 'rgba(255,255,255,0.06)',
                        }}
                    >
                        <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                        </svg>
                    </div>
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255,255,255,0.85)' }}>
                        Tap to select photos or drag & drop
                    </p>
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                        JPEG, PNG, GIF, WebP, HEIC — multiple selection supported
                    </p>
                </div>
            </div>

            {/* Queue */}
            {hasItems && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.5)' }}>
                            {items.length} file{items.length !== 1 ? 's' : ''}
                            {isUploading && ' — uploading...'}
                        </p>
                        {hasCompleted && (
                            <button
                                onClick={clearCompleted}
                                style={{ fontSize: '12px', fontWeight: 500, color: '#5498FF', background: 'none', border: 'none', cursor: 'pointer' }}
                            >
                                Clear completed
                            </button>
                        )}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {items.map(item => (
                            <UploadItem key={item.id} item={item} onRemove={removeFile} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
