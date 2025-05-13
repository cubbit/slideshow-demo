import React, { useRef } from 'react';
import styles from './CarouselRow.module.css';
import CroppedImage from './CroppedImage';
import { Photo } from './Photo';

interface VirtualizedCarouselRowProps {
    rowPhotos: Photo[];
    direction: 'left' | 'right';
    rowIndex: number;
    minCountForMarquee?: number;
}

const VirtualizedCarouselRow: React.FC<VirtualizedCarouselRowProps> = ({
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

    // For animated rows, use the same double-array approach as original
    // but with the will-change optimization
    const doubled = [...rowPhotos, ...rowPhotos];

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

export default VirtualizedCarouselRow;
