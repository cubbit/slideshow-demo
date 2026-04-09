'use client';

import { useEffect, useState } from 'react';
import type { PhotoMeta } from '@/types/photo';

interface Props {
    photo: PhotoMeta;
    onClose: () => void;
}

export default function PhotoModal({ photo, onClose }: Props) {
    const [deleting, setDeleting] = useState(false);

    // Close on Escape
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    async function handleDelete() {
        if (!confirm('Delete this photo?')) return;
        setDeleting(true);
        try {
            const keyPath = photo.key.split('/').map(encodeURIComponent).join('/');
            const res = await fetch(`/api/photos/${keyPath}`, { method: 'DELETE' });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `HTTP ${res.status}`);
            }
            onClose();
        } catch {
            setDeleting(false);
            alert('Failed to delete photo. Please try again.');
        }
    }

    function handleDownload() {
        const a = document.createElement('a');
        a.href = photo.url;
        a.download = photo.key.split('/').pop() || 'photo';
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="relative max-w-[90vw] max-h-[90vh]"
                onClick={e => e.stopPropagation()}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={photo.url}
                    alt=""
                    className="max-w-full max-h-[80vh] rounded-lg object-contain"
                />

                {/* Controls */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                    <button
                        onClick={handleDownload}
                        className="px-4 py-2 rounded-lg bg-white/10 backdrop-blur-sm text-white text-sm hover:bg-white/20 transition-colors border border-white/20"
                    >
                        Download
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="px-4 py-2 rounded-lg bg-error/80 text-white text-sm hover:bg-error transition-colors disabled:opacity-50"
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white/10 backdrop-blur-sm text-white flex items-center justify-center hover:bg-white/20 transition-colors border border-white/20"
                >
                    ×
                </button>
            </div>
        </div>
    );
}
