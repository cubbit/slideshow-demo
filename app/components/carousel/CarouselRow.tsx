import React, { useRef } from 'react';
import styles from './CarouselRow.module.css';
import CroppedImage from './CroppedImage';
import { Photo } from './Photo';

interface CarouselRowProps {
    rowPhotos: Photo[];
    direction: 'left' | 'right';
    rowIndex: number;
    minCountForMarquee?: number;
}

const CarouselRow: React.FC<CarouselRowProps> = ({
    rowPhotos,
    direction,
    _rowIndex,
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

    // For animated rows, use the same approach but with doubled array
    // This ensures the animation has enough content to scroll continuously
    const doubled = [...rowPhotos, ...rowPhotos];

    // Calculate the width for the animation
    const itemWidth = 15 * 16; // 15rem in px
    const gapWidth = 16; // 1rem in px
    const uniqueWidth = rowPhotos.length * (itemWidth + gapWidth);

    const rowStyle: React.CSSProperties = {
        ['--translate' as string]: `${uniqueWidth}px`,
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
