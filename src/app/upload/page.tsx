import UploadZone from '@/components/upload/UploadZone';
import CubbitLogo from '@/components/layout/CubbitLogo';
import Link from 'next/link';

export default function UploadPage() {
    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0E0E15', color: '#FFFFFF' }}>
            {/* Header */}
            <header
                className="animate-header-enter"
                style={{
                    backgroundColor: '#161621',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    padding: '20px 40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
                    <CubbitLogo size={26} className="text-blue-400" />
                    <span style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                        Cubbit Slideshow
                    </span>
                </Link>
                <Link
                    href="/"
                    style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', textDecoration: 'none' }}
                >
                    View Slideshow
                </Link>
            </header>

            {/* Content */}
            <main className="animate-fade-up" style={{ padding: '64px 24px', maxWidth: '480px', margin: '0 auto' }}>
                <div style={{ textAlign: 'center', marginBottom: '48px' }}>
                    <div
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '64px',
                            height: '64px',
                            borderRadius: '16px',
                            backgroundColor: 'rgba(0,101,255,0.1)',
                            marginBottom: '24px',
                        }}
                    >
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#5498FF" strokeWidth="1.5">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="17 8 12 3 7 8" />
                            <line x1="12" y1="3" x2="12" y2="15" />
                        </svg>
                    </div>
                    <h1 style={{ fontSize: '24px', fontWeight: 700 }}>
                        Upload Photos
                    </h1>
                    <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginTop: '8px' }}>
                        Select photos from your device to add them to the slideshow
                    </p>
                </div>

                <UploadZone />
            </main>
        </div>
    );
}
