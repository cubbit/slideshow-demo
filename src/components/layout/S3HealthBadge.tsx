'use client';

import { useState, useEffect } from 'react';

export default function S3HealthBadgeClient() {
    const [status, setStatus] = useState<'ok' | 'error' | 'loading'>('loading');

    useEffect(() => {
        async function check() {
            try {
                const res = await fetch('/api/health');
                const data = await res.json();
                setStatus(data.status === 'ok' ? 'ok' : 'error');
            } catch {
                setStatus('error');
            }
        }

        check();
        const interval = setInterval(check, 30000);
        return () => clearInterval(interval);
    }, []);

    const colorMap = { ok: 'bg-success', error: 'bg-error', loading: 'bg-[var(--text-tertiary)]' } as const;
    const color = colorMap[status];

    return (
        <div className="flex items-center gap-1.5" title={`S3: ${status}`}>
            <div className={`w-2 h-2 rounded-full ${color}`} />
            <span className="text-xs text-[var(--text-tertiary)]">S3</span>
        </div>
    );
}
