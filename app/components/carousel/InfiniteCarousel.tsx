'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import styles from './InfiniteCarousel.module.css';
import { Photo } from './Photo';
import CarouselRow from './CarouselRow';
import { shuffleArray } from './utils';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';

interface InfiniteCarouselProps {
    pollInterval?: number;
    onPhotoCountUpdate?: (count: number) => void;
}

const ROW_COUNT = 3;

/**
 * Compare two arrays of Photos to identify only new photos that were added
 * Returns array of only the new photos, or empty array if none were added
 */
const getNewPhotos = (prevPhotos: Photo[], newPhotos: Photo[]): Photo[] => {
    // If no previous photos, all are new
    if (prevPhotos.length === 0) return newPhotos;

    // Create a Set of previous photo keys for quick lookup
    const prevKeys = new Set(prevPhotos.map(p => p.key));

    // Filter out only the new photos that weren't in the previous set
    return newPhotos.filter(photo => !prevKeys.has(photo.key));
};

const InfiniteCarousel: React.FC<InfiniteCarouselProps> = ({
    pollInterval = 5000,
    onPhotoCountUpdate,
}) => {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
    const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    // Use refs for row data to prevent unnecessary re-renders
    const rowsRef = useRef<Photo[][]>([]);

    // Track if component is mounted to prevent state updates after unmount
    const isMountedRef = useRef(true);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Function to update rows with new photos without completely regenerating them
    const updateRowsWithNewPhotos = useCallback(
        (currentPhotos: Photo[], newlyAddedPhotos: Photo[]) => {
            if (newlyAddedPhotos.length === 0) return;

            // If we don't have any rows yet, create them
            if (rowsRef.current.length === 0) {
                rowsRef.current = Array.from({ length: ROW_COUNT }, (_, i) => {
                    const shuffled = shuffleArray([...currentPhotos]);
                    return i % 2 === 0 ? shuffled : [...shuffled].reverse();
                });
                return;
            }

            // Update existing rows by adding new photos at appropriate positions
            for (let i = 0; i < ROW_COUNT; i++) {
                const currentRow = [...rowsRef.current[i]];

                // For each new photo, insert it at a random position in the row
                newlyAddedPhotos.forEach(photo => {
                    const insertPosition = Math.floor(Math.random() * (currentRow.length + 1));
                    currentRow.splice(insertPosition, 0, photo);
                });

                rowsRef.current[i] = currentRow;
            }
        },
        []
    );

    // Callback for photo fetching that doesn't depend on the photos state
    const fetchPhotos = useCallback(async () => {
        try {
            // Add a cache-busting parameter to prevent browser caching
            const timestamp = new Date().getTime();
            const res = await fetch(`/api/photos?t=${timestamp}`);

            if (!res.ok) {
                throw new Error(`Error fetching photos: ${res.status}`);
            }

            const newData: Photo[] = await res.json();

            // Update photo count callback if provided
            if (onPhotoCountUpdate) {
                onPhotoCountUpdate(newData.length);
            }

            if (isMountedRef.current) {
                const newlyAddedPhotos = getNewPhotos(photos, newData);

                if (newlyAddedPhotos.length > 0 || newData.length < photos.length) {
                    // Update rows with new photos without recreating everything
                    updateRowsWithNewPhotos(newData, newlyAddedPhotos);

                    // Update the main photos state
                    setPhotos(newData);
                }
            }
        } catch (err) {
            console.error('Failed to fetch photos:', err);
            if (isMountedRef.current) {
                setError('Unable to load photos. Please try again later.');
            }
        } finally {
            if (isMountedRef.current) {
                setIsInitialLoading(false);
                setIsRefreshing(false);
            }
        }
    }, [onPhotoCountUpdate, photos, updateRowsWithNewPhotos]);

    // Initial load effect
    useEffect(() => {
        fetchPhotos();
    }, [fetchPhotos]);

    // Polling effect with cleaner closure handling
    useEffect(() => {
        // Create a function that captures the current fetchPhotos
        const poll = () => {
            if (isMountedRef.current) {
                setIsRefreshing(true);
                fetchPhotos();
            }
        };

        const intervalId = setInterval(poll, pollInterval);
        return () => clearInterval(intervalId);
    }, [fetchPhotos, pollInterval]);

    // Initialize row data if needed
    useEffect(() => {
        if (photos.length > 0 && rowsRef.current.length === 0) {
            rowsRef.current = Array.from({ length: ROW_COUNT }, (_, i) => {
                const shuffled = shuffleArray([...photos]);
                return i % 2 === 0 ? shuffled : [...shuffled].reverse();
            });
        }
    }, [photos]);

    if (isInitialLoading) {
        return <LoadingState />;
    }

    if (error) {
        return <ErrorState message={error} onRetry={fetchPhotos} />;
    }

    if (photos.length === 0) {
        return <p className={styles.noPhotos}>No photos uploaded today.</p>;
    }

    // Use rows from the ref to maintain consistency between renders
    const rows =
        rowsRef.current.length > 0
            ? rowsRef.current
            : Array.from({ length: ROW_COUNT }, (_, i) => {
                  const shuffled = shuffleArray([...photos]);
                  return i % 2 === 0 ? shuffled : [...shuffled].reverse();
              });

    return (
        <div className={styles.carousel}>
            {rows.map((rowPhotos, rowIndex) => {
                const direction = rowIndex % 2 === 0 ? 'left' : 'right';

                return (
                    <CarouselRow
                        rowPhotos={rowPhotos}
                        key={`row-${rowIndex}`}
                        direction={direction}
                        rowIndex={rowIndex}
                    />
                );
            })}

            {isRefreshing && (
                <div className={styles.refreshIndicator} aria-live="polite">
                    <span className="sr-only">Refreshing photos...</span>
                </div>
            )}
        </div>
    );
};

export default InfiniteCarousel;
