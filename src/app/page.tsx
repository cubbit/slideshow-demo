import { getPhotos } from '@/lib/s3/list';
import { getPublicSettings } from '@/lib/settings/service';
import Carousel from '@/components/slideshow/Carousel';
import S3HealthBadgeClient from '@/components/layout/S3HealthBadge';
import CubbitLogo from '@/components/layout/CubbitLogo';
import Link from 'next/link';
import type { PhotoMeta } from '@/types/photo';

export const dynamic = 'force-dynamic';

export default async function SlideshowPage() {
    let initialPhotos: PhotoMeta[] = [];
    try {
        const page = await getPhotos();
        initialPhotos = page.photos;
    } catch {
        // S3 may not be configured yet
    }

    const settings = getPublicSettings();
    const today = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
    });

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0E0E15', color: '#FFFFFF', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <header
                style={{
                    backgroundColor: '#161621',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    padding: '20px 40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <CubbitLogo size={28} className="text-blue-400" />
                    <span style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>
                        Cubbit Slideshow
                    </span>
                    <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
                    <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)' }}>{today}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    {settings.endpoint && (
                        <span
                            style={{
                                fontSize: '12px',
                                color: 'rgba(255,255,255,0.25)',
                                fontFamily: 'monospace',
                                backgroundColor: 'rgba(255,255,255,0.04)',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid rgba(255,255,255,0.06)',
                            }}
                        >
                            {settings.endpoint}
                        </span>
                    )}
                    <S3HealthBadgeClient />
                    <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.08)' }} />
                    <Link
                        href="/upload"
                        style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.55)', textDecoration: 'none' }}
                    >
                        Upload
                    </Link>
                    <Link
                        href="/admin"
                        style={{ fontSize: '14px', color: 'rgba(255,255,255,0.35)', textDecoration: 'none' }}
                    >
                        Admin
                    </Link>
                </div>
            </header>

            {/* Carousel */}
            <main style={{ flex: 1, overflow: 'hidden', padding: '16px 0' }}>
                <Carousel initialPhotos={initialPhotos} initialSettings={settings} />
            </main>
        </div>
    );
}
