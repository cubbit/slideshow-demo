import { getPhotos } from '@/lib/s3/list';
import { getPublicSettings } from '@/lib/settings/service';
import Carousel from '@/components/slideshow/Carousel';
import S3HealthBadgeClient from '@/components/layout/S3HealthBadge';
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
        <div className="dark min-h-screen bg-[var(--bg-primary)] flex flex-col">
            {/* Header */}
            <header className="px-6 py-3 flex items-center justify-between shrink-0 border-b border-[var(--border-secondary)]">
                <div className="flex items-center gap-4">
                    <span className="text-lg font-semibold text-[var(--text-accent)]">
                        Cubbit Slideshow
                    </span>
                    <span className="text-sm text-[var(--text-tertiary)]">{today}</span>
                </div>
                <div className="flex items-center gap-4">
                    {settings.endpoint && (
                        <span className="text-xs text-[var(--text-tertiary)]">
                            {settings.endpoint}
                        </span>
                    )}
                    <S3HealthBadgeClient />
                    <Link
                        href="/upload"
                        className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                    >
                        Upload
                    </Link>
                    <Link
                        href="/admin"
                        className="text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] transition-colors"
                    >
                        Admin
                    </Link>
                </div>
            </header>

            {/* Carousel */}
            <main className="flex-1 overflow-hidden py-2">
                <Carousel initialPhotos={initialPhotos} initialSettings={settings} />
            </main>
        </div>
    );
}
