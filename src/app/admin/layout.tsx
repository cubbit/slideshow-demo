'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

const navItems = [
    { href: '/admin/settings', label: 'Settings' },
    { href: '/admin/password', label: 'Password' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    // Don't show admin chrome on login page
    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/admin/login');
        router.refresh();
    }

    return (
        <div className="light min-h-screen bg-[var(--bg-primary)]">
            {/* Top bar */}
            <header className="bg-[var(--bg-secondary)] border-b border-[var(--border-secondary)] px-6 py-3 flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Link href="/" className="text-lg font-semibold text-[var(--text-accent)]">
                        Cubbit Slideshow
                    </Link>
                    <span className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wider">
                        Admin
                    </span>
                </div>
                <button
                    onClick={handleLogout}
                    className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                    Sign out
                </button>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <nav className="w-56 min-h-[calc(100vh-49px)] bg-[var(--bg-secondary)] border-r border-[var(--border-secondary)] p-4">
                    <ul className="space-y-1">
                        {navItems.map(item => {
                            const isActive = pathname === item.href;
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                                            isActive
                                                ? 'bg-blue-500/10 text-[var(--text-accent)] font-medium'
                                                : 'text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)]'
                                        }`}
                                    >
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Content */}
                <main className="flex-1 p-8">{children}</main>
            </div>
        </div>
    );
}
