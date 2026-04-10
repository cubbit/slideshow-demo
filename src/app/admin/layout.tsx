'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import CubbitLogo from '@/components/layout/CubbitLogo';

const navItems = [
    { href: '/admin/settings', label: 'Settings', icon: '⚙' },
    { href: '/admin/password', label: 'Password', icon: '🔑' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();

    if (pathname === '/admin/login') {
        return <>{children}</>;
    }

    async function handleLogout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        router.push('/admin/login');
        router.refresh();
    }

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#0E0E15', color: '#FFFFFF' }}>
            {/* Top bar */}
            <header
                style={{
                    backgroundColor: '#161621',
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    padding: '20px 40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: '12px', textDecoration: 'none' }}>
                        <CubbitLogo size={26} className="text-blue-400" />
                        <span style={{ fontSize: '20px', fontWeight: 700, color: '#FFFFFF', letterSpacing: '-0.02em' }}>
                            Cubbit Slideshow
                        </span>
                    </Link>
                    <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.1)', margin: '0 4px' }} />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                        Admin
                    </span>
                </div>
                <button
                    onClick={handleLogout}
                    style={{ fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none', cursor: 'pointer' }}
                >
                    Sign out
                </button>
            </header>

            <div style={{ display: 'flex' }}>
                {/* Sidebar */}
                <nav
                    style={{
                        width: '240px',
                        minHeight: 'calc(100vh - 73px)',
                        backgroundColor: '#161621',
                        borderRight: '1px solid rgba(255,255,255,0.06)',
                        padding: '24px 16px',
                    }}
                >
                    <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '4px' }}>
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
                                            backgroundColor: isActive ? 'rgba(0,101,255,0.1)' : 'transparent',
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

                {/* Content */}
                <main style={{ flex: 1, padding: '40px' }}>{children}</main>
            </div>
        </div>
    );
}
