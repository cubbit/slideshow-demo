'use client';

import { useState, useEffect } from 'react';

export default function UploadDateBadge() {
    const [date, setDate] = useState<string>('');
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const stored = sessionStorage.getItem('slideshow-date') || today;
        setDate(stored);
    }, [today]);

    if (!date) return null;

    const isToday = date === today;
    const display = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: '8px',
                backgroundColor: isToday ? 'rgba(255,255,255,0.03)' : 'rgba(0,101,255,0.06)',
                border: `1px solid ${isToday ? 'rgba(255,255,255,0.06)' : 'rgba(0,101,255,0.15)'}`,
                marginBottom: '8px',
            }}
        >
            <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke={isToday ? 'rgba(255,255,255,0.4)' : '#5498FF'}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span
                style={{
                    fontSize: '13px',
                    color: isToday ? 'rgba(255,255,255,0.5)' : '#5498FF',
                    fontWeight: 500,
                }}
            >
                {isToday ? display : `Uploading to ${display}`}
            </span>
        </div>
    );
}
