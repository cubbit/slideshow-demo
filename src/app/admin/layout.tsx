'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

const navItems = [
    { href: '/admin/settings', label: 'Slideshow', icon: '⚙' },
    { href: '/admin/photos', label: 'Photos', icon: '🖼' },
    { href: '/admin/storage', label: 'S3 Storage', icon: '☁' },
    { href: '/admin/webhooks', label: 'Webhooks', icon: '🔗' },
    { href: '/admin/password', label: 'Password', icon: '🔑' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const [uploadsDisabled, setUploadsDisabled] = useState(false);
    const appName =
        typeof document !== 'undefined'
            ? document.body.dataset.appName || 'Slideshow'
            : 'Slideshow';

    useEffect(() => {
        fetch('/api/settings/public')
            .then(r => r.json())
            .then(d => setUploadsDisabled(!d.uploadsEnabled))
            .catch(() => {});
        const interval = setInterval(() => {
            fetch('/api/settings/public')
                .then(r => r.json())
                .then(d => setUploadsDisabled(!d.uploadsEnabled))
                .catch(() => {});
        }, 10000);
        return () => clearInterval(interval);
    }, []);

    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/admin/login');
        router.refresh();
    }

    return (
        <div
            style={{
                height: '100vh',
                backgroundColor: '#0E0E15',
                color: '#FFFFFF',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
            }}
        >
            {/* Uploads disabled banner */}
            {uploadsDisabled && (
                <div
                    style={{
                        backgroundColor: 'rgba(211,44,32,0.12)',
                        borderBottom: '1px solid rgba(211,44,32,0.2)',
                        padding: '8px 40px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexShrink: 0,
                    }}
                >
                    <svg
                        width="14"
                        height="14"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#EF5350"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="10" />
                        <line x1="15" y1="9" x2="9" y2="15" />
                        <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                    <span style={{ fontSize: '12px', color: '#EF5350', fontWeight: 500 }}>
                        Photo uploads are disabled
                    </span>
                </div>
            )}
            {/* Top bar — fixed */}
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
                    <Link
                        href="/"
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            textDecoration: 'none',
                        }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/cubbit-logo.svg"
                            alt="Cubbit"
                            style={{ height: '22px', width: 'auto' }}
                        />
                        <span
                            style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                letterSpacing: '0.1em',
                                color: '#0065FF',
                                backgroundColor: 'rgba(0,101,255,0.1)',
                                border: '1px solid rgba(0,101,255,0.2)',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                textTransform: 'uppercase',
                            }}
                        >
                            {appName}
                        </span>
                    </Link>
                    <div
                        style={{
                            width: '1px',
                            height: '20px',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                        }}
                    />
                    <span
                        style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: 'rgba(255,255,255,0.3)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.1em',
                        }}
                    >
                        Admin
                    </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link
                        href="/"
                        style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'rgba(255,255,255,0.4)',
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                        }}
                    >
                        <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <polyline points="15 18 9 12 15 6" />
                        </svg>
                        {appName}
                    </Link>
                    <div
                        style={{
                            width: '1px',
                            height: '16px',
                            backgroundColor: 'rgba(255,255,255,0.08)',
                        }}
                    />
                    <button
                        onClick={handleLogout}
                        style={{
                            fontSize: '13px',
                            fontWeight: 500,
                            color: 'rgba(255,255,255,0.4)',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                        }}
                    >
                        Sign out
                    </button>
                </div>
            </header>

            <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
                {/* Sidebar — fixed */}
                <nav
                    style={{
                        width: '240px',
                        flexShrink: 0,
                        backgroundColor: '#161621',
                        borderRight: '1px solid rgba(255,255,255,0.06)',
                        padding: '24px 16px',
                        overflowY: 'auto',
                    }}
                >
                    <ul
                        style={{
                            listStyle: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '4px',
                        }}
                    >
                        {navItems.map(item => {
                            const isActive = pathname === item.href;
                            return (
                                <li key={item.href}>
                                    <Link
                                        href={item.href}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px 16px',
                                            borderRadius: '12px',
                                            fontSize: '14px',
                                            textDecoration: 'none',
                                            backgroundColor: isActive
                                                ? 'rgba(0,101,255,0.1)'
                                                : 'transparent',
                                            color: isActive ? '#5498FF' : 'rgba(255,255,255,0.5)',
                                            fontWeight: isActive ? 600 : 500,
                                            transition: 'all 0.15s',
                                        }}
                                    >
                                        <span style={{ fontSize: '16px' }}>{item.icon}</span>
                                        {item.label}
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                </nav>

                {/* Content — scrollable */}
                <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>{children}</main>
            </div>
        </div>
    );
}
