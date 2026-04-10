'use client';

import type { UploadItem as UploadItemType } from '@/hooks/useUploadQueue';
import { formatFileSize } from '@/lib/format';

interface Props {
    item: UploadItemType;
    onRemove: (id: string) => void;
}

export default function UploadItem({ item, onRemove }: Props) {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '14px 16px',
                borderRadius: '12px',
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
            }}
        >
            <div style={{ flexShrink: 0 }}>
                {item.status === 'pending' && (
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid rgba(255,255,255,0.2)' }} />
                )}
                {item.status === 'uploading' && (
                    <div className="animate-spin" style={{ width: '20px', height: '20px', borderRadius: '50%', border: '2px solid #0065FF', borderTopColor: 'transparent' }} />
                )}
                {item.status === 'success' && (
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#26AB75', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px' }}>
                        ✓
                    </div>
                )}
                {item.status === 'error' && (
                    <div style={{ width: '20px', height: '20px', borderRadius: '50%', backgroundColor: '#D32C20', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px' }}>
                        ✕
                    </div>
                )}
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.file.name}
                </p>
                <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)' }}>
                    {formatFileSize(item.file.size)}
                    {item.status === 'uploading' && ` — ${item.progress}%`}
                    {item.status === 'error' && (
                        <span style={{ color: '#D32C20', marginLeft: '4px' }}>{item.error}</span>
                    )}
                </p>

                {item.status === 'uploading' && (
                    <div style={{ marginTop: '8px', height: '4px', borderRadius: '4px', backgroundColor: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                        <div
                            style={{ height: '100%', borderRadius: '4px', backgroundColor: '#0065FF', width: `${item.progress}%`, transition: 'width 0.2s' }}
                        />
                    </div>
                )}
            </div>

            {item.status !== 'uploading' && (
                <button
                    onClick={() => onRemove(item.id)}
                    style={{ flexShrink: 0, color: 'rgba(255,255,255,0.3)', fontSize: '18px', background: 'none', border: 'none', cursor: 'pointer' }}
                    aria-label="Remove"
                >
                    ×
                </button>
            )}
        </div>
    );
}
