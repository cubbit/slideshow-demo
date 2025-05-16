'use client';

import React, { useEffect, useState, useCallback, useRef } from 'react';
import styles from './InfiniteCarousel.module.css';
import { Photo } from './Photo';
import CarouselRow from './CarouselRow';
import { shuffleArray } from './utils';
import LoadingState from './LoadingState';
import ErrorState from './ErrorState';
import { usePublicSettings } from '@/app/hooks/usePublicSettings';

interface InfiniteCarouselProps {
    pollInterval?: number;
    onPhotoCountUpdate?: (count: number) => void;
    maxPhotosPerRow?: number; // Limit photos per row for better performance
}

const ROW_COUNT = 3;
const DEFAULT_MAX_PHOTOS_PER_ROW = 40; // Beyond this number, performance might suffer

/**
 * Compare two arrays of Photos to identify only new photos that were added
 */
const getNewPhotos = (prevPhotos: Photo[], newPhotos: Photo[]): Photo[] => {
    // If no previous photos, all are new
    if (prevPhotos.length === 0) return newPhotos;

    // Create a Set of previous photo keys for quick lookup
    const prevKeys = new Set(prevPhotos.map(p => p.key));

    // Filter out only the new photos that weren't in the previous set
    return newPhotos.filter(photo => !prevKeys.has(photo.key));
};

// Remove duplicates from array of photos
const getUniquePhotos = (photos: Photo[]): Photo[] => {
    return [...new Map(photos.map(photo => [photo.key, photo])).values()];
};

