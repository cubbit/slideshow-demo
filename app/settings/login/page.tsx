'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './page.module.css';
import { Orbitron } from 'next/font/google';

const orbitron = Orbitron({
    weight: '400',
    subsets: ['latin'],
    style: 'normal',
});

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            const response = await fetch('/api/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (data.success) {
                // Redirect to settings page
                router.push('/settings');
            } else {
                setError(data.message || 'Invalid credentials');
            }
        } catch (err) {
            setError('An error occurred during authentication');
            console.error('Auth error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className={`${styles.loginPage} ${orbitron.className}`}>
            <div className={styles.logo}>
                <Image src="/cubbit.png" alt="Cubbit logo" width={60} height={80} priority />
            </div>

            <div className={styles.loginContainer}>
                <h1 className={styles.title}>Settings Authentication</h1>

                <form className={styles.loginForm} onSubmit={handleSubmit}>
                    <div className={styles.formGroup}>
                        <label htmlFor="username">Username</label>
                        <input
                            type="text"
                            id="username"
                            className={styles.input}
                            value={username}
                            onChange={e => setUsername(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="password">Password</label>
                        <input
                            type="password"
                            id="password"
                            className={styles.input}
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                            disabled={loading}
                        />
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <button type="submit" className={styles.loginButton} disabled={loading}>
                        {loading ? 'Authenticating...' : 'Login'}
                    </button>
                </form>
            </div>
        </main>
    );
}
