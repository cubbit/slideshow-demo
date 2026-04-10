'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import CarouselRow from './CarouselRow';
import PhotoModal from './PhotoModal';
import EmptyState from './EmptyState';
import { usePhotos } from '@/hooks/usePhotos';
import { usePublicSettings } from '@/hooks/usePublicSettings';
import { useS3Health } from '@/contexts/S3HealthContext';
import { shuffleArray, diffPhotos } from '@/lib/photos/diff';
import type { PhotoMeta } from '@/types/photo';
import type { PublicSettings } from '@/types/settings';

interface Props {
    initialPhotos: PhotoMeta[];
    initialSettings: PublicSettings;
}

export default function Carousel({ initialPhotos, initialSettings }: Props) {
    const { photos, newKeys } = usePhotos(initialPhotos);
    const settings = usePublicSettings(initialSettings);
    const s3Status = useS3Health();
    const [globalPaused, setGlobalPaused] = useState(false);
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);
    const [selectedPhoto, setSelectedPhoto] = useState<PhotoMeta | null>(null);

    // Maintain a stable display list: use server order for initial render (no hydration mismatch),
    // shuffle on mount, then only diff (add/remove) on subsequent polls.
    const [displayPhotos, setDisplayPhotos] = useState<PhotoMeta[]>(initialPhotos);
    const mountedRef = useRef(false);
    useEffect(() => {
        if (photos.length === 0) {
            setDisplayPhotos([]);
            return;
        }

        if (!mountedRef.current) {
            mountedRef.current = true;
            setDisplayPhotos(shuffleArray(photos));
        } else {
            setDisplayPhotos(prev => diffPhotos(prev, photos));
        }
    }, [photos]);

    // Distribute photos across rows, reducing row count if needed so each row
    // has enough photos for the marquee animation.
    const rows = useMemo(() => {
        if (displayPhotos.length === 0) return [];

        // Each row needs at least 2 photos (marquee duplicates them for seamless looping)
        const maxRows = Math.max(1, Math.floor(displayPhotos.length / 2));
        const rowCount = Math.min(settings.rows, maxRows);
        const result: PhotoMeta[][] = Array.from({ length: rowCount }, () => []);

        displayPhotos.forEach((photo, i) => {
            result[i % rowCount].push(photo);
        });

        return result;
    }, [displayPhotos, settings.rows, settings.minCountForMarquee]);

    const handlePhotoClick = useCallback((photo: PhotoMeta) => {
        setSelectedPhoto(photo);
        setGlobalPaused(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setSelectedPhoto(null);
        setGlobalPaused(false);
    }, []);

    const togglePause = useCallback(() => {
        setGlobalPaused(prev => !prev);
    }, []);

    // Keyboard controls: Space to toggle pause
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.code === 'Space' && !selectedPhoto) {
                e.preventDefault();
                togglePause();
            }
        }
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [togglePause, selectedPhoto]);

    if (photos.length === 0 || s3Status === 'error') {
        return <EmptyState />;
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', justifyContent: 'center', minHeight: 'calc(100vh - 80px)' }}>
            {rows.map((rowPhotos, i) => (
                <CarouselRow
                    key={i}
                    photos={rowPhotos}
                    direction={i % 2 === 0 ? 'left' : 'right'}
                    speedS={settings.speedS}
                    minCount={settings.minCountForMarquee}
                    paused={globalPaused || hoveredRow === i}
                    newKeys={newKeys}
                    onPhotoClick={handlePhotoClick}
                    onMouseEnter={() => setHoveredRow(i)}
                    onMouseLeave={() => setHoveredRow(null)}
                />
            ))}

            {/* Pause button */}
            <button
                onClick={togglePause}
                className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white/70 hover:text-white hover:bg-white/20 transition-all z-10"
                aria-label={globalPaused ? 'Resume slideshow' : 'Pause slideshow'}
            >
                {globalPaused ? '▶' : '⏸'}
            </button>

            {/* Photo modal */}
            {selectedPhoto && (
                <PhotoModal photo={selectedPhoto} onClose={handleCloseModal} />
            )}
        </div>
    );
}
