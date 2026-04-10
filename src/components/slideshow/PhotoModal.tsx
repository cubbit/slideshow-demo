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
                style={{
                    position: 'relative',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    maxWidth: '85vw',
                    maxHeight: '85vh',
                    padding: '32px',
                    backgroundColor: 'rgba(22, 22, 33, 0.9)',
                    borderRadius: '16px',
                    border: '1px solid rgba(255,255,255,0.08)',
                }}
                onClick={e => e.stopPropagation()}
            >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                    src={photo.url}
                    alt=""
                    style={{
                        maxWidth: '100%',
                        maxHeight: 'calc(85vh - 120px)',
                        borderRadius: '12px',
                        objectFit: 'contain',
                    }}
                />

                {/* Controls */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.06)', flexShrink: 0, width: '100%', justifyContent: 'center' }}>
                    <button
                        onClick={handleDownload}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#FFFFFF',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            cursor: 'pointer',
                            transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)')}
                        onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
                    >
                        Download
                    </button>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        style={{
                            padding: '10px 24px',
                            borderRadius: '10px',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#FFFFFF',
                            backgroundColor: '#D32C20',
                            border: 'none',
                            cursor: deleting ? 'not-allowed' : 'pointer',
                            opacity: deleting ? 0.5 : 1,
                            transition: 'background-color 0.2s',
                        }}
                        onMouseEnter={e => { if (!deleting) e.currentTarget.style.backgroundColor = '#b82519'; }}
                        onMouseLeave={e => { if (!deleting) e.currentTarget.style.backgroundColor = '#D32C20'; }}
                    >
                        {deleting ? 'Deleting...' : 'Delete'}
                    </button>
                </div>

                {/* Close button */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '4px',
                        right: '4px',
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.2)',
                        color: '#FFFFFF',
                        fontSize: '18px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        cursor: 'pointer',
                        transition: 'background-color 0.2s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)')}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)')}
                >
                    ×
                </button>
            </div>
        </div>
    );
}
