'use client';

import { useState, useEffect, useRef } from 'react';

export default function UploadDateBadge() {
    const [date, setDate] = useState<string>('');
    const inputRef = useRef<HTMLInputElement>(null);
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        const stored = sessionStorage.getItem('slideshow-date') || today;
        setDate(stored);
    }, [today]);

    function handleChange(newDate: string) {
        setDate(newDate);
        sessionStorage.setItem('slideshow-date', newDate);
    }

    if (!date) return null;

    const isToday = date === today;
    const display = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '8px',
            backgroundColor: isToday ? 'rgba(255,255,255,0.03)' : 'rgba(0,101,255,0.06)',
            border: `1px solid ${isToday ? 'rgba(255,255,255,0.06)' : 'rgba(0,101,255,0.15)'}`,
            marginBottom: '8px',
            position: 'relative',
        }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={isToday ? 'rgba(255,255,255,0.4)' : '#5498FF'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <button
                onClick={() => inputRef.current?.showPicker()}
                style={{
                    fontSize: '13px',
                    color: isToday ? 'rgba(255,255,255,0.5)' : '#5498FF',
                    fontWeight: 500,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 0,
                }}
            >
                {isToday ? `Today — ${display}` : `Uploading to ${display}`}
            </button>
            {!isToday && (
                <button
                    onClick={() => handleChange(today)}
                    style={{
                        fontSize: '11px',
                        color: '#5498FF',
                        background: 'rgba(0,101,255,0.1)',
                        border: '1px solid rgba(0,101,255,0.2)',
                        borderRadius: '6px',
                        padding: '2px 8px',
                        cursor: 'pointer',
                        fontWeight: 500,
                        marginLeft: '4px',
                    }}
                >
                    Today
                </button>
            )}
            <input
                ref={inputRef}
                type="date"
                value={date}
                max={today}
                onChange={e => handleChange(e.target.value)}
                style={{
                    position: 'absolute',
                    opacity: 0,
                    width: 0,
                    height: 0,
                    pointerEvents: 'none',
                }}
            />
        </div>
    );
}
