'use client';

import { useMemo } from 'react';
import styles from './CarouselRow.module.css';
import PhotoCard from './PhotoCard';
import type { PhotoMeta } from '@/types/photo';

interface Props {
    photos: PhotoMeta[];
    direction: 'left' | 'right';
    speedS: number;
    minCount: number;
    paused: boolean;
    newKeys: Set<string>;
    onPhotoClick: (photo: PhotoMeta) => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}

export default function CarouselRow({
    photos,
    direction,
    speedS,
    minCount,
    paused,
    newKeys,
    onPhotoClick,
    onMouseEnter,
    onMouseLeave,
}: Props) {
    // For the infinite scroll, we duplicate the photos so the animation loops seamlessly
    const isAnimated = photos.length >= minCount;

    // Double the photos for seamless loop
    const displayPhotos = useMemo(
        () => (isAnimated ? [...photos, ...photos] : photos),
        [photos, isAnimated]
    );

    if (photos.length === 0) return null;

    if (!isAnimated) {
        return (
            <div className={styles.static}>
                {photos.map((photo, i) => (
                    <PhotoCard
                        key={photo.key}
                        photo={photo}
                        isNew={newKeys.has(photo.key)}
                        priority={i < 5}
                        onClick={onPhotoClick}
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            className={styles.row}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <div
                className={`${styles.track} ${direction === 'right' ? styles.reverse : ''} ${paused ? styles.paused : ''}`}
                style={{ '--speed': `${speedS}s` } as React.CSSProperties}
            >
                {displayPhotos.map((photo, i) => (
                    <PhotoCard
                        key={`${photo.key}-${i}`}
                        photo={photo}
                        isNew={newKeys.has(photo.key)}
                        priority={i < 10}
                        onClick={onPhotoClick}
                    />
                ))}
            </div>
        </div>
    );
}
