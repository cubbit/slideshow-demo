'use client';

import { useMemo, useRef, useEffect, useCallback, useState, memo } from 'react';
import styles from './CarouselRow.module.css';
import PhotoCard from './PhotoCard';
import type { PhotoMeta } from '@/types/photo';


interface Props {
    rowIndex: number;
    photos: PhotoMeta[];
    direction: 'left' | 'right';
    speedS: number;
    minCount: number;
    paused: boolean;
    newKeys: Set<string>;
    cardSize?: number;
    onPhotoClick: (photo: PhotoMeta) => void;
    onMouseEnter: (row: number) => void;
    onMouseLeave: () => void;
}

function arePropsEqual(prev: Props, next: Props): boolean {
    if (prev.photos !== next.photos) return false;
    if (prev.paused !== next.paused) return false;
    if (prev.direction !== next.direction) return false;
    if (prev.speedS !== next.speedS) return false;
    if (prev.minCount !== next.minCount) return false;
    if (prev.cardSize !== next.cardSize) return false;
    const prevHasNew = prev.photos.some(p => prev.newKeys.has(p.key));
    const nextHasNew = next.photos.some(p => next.newKeys.has(p.key));
    if (prevHasNew !== nextHasNew) return false;
    return true;
}

export default memo(function CarouselRow({
    rowIndex,
    photos,
    direction,
    speedS,
    minCount,
    paused,
    newKeys,
    cardSize = 240,
    onPhotoClick,
    onMouseEnter,
    onMouseLeave,
}: Props) {
    const cardWidth = cardSize + 8; // card + gap
    const isAnimated = photos.length >= minCount;
    const trackRef = useRef<HTMLDivElement>(null);
    const offsetRef = useRef(0);
    const rafRef = useRef<number>(0);
    const lastTimeRef = useRef<number>(0);
    const pausedRef = useRef(paused);
    const userScrollRef = useRef(0);

    const prevKeysRef = useRef<Set<string>>(new Set(photos.map(p => p.key)));
    pausedRef.current = paused;

    // Constant velocity across all rows (pixels per second).
    // Base: ~6 cards worth of movement per speedS seconds, independent of row photo count.
    const pxPerSecond = useMemo(() => {
        return (6 * cardWidth) / speedS;
    }, [speedS]);

    // When new photos appear, scroll so the first new one is centered on screen
    useEffect(() => {
        if (!isAnimated) return;
        const prevKeys = prevKeysRef.current;
        const newIndex = photos.findIndex(p => !prevKeys.has(p.key));
        prevKeysRef.current = new Set(photos.map(p => p.key));

        if (newIndex >= 0 && typeof window !== 'undefined') {
            const viewportCenter = window.innerWidth / 2;
            const targetOffset = newIndex * cardWidth - viewportCenter + cardWidth / 2;
            const halfWidth = photos.length * cardWidth;
            offsetRef.current = ((targetOffset % halfWidth) + halfWidth) % halfWidth;
        }
    }, [photos, isAnimated]);

    // Double photos for seamless loop
    const displayPhotos = useMemo(
        () => (isAnimated ? [...photos, ...photos] : photos),
        [photos, isAnimated]
    );

    // Animation loop
    useEffect(() => {
        if (!isAnimated || !trackRef.current) return;

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
                        size={cardSize}
                        onClick={onPhotoClick}
                    />
                ))}
            </div>
        );
    }

    return (
        <div
            className={styles.row}
            onMouseEnter={() => onMouseEnter(rowIndex)}
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
                        size={cardSize}
                        onClick={onPhotoClick}
                    />
                ))}
            </div>
        </div>
    );
}, arePropsEqual)
