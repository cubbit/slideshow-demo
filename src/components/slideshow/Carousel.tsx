'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import CarouselRow from './CarouselRow';
import PhotoModal from './PhotoModal';
import EmptyState from './EmptyState';
import { usePhotos } from '@/hooks/usePhotos';
import { usePublicSettings } from '@/hooks/usePublicSettings';
import { useS3Health } from '@/contexts/S3HealthContext';
import type { PhotoMeta } from '@/types/photo';
import type { PublicSettings } from '@/types/settings';

interface Props {
    initialPhotos: PhotoMeta[];
    initialSettings: PublicSettings;
}

function shuffleArray<T>(arr: T[]): T[] {
    const shuffled = [...arr];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

export default function Carousel({ initialPhotos, initialSettings }: Props) {
    const { photos, newKeys } = usePhotos(initialPhotos);
    const settings = usePublicSettings(initialSettings);
    const s3Status = useS3Health();
    const [globalPaused, setGlobalPaused] = useState(false);
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);
    const [selectedPhoto, setSelectedPhoto] = useState<PhotoMeta | null>(null);

    // Distribute photos across rows
    const rows = useMemo(() => {
        if (photos.length === 0) return [];

        const rowCount = settings.rows;
        const result: PhotoMeta[][] = Array.from({ length: rowCount }, () => []);

        const shuffled = shuffleArray(photos);
        shuffled.forEach((photo, i) => {
            result[i % rowCount].push(photo);
        });

        return result;
    }, [photos, settings.rows]);

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
        <div className="flex flex-col gap-2 h-full justify-center">
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
