import React, { useRef } from 'react';
import styles from './CarouselRow.module.css';
import CroppedImage from './CroppedImage';
import { Photo } from './Photo';

interface CarouselRowProps {
    rowPhotos: Photo[];
    direction: 'left' | 'right';
    minCountForMarquee?: number;
}

// Get environment variables
export const SLIDESHOW_SPEED_S = process.env.NEXT_PUBLIC_SLIDESHOW_SPEED_S || '40';
export const MIN_COUNT_FOR_MARQUEE = process.env.NEXT_PUBLIC_MIN_COUNT_FOR_MARQUEE
    ? parseInt(process.env.NEXT_PUBLIC_MIN_COUNT_FOR_MARQUEE, 10)
    : 6;

const CarouselRow: React.FC<CarouselRowProps> = ({
    rowPhotos,
    direction,
    minCountForMarquee = MIN_COUNT_FOR_MARQUEE, // Use ENV variable with fallback
}) => {
    const rowRef = useRef<HTMLDivElement>(null);

    // Ensure we're working with the correct photo array
    // This prevents accidental duplication in static rows
    const uniquePhotos = [...new Map(rowPhotos.map(photo => [photo.key, photo])).values()];

    // For static row (few photos), render with proper spacing
    if (uniquePhotos.length < minCountForMarquee) {
        return (
            <div className={styles.rowContainer}>
                <div className={styles.staticRow} ref={rowRef}>
                    {uniquePhotos.map((photo, i) => (
                        <CroppedImage photo={photo} key={`${photo.key}-${i}`} priority={i < 5} />
                    ))}
                </div>
            </div>
        );
    }

    // For animated rows, use doubled array for seamless looping
    const doubled = [...uniquePhotos, ...uniquePhotos];

    // Get dimensions for animation
    const itemWidth = 15; // rem
    const gapWidth = 2; // rem - updated to match the CSS gap value
    const uniqueWidth = uniquePhotos.length * (itemWidth + gapWidth); // 15rem + 2rem gap

    const rowStyle: React.CSSProperties = {
        ['--translate' as string]: `${uniqueWidth}rem`,
        ['--slideshow-speed' as string]: `${SLIDESHOW_SPEED_S}s`,
    };

    const rowClass = direction === 'left' ? styles.scrollLeftRow : styles.scrollRightRow;

    return (
        <div className={styles.rowContainer}>
            <div className={`${styles.staticRow} ${rowClass}`} style={rowStyle} ref={rowRef}>
                {doubled.map((photo, i) => (
                    <CroppedImage photo={photo} key={`${photo.key}-${i}`} priority={i < 5} />
                ))}
            </div>
        </div>
    );
};

export default CarouselRow;
