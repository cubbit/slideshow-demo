'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PhotoMeta } from '@/types/photo';
import { DEFAULT_POLL_INTERVAL_MS } from '@/lib/constants';

/**
 * @param date - optional date string in YYYY/MM/DD format to filter photos by date
 */
export function usePhotos(initialPhotos: PhotoMeta[], date?: string) {
    const [photos, setPhotos] = useState<PhotoMeta[]>(initialPhotos);
    const [newKeys, setNewKeys] = useState<Set<string>>(new Set());
    const knownKeysRef = useRef<Set<string>>(new Set(initialPhotos.map(p => p.key)));

    // Reset and fetch immediately when date changes
    const isFirstMount = useRef(true);
    useEffect(() => {
        if (isFirstMount.current) {
            isFirstMount.current = false;
            return;
        }
        knownKeysRef.current = new Set();
        initializedRef.current = false;
        setNewKeys(new Set());
        setPhotos([]);
    }, [date]);

    // Track whether the first fetch has populated the known keys
    const initializedRef = useRef(knownKeysRef.current.size > 0);

    const fetchPhotos = useCallback(async () => {
        try {
            const dateParam = date ? `&date=${date}` : '';
            const res = await fetch(`/api/photos?t=${Date.now()}${dateParam}`);
            if (!res.ok) return;

            const data = await res.json();
            const fetchedPhotos: PhotoMeta[] = data.photos || [];

            if (!initializedRef.current) {
                // First fetch — just populate known keys without marking as new
                initializedRef.current = true;
                knownKeysRef.current = new Set(fetchedPhotos.map(p => p.key));
            } else {
                // Subsequent fetches — detect genuinely new photos
                const newFound = new Set<string>();
                for (const p of fetchedPhotos) {
                    if (!knownKeysRef.current.has(p.key)) {
                        newFound.add(p.key);
                        knownKeysRef.current.add(p.key);
                    }
                }

                if (newFound.size > 0) {
                    setNewKeys(newFound);
                }
            }

            setPhotos(fetchedPhotos);
        } catch {
            // Silently fail, will retry
        }
    }, [date]);

    // SSE for real-time updates + slow background poll as safety net
    useEffect(() => {
        let eventSource: EventSource | null = null;
        let reconnectTimer: ReturnType<typeof setTimeout> | null = null;

        function connectSSE() {
            try {
                eventSource = new EventSource('/api/photos/stream');

                eventSource.addEventListener('new-photos', () => {
                    fetchPhotos();
                });

                eventSource.onerror = () => {
                    // Reconnect after a delay
                    eventSource?.close();
                    eventSource = null;
                    reconnectTimer = setTimeout(connectSSE, 3000);
                };
            } catch {
                reconnectTimer = setTimeout(connectSSE, 3000);
            }
        }

        connectSSE();

        // Fetch immediately (handles date changes and initial load)
        fetchPhotos();

        // Safety poll every 30s in case an SSE event is missed
        const safetyPoll = setInterval(fetchPhotos, 30000);

        return () => {
            if (reconnectTimer) clearTimeout(reconnectTimer);
            eventSource?.close();
            clearInterval(safetyPoll);
        };
    }, [fetchPhotos]);

    return { photos, newKeys };
}
