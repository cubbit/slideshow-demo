'use client';

import { useState, useEffect } from 'react';

const btnBase: React.CSSProperties = {
    padding: '9px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    fontWeight: 500,
    cursor: 'pointer',
    transition: 'opacity 0.15s',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
};

const btnSecondary: React.CSSProperties = {
    ...btnBase,
    border: '1px solid rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.06)',
    color: '#FFFFFF',
};

const btnDanger: React.CSSProperties = {
    ...btnBase,
    border: '1px solid rgba(211,44,32,0.3)',
    backgroundColor: 'rgba(211,44,32,0.12)',
    color: '#EF5350',
};

function DownloadIcon() {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
    );
}

function TrashIcon() {
    return (
        <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
    );
}

export default function PhotoManagement() {
    const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState<string | null>(null);
    const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(
        null
    );

    const today = new Date().toISOString().split('T')[0];

    // Auto-dismiss message after 5 seconds
    useEffect(() => {
        if (!message) return;
        const timer = setTimeout(() => setMessage(null), 5000);
        return () => clearTimeout(timer);
    }, [message]);

    function dateToApi(d: string): string {
        return d.replace(/-/g, '/');
    }

    async function handleDownload(allDays: boolean) {
        const param = !allDays && date ? `?date=${dateToApi(date)}` : '';
        const label = allDays ? 'all photos' : `photos for ${date}`;
        setLoading(`download-${allDays ? 'all' : 'day'}`);
        setMessage(null);

        try {
            const res = await fetch(`/api/photos/bulk${param}`);
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `HTTP ${res.status}`);
            }

            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download =
                res.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') ||
                'photos.zip';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setMessage({ text: `Downloaded ${label}`, type: 'success' });
        } catch (e) {
            setMessage({ text: `Failed to download: ${(e as Error).message}`, type: 'error' });
        } finally {
            setLoading(null);
        }
    }

    async function handleDelete(allDays: boolean) {
        const label = allDays ? 'ALL photos from ALL days' : `all photos for ${date}`;
        if (!confirm(`Are you sure you want to delete ${label}? This cannot be undone.`)) return;

        const param = !allDays && date ? `?date=${dateToApi(date)}` : '';
        setLoading(`delete-${allDays ? 'all' : 'day'}`);
        setMessage(null);

        try {
            const res = await fetch(`/api/photos/bulk${param}`, { method: 'DELETE' });
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error || `HTTP ${res.status}`);
            }

            const data = await res.json();
            setMessage({ text: `Deleted ${data.deleted} photos`, type: 'success' });
        } catch (e) {
            setMessage({ text: `Failed to delete: ${(e as Error).message}`, type: 'error' });
        } finally {
            setLoading(null);
        }
    }

    const daySelected = date.length > 0;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Day picker */}
            <div>
                <label
                    style={{
                        fontSize: '13px',
                        fontWeight: 500,
                        color: 'rgba(255,255,255,0.5)',
                        display: 'block',
                        marginBottom: '6px',
                    }}
                >
                    Select a day
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input
                        type="date"
                        value={date}
                        max={today}
                        onChange={e => setDate(e.target.value)}
                        style={{
                            flex: 1,
                            padding: '8px 12px',
                            borderRadius: '8px',
                            border: '1px solid rgba(255,255,255,0.1)',
                            backgroundColor: 'rgba(255,255,255,0.04)',
                            color: '#FFFFFF',
                            fontSize: '14px',
                            colorScheme: 'dark',
                        }}
                    />
                    <button
                        onClick={() => handleDownload(false)}
                        disabled={!daySelected || loading !== null}
                        className="disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
                        style={btnSecondary}
                        title="Download photos for this day"
                    >
                        <DownloadIcon />
                        {loading === 'download-day' ? 'Downloading...' : 'Download'}
                    </button>
                    <button
                        onClick={() => handleDelete(false)}
                        disabled={!daySelected || loading !== null}
                        className="disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
                        style={btnDanger}
                        title="Delete photos for this day"
                    >
                        <TrashIcon />
                        {loading === 'delete-day' ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>

            {/* All photos */}
            <div
                style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 16px',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.06)',
                }}
            >
                <span style={{ fontSize: '13px', fontWeight: 500, color: 'rgba(255,255,255,0.6)' }}>
                    All photos (all days)
                </span>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        onClick={() => handleDownload(true)}
                        disabled={loading !== null}
                        className="disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
                        style={btnSecondary}
                    >
                        <DownloadIcon />
                        {loading === 'download-all' ? 'Downloading...' : 'Download all'}
                    </button>
                    <button
                        onClick={() => handleDelete(true)}
                        disabled={loading !== null}
                        className="disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80"
                        style={btnDanger}
                    >
                        <TrashIcon />
                        {loading === 'delete-all' ? 'Deleting...' : 'Delete all'}
                    </button>
                </div>
            </div>

            {/* Status message */}
            {message && (
                <div
                    style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        fontSize: '13px',
                        backgroundColor:
                            message.type === 'success'
                                ? 'rgba(38,171,117,0.1)'
                                : 'rgba(211,44,32,0.1)',
                        color: message.type === 'success' ? '#26AB75' : '#D32C20',
                        border: `1px solid ${message.type === 'success' ? 'rgba(38,171,117,0.2)' : 'rgba(211,44,32,0.2)'}`,
                    }}
                >
                    {message.text}
                </div>
            )}
        </div>
    );
}
