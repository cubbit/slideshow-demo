'use client';

import { useState, useEffect } from 'react';

const ROW_GAP = 24; // px
const HEADER_HEIGHT = 80; // px
const VERTICAL_PADDING = 32; // px
const MIN_CARD_HEIGHT = 160; // px — don't go smaller than this
const MAX_CARD_HEIGHT = 280; // px — don't go bigger than this

/**
 * Calculate the optimal number of carousel rows and card size
 * based on viewport height and photo count.
 *
 * @param photoCount - total number of photos available
 * @param maxRows - configured maximum rows (from settings)
 * @returns { rowCount, cardSize } — optimal row count and card dimensions
 */
export function useOptimalRows(
    photoCount: number,
    maxRows: number
): { rowCount: number; cardSize: number } {
    const [result, setResult] = useState({ rowCount: maxRows, cardSize: 240 });

    useEffect(() => {
        function calculate() {
            const availableHeight = window.innerHeight - HEADER_HEIGHT - VERTICAL_PADDING;
            // Need at least 2 photos per row for animation
            const fitsByPhotos = Math.max(1, Math.floor(photoCount / 2));
            const rowCount = Math.min(maxRows, fitsByPhotos);

            // Calculate card size to fill available height
            const cardSize = Math.min(
                MAX_CARD_HEIGHT,
                Math.max(
                    MIN_CARD_HEIGHT,
                    Math.floor((availableHeight - (rowCount - 1) * ROW_GAP) / rowCount)
                )
            );

            setResult({ rowCount, cardSize });
        }

        calculate();
        window.addEventListener('resize', calculate);
        return () => window.removeEventListener('resize', calculate);
    }, [photoCount, maxRows]);

    return result;
}
