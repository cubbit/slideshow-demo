'use client';

import { useState, useEffect } from 'react';

const colorMap = { ok: '#26AB75', error: '#D32C20', loading: 'rgba(255,255,255,0.3)' } as const;

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

    return (
        <div className="flex items-center gap-2" title={`S3: ${status}`}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorMap[status] }} />
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>S3</span>
        </div>
    );
}
