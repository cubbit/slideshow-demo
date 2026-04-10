'use client';

import { useMemo, useRef, useEffect, useCallback } from 'react';
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
    const isAnimated = photos.length >= minCount;
    const trackRef = useRef<HTMLDivElement>(null);
    const offsetRef = useRef(0);
    const rafRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);
    const pausedRef = useRef(paused);
    const userScrollRef = useRef(0);

    pausedRef.current = paused;

    // Pixels per second based on speedS and photo count
    const pxPerSecond = useMemo(() => {
        const cardWidth = 248; // 240px + 8px gap
        const totalWidth = photos.length * cardWidth;
        const duration = (speedS / 10) * photos.length;
        return totalWidth / duration;
    }, [photos.length, speedS]);

    // Double photos for seamless loop
    const displayPhotos = useMemo(
        () => (isAnimated ? [...photos, ...photos] : photos),
        [photos, isAnimated]
    );

    // Animation loop
    useEffect(() => {
        if (!isAnimated || !trackRef.current) return;

        const cardWidth = 248;
        const halfWidth = photos.length * cardWidth;

        function animate(time: number) {
            if (!lastTimeRef.current) lastTimeRef.current = time;
            const delta = (time - lastTimeRef.current) / 1000;
            lastTimeRef.current = time;

            if (!pausedRef.current) {
                const dir = direction === 'left' ? 1 : -1;
                offsetRef.current += pxPerSecond * delta * dir;
            }

            // Add user scroll offset
            if (userScrollRef.current !== 0) {
                offsetRef.current += userScrollRef.current;
                userScrollRef.current = 0;
            }

            // Wrap around for seamless loop
            if (offsetRef.current >= halfWidth) offsetRef.current -= halfWidth;
            if (offsetRef.current < 0) offsetRef.current += halfWidth;

            if (trackRef.current) {
                trackRef.current.style.transform = `translate3d(${-offsetRef.current}px, 0, 0)`;
            }

            rafRef.current = requestAnimationFrame(animate);
        }

        rafRef.current = requestAnimationFrame(animate);
        return () => {
            cancelAnimationFrame(rafRef.current);
            lastTimeRef.current = 0;
        };
    }, [isAnimated, direction, pxPerSecond, photos.length]);

    // Trackpad/wheel scroll handler
    const handleWheel = useCallback((e: React.WheelEvent) => {
        // Use deltaX for horizontal trackpad gestures, fall back to deltaY for mouse wheel
        const delta = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        userScrollRef.current += delta;
        e.preventDefault();
    }, []);

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
            onWheel={handleWheel}
        >
            <div ref={trackRef} className={styles.trackManual}>
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
