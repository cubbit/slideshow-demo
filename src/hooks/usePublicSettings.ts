'use client';

import { useState, useEffect, useCallback } from 'react';
import type { PublicSettings } from '@/types/settings';
import { DEFAULT_SETTINGS_REFRESH_MS } from '@/lib/constants';

const defaultSettings: PublicSettings = {
    bucketName: '',
    prefix: '',
    endpoint: '',
    speedS: 200,
    rows: 3,
    minCountForMarquee: 6,
    maxFileSize: 10485760,
};

export function usePublicSettings(initial?: PublicSettings) {
    const [settings, setSettings] = useState<PublicSettings>(initial || defaultSettings);

    const refresh = useCallback(async () => {
        try {
            const res = await fetch('/api/settings/public');
            if (!res.ok) return;
            const data = await res.json();
            setSettings(data);
        } catch {
            // Silently fail
        }
    }, []);

    useEffect(() => {
        if (!initial) refresh(); // Fetch on mount if no initial data
        const interval = setInterval(refresh, DEFAULT_SETTINGS_REFRESH_MS);
        return () => clearInterval(interval);
    }, [refresh, initial]);

    return settings;
}
