'use client';

import { useState, useEffect } from 'react';

const CARD_HEIGHT = 240; // px
const ROW_GAP = 24; // px
const HEADER_HEIGHT = 80; // px
const VERTICAL_PADDING = 32; // px

/**
 * Calculate the optimal number of carousel rows based on viewport height
 * and photo count. Maximizes visible photos on screen.
 *
 * @param photoCount - total number of photos available
 * @param maxRows - configured maximum rows (from settings)
 * @returns optimal row count
 */
export function useOptimalRows(photoCount: number, maxRows: number): number {
    const [rowCount, setRowCount] = useState(maxRows);

    useEffect(() => {
        function calculate() {
            const availableHeight = window.innerHeight - HEADER_HEIGHT - VERTICAL_PADDING;
            // How many rows fit vertically
            const fitsByHeight = Math.max(1, Math.floor((availableHeight + ROW_GAP) / (CARD_HEIGHT + ROW_GAP)));
            // Need at least 2 photos per row for animation
            const fitsByPhotos = Math.max(1, Math.floor(photoCount / 2));
            setRowCount(Math.min(maxRows, fitsByHeight, fitsByPhotos));
        }

        calculate();
        window.addEventListener('resize', calculate);
        return () => window.removeEventListener('resize', calculate);
    }, [photoCount, maxRows]);

    return rowCount;
}
