'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PhotoMeta } from '@/types/photo';
import { DEFAULT_POLL_INTERVAL_MS } from '@/lib/constants';

export function usePhotos(initialPhotos: PhotoMeta[]) {
    const [photos, setPhotos] = useState<PhotoMeta[]>(initialPhotos);
    const [newKeys, setNewKeys] = useState<Set<string>>(new Set());
    const knownKeysRef = useRef<Set<string>>(new Set(initialPhotos.map(p => p.key)));

    // Clear "new" highlight after 3 seconds
    useEffect(() => {
        if (newKeys.size === 0) return;
        const timer = setTimeout(() => {
            setNewKeys(new Set());
        }, 3000);
        return () => clearTimeout(timer);
    }, [newKeys]);

    const fetchPhotos = useCallback(async () => {
        try {
            const res = await fetch(`/api/photos?t=${Date.now()}`);
            if (!res.ok) return;

            const data = await res.json();
            const fetchedPhotos: PhotoMeta[] = data.photos || [];

            // Find new photos
            const newFound = new Set<string>();
            for (const p of fetchedPhotos) {
                if (!knownKeysRef.current.has(p.key)) {
                    newFound.add(p.key);
                    knownKeysRef.current.add(p.key);
                }
            }

            if (newFound.size > 0) {
                setNewKeys(prev => new Set([...prev, ...newFound]));
            }

            setPhotos(fetchedPhotos);
        } catch {
            // Silently fail, will retry on next poll
        }
    }, []);

    // Polling
    useEffect(() => {
        const interval = setInterval(fetchPhotos, DEFAULT_POLL_INTERVAL_MS);
        return () => clearInterval(interval);
    }, [fetchPhotos]);

    return { photos, newKeys };
}
