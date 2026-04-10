'use client';

import Link from 'next/link';
import { useS3Health } from '@/contexts/S3HealthContext';

export default function EmptyState() {
    const s3Status = useS3Health();
    const s3Down = s3Status === 'error';

    return (
        <div
            style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '32px',
                minHeight: 'calc(100vh - 80px)',
            }}
        >
            <div className="relative w-36 h-36 animate-float">
                <div
                    className="absolute inset-0 rounded-full animate-pulse"
                    style={{ backgroundColor: 'rgba(0, 101, 255, 0.15)' }}
                />
                <div
                    className="absolute inset-3 rounded-full"
                    style={{ backgroundColor: 'rgba(0, 101, 255, 0.08)' }}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                    <svg
                        width="52"
                        height="52"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#5498FF"
                        strokeWidth="1.5"
                    >
                        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                    </svg>
                </div>
            </div>

            <div className="text-center space-y-3">
                <h2 className="text-2xl font-bold text-white">No photos yet</h2>
                <p
                    className="text-sm max-w-sm leading-relaxed"
                    style={{ color: 'rgba(255,255,255,0.45)' }}
                >
                    {s3Down ? (
                        'S3 storage is not reachable. Configure your S3 connection to get started.'
                    ) : (
                        <>
                            Upload photos from your device to start the slideshow.
                            <br />
                            Photos will appear here in real-time.
                        </>
                    )}
                </p>
            </div>

            <div className="flex gap-4 mt-2">
                {s3Down ? (
                    <span
                        className="inline-flex items-center justify-center"
                        style={{
                            backgroundColor: 'rgba(255,255,255,0.08)',
                            color: 'rgba(255,255,255,0.25)',
                            padding: '12px 28px',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: 600,
                            cursor: 'not-allowed',
                        }}
                    >
                        Upload Photos
                    </span>
                ) : (
                    <Link
                        href="/upload"
                        className="inline-flex items-center justify-center"
                        style={{
                            backgroundColor: '#0065FF',
                            color: '#FFFFFF',
                            padding: '12px 28px',
                            borderRadius: '12px',
                            fontSize: '14px',
                            fontWeight: 600,
                            textDecoration: 'none',
                            boxShadow: '0 4px 14px rgba(0,101,255,0.4)',
                        }}
                    >
                        Upload Photos
                    </Link>
                )}
                <Link
                    href="/admin/settings"
                    className="inline-flex items-center justify-center"
                    style={{
                        color: 'rgba(255,255,255,0.6)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        padding: '12px 28px',
                        borderRadius: '12px',
                        fontSize: '14px',
                        fontWeight: 500,
                        textDecoration: 'none',
                    }}
                >
                    Configure S3
                </Link>
            </div>
        </div>
    );
}
