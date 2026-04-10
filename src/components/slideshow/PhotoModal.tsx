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
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm animate-modal-backdrop"
            onClick={onClose}
        >
            <div
                className="modal-panel animate-modal-content"
                onClick={e => e.stopPropagation()}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="" />

                <div className="modal-controls">
                    <button onClick={handleDownload} className="modal-btn modal-btn-secondary">
                        Download
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="modal-btn modal-btn-danger"
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>

                <button onClick={onClose} className="modal-close" aria-label="Close">
                    ×
                </button>
            </div>
        </div>
    );
}
