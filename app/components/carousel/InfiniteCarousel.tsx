'use client';

import React, { useEffect, useState, useCallback } from 'react';
import styles from './InfiniteCarousel.module.css';
import { Photo } from './Photo';
import CarouselRow from './CarouselRow';
import { photosAreEqual, shuffleArray } from './utils';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';

interface InfiniteCarouselProps {
    pollInterval?: number;
}

const ROW_COUNT = 3;

const InfiniteCarousel: React.FC<InfiniteCarouselProps> = ({ pollInterval = 5000 }) => {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPhotos = useCallback(async () => {
        try {
            setError(null);
            const res = await fetch('/api/photos');

            if (!res.ok) {
                throw new Error(`Error fetching photos: ${res.status}`);
            }

            const newData: Photo[] = await res.json();

            if (!photosAreEqual(photos, newData)) {
                setPhotos(newData);
            }
        } catch (err) {
            console.error('Failed to fetch photos:', err);
            setError('Unable to load photos. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    }, [photos]);

    useEffect(() => {
        fetchPhotos();
        const intervalId = setInterval(fetchPhotos, pollInterval);

        return () => clearInterval(intervalId);
    }, [fetchPhotos, pollInterval]);

    if (isLoading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState message={error} onRetry={fetchPhotos} />;
    }

    if (photos.length === 0) {
        return <p className={styles.noPhotos}>No photos uploaded today.</p>;
    }

    // Create unique shuffled arrays for each row to prevent duplication
    const rows = Array.from({ length: ROW_COUNT }, (_, i) => {
        // Create a unique shuffle for each row based on index
        // This prevents all rows having the exact same shuffle pattern
        const shuffled = shuffleArray(photos);
        return i % 2 === 0 ? shuffled : [...shuffled].reverse();
    });

    return (
        <div className={styles.carousel}>
            {rows.map((rowPhotos, rowIndex) => {
                const direction = rowIndex % 2 === 0 ? 'left' : 'right';
                // Use row index as part of key for consistent re-renders
                return (
                    <CarouselRow
                        rowPhotos={rowPhotos}
                        key={`row-${rowIndex}`}
                        direction={direction}
                        rowIndex={rowIndex}
                    />
                );
            })}
        </div>
    );
};

export default InfiniteCarousel;
