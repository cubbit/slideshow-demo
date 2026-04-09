import UploadZone from '@/components/upload/UploadZone';
import Link from 'next/link';

export default function UploadPage() {
    return (
        <div className="light min-h-screen bg-[var(--bg-primary)]">
            {/* Header */}
            <header className="bg-[var(--bg-secondary)] border-b border-[var(--border-secondary)] px-6 py-3 flex items-center justify-between">
                <Link href="/" className="text-lg font-semibold text-[var(--text-accent)]">
                    Cubbit Slideshow
                </Link>
                <Link
                    href="/"
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                    View Slideshow
                </Link>
            </header>

            {/* Content */}
            <main className="px-4 py-10">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                        Upload Photos
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">
                        Select photos from your device to add them to the slideshow
                    </p>
                </div>

                <UploadZone />
            </main>
        </div>
    );
}
