'use client';

import { useState, useEffect } from 'react';
import UploadZone from './UploadZone';

export default function UploadContent({ initialEnabled }: { initialEnabled: boolean }) {
    const [uploadsEnabled, setUploadsEnabled] = useState(initialEnabled);

    useEffect(() => {
        function check() {
            fetch('/api/settings/public')
                .then(r => r.json())
                .then(d => setUploadsEnabled(d.uploadsEnabled))
                .catch(() => {});
        }

        // Poll every 5s for setting changes
        const interval = setInterval(check, 5000);
        return () => clearInterval(interval);
    }, []);

    if (!uploadsEnabled) {
        return (
            <div
                style={{
                    padding: '24px',
                    borderRadius: '12px',
                    backgroundColor: 'rgba(211,44,32,0.08)',
                    border: '1px solid rgba(211,44,32,0.2)',
                    textAlign: 'center',
                }}
            >
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#EF5350"
                    strokeWidth="1.5"
                    style={{ margin: '0 auto 12px' }}
                >
                    <circle cx="12" cy="12" r="10" />
                    <line x1="15" y1="9" x2="9" y2="15" />
                    <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#EF5350' }}>
                    Uploads are currently disabled
                </p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>
                    The administrator has temporarily disabled photo uploads.
                </p>
            </div>
        );
    }

    return <UploadZone />;
}
