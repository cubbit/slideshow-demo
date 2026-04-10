import { getPhotos } from '@/lib/s3/list';
import { getPublicSettings } from '@/lib/settings/service';
import Carousel from '@/components/slideshow/Carousel';
import S3HealthBadgeClient from '@/components/layout/S3HealthBadge';
import CubbitLogo from '@/components/layout/CubbitLogo';
import HeaderUploadLink from '@/components/layout/HeaderUploadLink';
import DatePicker from '@/components/layout/DatePicker';
import { S3HealthProvider } from '@/contexts/S3HealthContext';
import { DateProvider } from '@/contexts/DateContext';
import { getAppName } from '@/lib/appName';
import Link from 'next/link';
import type { PhotoMeta } from '@/types/photo';

export const dynamic = 'force-dynamic';

export default async function SlideshowPage() {
    const appName = getAppName();
    let initialPhotos: PhotoMeta[] = [];
    try {
        const page = await getPhotos();
        initialPhotos = page.photos;
    } catch {
        // S3 may not be configured yet
    }

    const settings = getPublicSettings();

    return (
        <S3HealthProvider>
        <DateProvider>
        <div style={{
            minHeight: '100vh',
            backgroundColor: '#0E0E15',
            color: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            backgroundImage: `
                radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0,101,255,0.06) 0%, transparent 60%),
                linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
            `,
            backgroundSize: '100% 100%, 60px 60px, 60px 60px',
        }}>
            {/* Header */}
            <header
                className="animate-header-enter"
                style={{
                    backgroundColor: '#161621',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    padding: '12px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                    flexWrap: 'wrap',
                    gap: '8px',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/cubbit-logo.svg" alt="Cubbit" style={{ height: '24px', width: 'auto' }} />
                    <span style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        letterSpacing: '0.1em',
                        color: '#0065FF',
                        backgroundColor: 'rgba(0,101,255,0.1)',
                        border: '1px solid rgba(0,101,255,0.2)',
                        padding: '2px 8px',
                        borderRadius: '6px',
                        textTransform: 'uppercase',
                    }}>
                        {appName}
                    </span>
                    <div className="desktop-only" style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
                    <div className="desktop-only"><DatePicker /></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <S3HealthBadgeClient />
                    {settings.endpoint && (
                        <span
                            className="desktop-only"
                            style={{
                                fontSize: '12px',
                                color: 'rgba(255,255,255,0.25)',
                                fontFamily: 'monospace',
                                backgroundColor: 'rgba(255,255,255,0.04)',
                                padding: '6px 12px',
                                borderRadius: '6px',
                                border: '1px solid rgba(255,255,255,0.06)',
                                maxWidth: '300px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                            title={settings.endpoint}
                        >
                            {settings.endpoint}
                        </span>
                    )}
                    <HeaderUploadLink />
                    <Link
                        href="/admin"
                        title="Settings"
                        className="desktop-only"
                        style={{ color: 'rgba(255,255,255,0.35)', textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                    >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="3" />
                            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                        </svg>
                    </Link>
                </div>
            </header>

            {/* Carousel */}
            <main className="animate-carousel-fadein" style={{ flex: 1, overflow: 'hidden', padding: '16px 0' }}>
                <Carousel initialPhotos={initialPhotos} initialSettings={settings} />
            </main>
        </div>
        </DateProvider>
        </S3HealthProvider>
    );
}
