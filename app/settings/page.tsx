'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import styles from './page.module.css';
import { Orbitron } from 'next/font/google';

const orbitron = Orbitron({
    weight: '400',
    subsets: ['latin'],
    style: 'normal',
});

interface CubbitSettings {
    S3_BUCKET_NAME: string;
    MAX_FILE_SIZE: string;
    SLIDESHOW_SPEED_S: string;
    MIN_COUNT_FOR_MARQUEE: string;
    S3_REGION: string;
    S3_ACCESS_KEY_ID: string;
    S3_SECRET_ACCESS_KEY: string;
    S3_ENDPOINT: string;
    MULTIPART_THRESHOLD: string;
}

export default function SettingsPage() {
    const [settings, setSettings] = useState<CubbitSettings>({
        S3_BUCKET_NAME: '',
        MAX_FILE_SIZE: '',
        SLIDESHOW_SPEED_S: '',
        MIN_COUNT_FOR_MARQUEE: '',
        S3_REGION: '',
        S3_ACCESS_KEY_ID: '',
        S3_SECRET_ACCESS_KEY: '',
        S3_ENDPOINT: '',
        MULTIPART_THRESHOLD: '',
    });
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [saving, setSaving] = useState<boolean>(false);
    const [dirty, setDirty] = useState<boolean>(false);
    const router = useRouter();

    // Fetch settings on page load
    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const response = await fetch('/api/settings');

                if (response.status === 401) {
                    // Unauthorized, redirect to login
                    router.push('/settings/login');
                    return;
                }

                if (!response.ok) {
                    throw new Error('Failed to fetch settings');
                }

                const data = await response.json();
                setSettings(data.settings);
            } catch (err) {
                console.error('Error fetching settings:', err);
                setError('Failed to load settings');
            } finally {
                setLoading(false);
            }
        };

        fetchSettings();
    }, [router]);

    // Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
        setDirty(true);

        // Clear messages
        setSuccess(null);
        setError(null);
    };

    // Save settings
    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setSuccess(null);
        setError(null);

        try {
            const response = await fetch('/api/settings', {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(settings),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update settings');
            }

            const data = await response.json();
            setSettings(data.settings);
            setSuccess('Settings updated successfully');
            setDirty(false);
        } catch (err) {
            console.error('Error saving settings:', err);
            setError(err instanceof Error ? err.message : 'Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    // Logout function
    const handleLogout = () => {
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        router.push('/settings/login');
    };

    if (loading) {
        return (
            <div className={`${styles['settings-page']} ${orbitron.className}`}>
                <div className={styles.loading}>Loading settings...</div>
            </div>
        );
    }

    return (
        <main className={`${styles['settings-page']} ${orbitron.className}`}>
            <div className={styles.header}>
                <div className={styles.logo}>
                    <Image src="/cubbit.png" alt="Cubbit logo" width={40} height={50} priority />
                    <h1>Slideshow Settings</h1>
                </div>
                <div className={styles.actions}>
                    <button className={styles['logout-button']} onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </div>

            <div className={styles['settings-container']}>
                <form className={styles['settings-form']} onSubmit={handleSave}>
                    <div className={styles.section}>
                        <h2 className={styles['section-title']}>Public Settings</h2>

                        <div className={styles['form-group']}>
                            <label htmlFor="S3_BUCKET_NAME">S3 Bucket Name</label>
                            <input
                                type="text"
                                id="S3_BUCKET_NAME"
                                name="S3_BUCKET_NAME"
                                className={styles.input}
                                value={settings.S3_BUCKET_NAME}
                                onChange={handleChange}
                                disabled={saving}
                            />
                            <p className={styles.hint}>The name of your S3 bucket</p>
                        </div>

                        <div className={styles['form-group']}>
                            <label htmlFor="MAX_FILE_SIZE">Max File Size (bytes)</label>
                            <input
                                type="number"
                                id="MAX_FILE_SIZE"
                                name="MAX_FILE_SIZE"
                                className={styles.input}
                                value={settings.MAX_FILE_SIZE}
                                onChange={handleChange}
                                disabled={saving}
                            />
                            <p className={styles.hint}>
                                Maximum upload file size in bytes (e.g., 10485760 for 10MB)
                            </p>
                        </div>

                        <div className={styles['form-group']}>
                            <label htmlFor="SLIDESHOW_SPEED_S">Slideshow Speed (seconds)</label>
                            <input
                                type="number"
                                id="SLIDESHOW_SPEED_S"
                                name="SLIDESHOW_SPEED_S"
                                className={styles.input}
                                value={settings.SLIDESHOW_SPEED_S}
                                onChange={handleChange}
                                disabled={saving}
                            />
                            <p className={styles.hint}>
                                Duration of the slideshow animation in seconds
                            </p>
                        </div>

                        <div className={styles['form-group']}>
                            <label htmlFor="MIN_COUNT_FOR_MARQUEE">Min Count for Marquee</label>
                            <input
                                type="number"
                                id="MIN_COUNT_FOR_MARQUEE"
                                name="MIN_COUNT_FOR_MARQUEE"
                                className={styles.input}
                                value={settings.MIN_COUNT_FOR_MARQUEE}
                                onChange={handleChange}
                                disabled={saving}
                            />
                            <p className={styles.hint}>
                                Minimum number of photos needed to start carousel animation
                            </p>
                        </div>
                    </div>

                    <div className={styles.section}>
                        <h2 className={styles['section-title']}>S3 Connection Settings</h2>

                        <div className={styles['form-group']}>
                            <label htmlFor="S3_REGION">S3 Region</label>
                            <input
                                type="text"
                                id="S3_REGION"
                                name="S3_REGION"
                                className={styles.input}
                                value={settings.S3_REGION}
                                onChange={handleChange}
                                disabled={saving}
                            />
                            <p className={styles.hint}>
                                The AWS region for your S3 bucket (e.g., eu-central-1)
                            </p>
                        </div>

                        <div className={styles['form-group']}>
                            <label htmlFor="S3_ENDPOINT">S3 Endpoint</label>
                            <input
                                type="text"
                                id="S3_ENDPOINT"
                                name="S3_ENDPOINT"
                                className={styles.input}
                                value={settings.S3_ENDPOINT}
                                onChange={handleChange}
                                disabled={saving}
                            />
                            <p className={styles.hint}>The endpoint URL for your S3 service</p>
                        </div>

                        <div className={styles['form-group']}>
                            <label htmlFor="S3_ACCESS_KEY_ID">S3 Access Key ID</label>
                            <input
                                type="text"
                                id="S3_ACCESS_KEY_ID"
                                name="S3_ACCESS_KEY_ID"
                                className={styles.input}
                                value={settings.S3_ACCESS_KEY_ID}
                                onChange={handleChange}
                                disabled={saving}
                                placeholder="Enter new value to change"
                            />
                            <p className={styles.hint}>
                                Your S3 access key ID (partially masked for security)
                            </p>
                        </div>

                        <div className={styles['form-group']}>
                            <label htmlFor="S3_SECRET_ACCESS_KEY">S3 Secret Access Key</label>
                            <input
                                type="text"
                                id="S3_SECRET_ACCESS_KEY"
                                name="S3_SECRET_ACCESS_KEY"
                                className={styles.input}
                                value={settings.S3_SECRET_ACCESS_KEY}
                                onChange={handleChange}
                                disabled={saving}
                                placeholder="Enter new value to change"
                            />
                            <p className={styles.hint}>
                                Your S3 secret access key (partially masked for security)
                            </p>
                        </div>

                        <div className={styles['form-group']}>
                            <label htmlFor="MULTIPART_THRESHOLD">Multipart Threshold (bytes)</label>
                            <input
                                type="number"
                                id="MULTIPART_THRESHOLD"
                                name="MULTIPART_THRESHOLD"
                                className={styles.input}
                                value={settings.MULTIPART_THRESHOLD}
                                onChange={handleChange}
                                disabled={saving}
                            />
                            <p className={styles.hint}>
                                File size threshold for multipart uploads (e.g., 5242880 for 5MB)
                            </p>
                        </div>
                    </div>

                    {error && <div className={styles['error-message']}>{error}</div>}
                    {success && <div className={styles['success-message']}>{success}</div>}

                    <div className={styles['form-actions']}>
                        <button
                            type="submit"
                            className={styles['save-button']}
                            disabled={saving || !dirty}
                        >
                            {saving ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>

                    <div className={styles.notes}>
                        <p>
                            Note: These settings will be applied immediately but will reset on
                            application restart unless you update your environment variables or
                            Kubernetes secrets.
                        </p>
                    </div>
                </form>
            </div>
        </main>
    );
}
