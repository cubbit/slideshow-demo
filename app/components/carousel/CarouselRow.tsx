import React, { useRef } from 'react';
import styles from './CarouselRow.module.css';
import CroppedImage from './CroppedImage';
import { Photo } from './Photo';

interface CarouselRowProps {
    rowPhotos: Photo[];
    direction: 'left' | 'right';
    minCountForMarquee?: number;
}

export const SLIDESHOW_SPEED_S = process.env.NEXT_PUBLIC_SLIDESHOW_SPEED_S || '40';

const CarouselRow: React.FC<CarouselRowProps> = ({
    rowPhotos,
    direction,
    minCountForMarquee = 6,
}) => {
    const rowRef = useRef<HTMLDivElement>(null);

    // For static row (few photos), just render them all normally
    if (rowPhotos.length < minCountForMarquee) {
        return (
            <div className={styles.staticRow} ref={rowRef}>
                {rowPhotos.map((photo, i) => (
                    <CroppedImage photo={photo} key={`${photo.key}-${i}`} />
                ))}
            </div>
        );
    }

    // For animated rows, use doubled array for seamless looping
    const doubled = [...rowPhotos, ...rowPhotos];

    // Get dimensions for animation
    const itemWidth = 15; // rem
    const uniqueWidth = rowPhotos.length * (itemWidth + 1); // 15rem + 1rem gap

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
