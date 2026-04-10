'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PhotoMeta } from '@/types/photo';
import { DEFAULT_POLL_INTERVAL_MS } from '@/lib/constants';

export function usePhotos(initialPhotos: PhotoMeta[]) {
    const [photos, setPhotos] = useState<PhotoMeta[]>(initialPhotos);
    const [newKeys, setNewKeys] = useState<Set<string>>(new Set());
    const knownKeysRef = useRef<Set<string>>(new Set(initialPhotos.map(p => p.key)));

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
                // Clear previous "new" badges — only the latest additions get the badge
                setNewKeys(newFound);
            }

            setPhotos(fetchedPhotos);
        } catch {
            // Silently fail, will retry
        }
    }, []);

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