const InfiniteCarousel: React.FC<InfiniteCarouselProps> = ({
    pollInterval = 5000,
    onPhotoCountUpdate,
    maxPhotosPerRow = DEFAULT_MAX_PHOTOS_PER_ROW,
}) => {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Use our settings hook to get real-time settings
    // Refresh settings every 30 seconds
    const { settings } = usePublicSettings(30000);

    // Parse the MIN_COUNT_FOR_MARQUEE setting
    const minCountForMarquee = settings.MIN_COUNT_FOR_MARQUEE
        ? parseInt(settings.MIN_COUNT_FOR_MARQUEE, 10)
        : 6;

    // Use refs for row data to prevent unnecessary re-renders
    const rowsRef = useRef<Photo[][]>([]);

    // Track if component is mounted to prevent state updates after unmount
    const isMountedRef = useRef(true);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
        };
    }, []);

    // Function to create optimally-sized rows of photos
    const createOptimalRows = useCallback(
        (allPhotos: Photo[]): Photo[][] => {
            // First ensure uniqueness
            const uniquePhotos = getUniquePhotos(allPhotos);

            // If we have fewer photos than max, just create balanced rows
            if (uniquePhotos.length <= maxPhotosPerRow * ROW_COUNT) {
                return Array.from({ length: ROW_COUNT }, (_, i) => {
                    const shuffled = shuffleArray([...uniquePhotos]);
                    return i % 2 === 0 ? shuffled : [...shuffled].reverse();
                });
            }

            // For large collections, limit each row to maxPhotosPerRow
            // but ensure we have a good distribution
            const photoGroups: Photo[][] = [];

            // Create a shuffled copy of the array to distribute photos randomly
            const shuffledPhotos = shuffleArray([...uniquePhotos]);

            // Distribute photos evenly among rows, but limit each row
            for (let i = 0; i < ROW_COUNT; i++) {
                const startIdx = i * Math.floor(shuffledPhotos.length / ROW_COUNT);
                const endIdx = Math.min(
                    startIdx + maxPhotosPerRow,
                    i === ROW_COUNT - 1
                        ? shuffledPhotos.length
                        : (i + 1) * Math.floor(shuffledPhotos.length / ROW_COUNT)
                );

                const rowPhotos = shuffledPhotos.slice(startIdx, endIdx);

                // Alternate direction
                if (i % 2 === 1) {
                    rowPhotos.reverse();
                }

                photoGroups.push(rowPhotos);
            }

            return photoGroups;
        },
        [maxPhotosPerRow]
    );

    // Function to update rows with new photos without completely regenerating them
    const updateRowsWithNewPhotos = useCallback(
        (currentPhotos: Photo[], newlyAddedPhotos: Photo[]) => {
            if (newlyAddedPhotos.length === 0) return;

            // If we don't have any rows yet, create them
            if (rowsRef.current.length === 0) {
                rowsRef.current = createOptimalRows(currentPhotos);
                return;
            }

            // Check if we need to rebalance (in case we have way too many photos)
            const totalRowPhotos = rowsRef.current.reduce((sum, row) => sum + row.length, 0);

            // If any single row has fewer than MIN_COUNT_FOR_MARQUEE,
            // or if we have more photos than allowed, recreate the rows
            const anyRowTooSmall = rowsRef.current.some(
                row => getUniquePhotos(row).length < minCountForMarquee
            );

            if (
                anyRowTooSmall ||
                totalRowPhotos + newlyAddedPhotos.length > maxPhotosPerRow * ROW_COUNT * 1.5 ||
                Math.max(...rowsRef.current.map(r => r.length)) >
                    Math.min(...rowsRef.current.map(r => r.length)) * 2
            ) {
                rowsRef.current = createOptimalRows(currentPhotos);
                return;
            }

            // Normal case: Update existing rows by adding new photos at appropriate positions
            for (let i = 0; i < Math.min(ROW_COUNT, rowsRef.current.length); i++) {
                // Get photos to add to this row
                const photoCount = Math.ceil(newlyAddedPhotos.length / ROW_COUNT);
                const startIndex = i * photoCount;
                const endIndex = Math.min(startIndex + photoCount, newlyAddedPhotos.length);
                const photosToAdd = newlyAddedPhotos.slice(startIndex, endIndex);

                // Limit row size for performance
                if (rowsRef.current[i].length < maxPhotosPerRow) {
                    const currentRow = [...rowsRef.current[i]];

                    // For each new photo, insert it at a random position in the row
                    photosToAdd.forEach(photo => {
                        const insertPosition = Math.floor(Math.random() * (currentRow.length + 1));
                        currentRow.splice(insertPosition, 0, photo);
                    });

                    // Only keep up to maxPhotosPerRow photos per row
                    // and ensure uniqueness
                    rowsRef.current[i] = getUniquePhotos(currentRow).slice(0, maxPhotosPerRow);
                }
            }
        },
        [createOptimalRows, maxPhotosPerRow, minCountForMarquee]
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
                // Always ensure photo uniqueness
                const uniqueNewData = getUniquePhotos(newData);

                setIsInitialLoading(false);

                const newlyAddedPhotos = getNewPhotos(photos, uniqueNewData);

                if (newlyAddedPhotos.length > 0 || uniqueNewData.length < photos.length) {
                    // Update rows with new photos without recreating everything
                    updateRowsWithNewPhotos(uniqueNewData, newlyAddedPhotos);

                    // Update the main photos state
                    setPhotos(uniqueNewData);
                }
            }
        } catch (err) {
            console.error('Failed to fetch photos:', err);
            if (isMountedRef.current) {
                setIsInitialLoading(false);
                setError('Unable to load photos. Please try again later.');
            }
        } finally {
            if (isMountedRef.current) {
                setIsInitialLoading(false);
            }
        }
    }, [onPhotoCountUpdate, photos, updateRowsWithNewPhotos]);

    // Initial load effect
    useEffect(() => {
        fetchPhotos();
    }, [fetchPhotos]);

    // Polling effect with cleaner closure handling
    useEffect(() => {
        const poll = () => {
            if (isMountedRef.current) {
                fetchPhotos();
            }
        };

        const intervalId = setInterval(poll, pollInterval);
        return () => clearInterval(intervalId);
    }, [fetchPhotos, pollInterval]);

    // Initialize row data if needed
    useEffect(() => {
        if (photos.length > 0 && rowsRef.current.length === 0) {
            rowsRef.current = createOptimalRows(photos);
        }
    }, [photos, createOptimalRows]);

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
    const rows = rowsRef.current.length > 0 ? rowsRef.current : createOptimalRows(photos);

    return (
        <div className={styles.carousel}>
            {rows.map((rowPhotos, rowIndex) => {
                const direction = rowIndex % 2 === 0 ? 'left' : 'right';

                return (
                    <CarouselRow
                        rowPhotos={rowPhotos}
                        key={`row-${rowIndex}`}
                        direction={direction}
                        minCountForMarquee={minCountForMarquee}
                    />
                );
            })}
        </div>
    );
};

export default InfiniteCarousel;
