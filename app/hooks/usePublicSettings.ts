'use client';

import { useState, useEffect } from 'react';

// Define the shape of our public settings
export interface PublicSettings {
    S3_BUCKET_NAME: string;
    MAX_FILE_SIZE: string;
    SLIDESHOW_SPEED_S: string;
    MIN_COUNT_FOR_MARQUEE: string;
    S3_ENDPOINT: string;
}

// Get initial values from environment variables
const initialSettings: PublicSettings = {
    S3_BUCKET_NAME: process.env.NEXT_PUBLIC_S3_BUCKET_NAME || '',
    MAX_FILE_SIZE: process.env.NEXT_PUBLIC_MAX_FILE_SIZE || '',
    SLIDESHOW_SPEED_S: process.env.NEXT_PUBLIC_SLIDESHOW_SPEED_S || '',
    MIN_COUNT_FOR_MARQUEE: process.env.NEXT_PUBLIC_MIN_COUNT_FOR_MARQUEE || '',
    S3_ENDPOINT: process.env.NEXT_PUBLIC_S3_ENDPOINT || '',
};

export function usePublicSettings(refreshInterval?: number): {
    settings: PublicSettings;
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
} {
    const [settings, setSettings] = useState<PublicSettings>(initialSettings);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Function to fetch the latest settings
    const fetchSettings = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await fetch('/api/public-settings');

            if (!response.ok) {
                throw new Error('Failed to fetch settings');
            }

            const data = await response.json();

            // Update state with new settings
            setSettings(prev => ({
                ...prev,
                ...data.settings,
            }));
        } catch (err) {
            console.error('Error fetching settings:', err);
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setIsLoading(false);
        }
    };

    // Fetch settings on mount
    useEffect(() => {
        fetchSettings();

        // If refresh interval is provided, set up polling
        if (refreshInterval) {
            const intervalId = setInterval(fetchSettings, refreshInterval);
            return () => clearInterval(intervalId);
        }
    }, [refreshInterval]);

    return {
        settings,
        isLoading,
        error,
        refresh: fetchSettings,
    };
}
