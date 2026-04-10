'use client';

import { useRef } from 'react';
import { useDate } from '@/contexts/DateContext';

export default function DatePicker() {
    const { date, setDate } = useDate();
    const inputRef = useRef<HTMLInputElement>(null);

    const displayDate = new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    const today = new Date().toISOString().split('T')[0];
    const isToday = date === today;

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', position: 'relative' }}>
            <button
                onClick={() => inputRef.current?.showPicker()}
                style={{
                    fontSize: '14px',
                    color: isToday ? 'rgba(255,255,255,0.35)' : '#5498FF',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px 8px',
                    borderRadius: '6px',
                    transition: 'background-color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
            >
                {displayDate}
            </button>
            {!isToday && (
                <button
                    onClick={() => setDate(today)}
                    style={{
                        fontSize: '11px',
                        color: '#5498FF',
                        background: 'rgba(0,101,255,0.1)',
                        border: '1px solid rgba(0,101,255,0.2)',
                        borderRadius: '6px',
                        padding: '2px 8px',
                        cursor: 'pointer',
                        fontWeight: 500,
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
                onChange={e => setDate(e.target.value)}
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
