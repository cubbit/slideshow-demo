import Link from 'next/link';

export default function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center gap-4 py-20">
            <p className="text-5xl">📷</p>
            <p className="text-lg text-[var(--text-secondary)]">No photos uploaded today</p>
            <Link
                href="/upload"
                className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 transition-colors"
            >
                Upload Photos
            </Link>
        </div>
    );
}
