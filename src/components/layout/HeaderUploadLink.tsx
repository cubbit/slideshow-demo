'use client';

import Link from 'next/link';
import { useS3Health } from '@/contexts/S3HealthContext';

export default function HeaderUploadLink() {
    const s3Status = useS3Health();
    const disabled = s3Status === 'error';

    if (disabled) {
        return (
            <span
                style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.2)',
                    cursor: 'not-allowed',
                }}
                title="Upload disabled — S3 is not reachable"
            >
                Upload
            </span>
        );
    }

    return (
        <Link
            href="/upload"
            style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}
        >
            Upload
        </Link>
    );
}
