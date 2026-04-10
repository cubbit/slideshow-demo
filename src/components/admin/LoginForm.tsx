'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import CubbitLogo from '@/components/layout/CubbitLogo';

export default function LoginForm() {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    async function handleSubmit(e: FormEvent) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password }),
            });

            if (!res.ok) {
                const data = await res.json();
                setError(data.error || 'Login failed');
                return;
            }

            router.push('/admin/settings');
            router.refresh();
        } catch {
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#0E0E15' }}>
            <div style={{ width: '100%', maxWidth: '400px', padding: '0 16px' }}>
                <div
                    style={{
                        backgroundColor: '#161621',
                        borderRadius: '16px',
                        padding: '40px 32px',
                        border: '1px solid rgba(255,255,255,0.06)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                    }}
                >
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '16px', backgroundColor: 'rgba(0,101,255,0.1)', marginBottom: '20px' }}>
                            <CubbitLogo size={28} className="text-blue-400" />
                        </div>
                        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#FFFFFF' }}>
                            Cubbit Slideshow
                        </h1>
                        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginTop: '6px' }}>
                            Sign in to the admin panel
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                        <div>
                            <label
                                htmlFor="password"
                                style={{ display: 'block', fontSize: '14px', fontWeight: 500, color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                required
                                autoFocus
                                style={{
                                    width: '100%',
                                    padding: '12px 16px',
                                    borderRadius: '12px',
                                    fontSize: '14px',
                                    backgroundColor: 'rgba(255,255,255,0.04)',
                                    border: '1px solid rgba(255,255,255,0.1)',
                                    color: '#FFFFFF',
                                    outline: 'none',
                                    boxSizing: 'border-box',
                                }}
                                placeholder="Enter admin password"
                                onFocus={e => (e.target.style.borderColor = '#0065FF')}
                                onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.1)')}
                            />
                        </div>

                        {error && (
                            <div style={{ padding: '12px 16px', borderRadius: '12px', backgroundColor: 'rgba(211,44,32,0.1)', border: '1px solid rgba(211,44,32,0.2)' }}>
                                <p style={{ fontSize: '14px', fontWeight: 500, color: '#E63629' }}>{error}</p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !password}
                            style={{
                                width: '100%',
                                padding: '12px',
                                borderRadius: '12px',
                                backgroundColor: '#0065FF',
                                color: '#FFFFFF',
                                fontWeight: 600,
                                fontSize: '14px',
                                border: 'none',
                                cursor: loading || !password ? 'not-allowed' : 'pointer',
                                opacity: loading || !password ? 0.4 : 1,
                                boxShadow: '0 4px 14px rgba(0,101,255,0.4)',
                                transition: 'opacity 0.2s',
                            }}
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>
                </div>

                <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '24px' }}>
                    Password is shown in server logs on first run
                </p>
            </div>
        </div>
    );
}
