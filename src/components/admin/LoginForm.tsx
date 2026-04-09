'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { inputClass, labelClass } from './styles';

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
        <div className="light min-h-screen flex items-center justify-center bg-[var(--bg-primary)]">
            <div className="w-full max-w-sm p-8 bg-[var(--bg-secondary)] rounded-xl shadow-lg border border-[var(--border-secondary)]">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-semibold text-[var(--text-primary)]">
                        Cubbit Slideshow
                    </h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Admin Panel</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="password"
                            className={labelClass}
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
                            className={inputClass}
                            placeholder="Enter admin password"
                        />
                    </div>

                    {error && (
                        <p className="text-sm text-error font-medium">{error}</p>
                    )}

                    <button
                        type="submit"
                        disabled={loading || !password}
                        className="w-full py-2.5 px-4 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>
            </div>
        </div>
    );
}
