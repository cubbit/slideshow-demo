'use client';

import { useS3Health } from '@/contexts/S3HealthContext';

const colorMap = { ok: '#26AB75', error: '#D32C20', loading: 'rgba(255,255,255,0.3)' } as const;

export default function S3HealthBadgeClient() {
    const status = useS3Health();

    return (
        <div className="flex items-center gap-2" title={`S3: ${status}`}>
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colorMap[status] }} />
            <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.4)' }}>S3</span>
        </div>
    );
}
