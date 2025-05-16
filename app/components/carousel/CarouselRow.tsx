import React, { useRef } from 'react';
import styles from './CarouselRow.module.css';
import CroppedImage from './CroppedImage';
import { Photo } from './Photo';
import { usePublicSettings } from '@/app/hooks/usePublicSettings';

interface CarouselRowProps {
    rowPhotos: Photo[];
    direction: 'left' | 'right';
    minCountForMarquee?: number;
}

const CarouselRow: React.FC<CarouselRowProps> = ({
    rowPhotos,
    direction,
    minCountForMarquee = 6, // Fallback default
}) => {
    const rowRef = useRef<HTMLDivElement>(null);

    // Get settings from our hook - we don't need to refresh too often here
    const { settings } = usePublicSettings(60000);

    // Get slideshow speed from settings
    const slideshowSpeed = settings.SLIDESHOW_SPEED_S || '40';

    // Ensure we're working with unique photos
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

    // For animated rows, just display the original photos
    // The animation will handle the infinite scrolling with CSS

    // Calculate animation width - the most critical part for infinite scrolling!
    // A photo width is 15rem, and gap is 2rem
    // Formula: (numPhotos * photoWidth) + ((numPhotos - 1) * gapWidth)
    const photoWidth = 15; // rem
    const gapWidth = 2; // rem
    const totalWidth = uniquePhotos.length * photoWidth + (uniquePhotos.length - 1) * gapWidth;

    // Use this width for the animation
    const rowStyle: React.CSSProperties = {
        ['--translate' as string]: `${totalWidth}rem`,
        ['--slideshow-speed' as string]: `${slideshowSpeed}s`,
    };

    const rowClass = direction === 'left' ? styles.scrollLeftRow : styles.scrollRightRow;

    return (
        <div className={styles.rowContainer}>
            <div className={`${styles.staticRow} ${rowClass}`} style={rowStyle} ref={rowRef}>
                {uniquePhotos.map((photo, i) => (
                    <CroppedImage photo={photo} key={`${photo.key}-static-${i}`} priority={i < 5} />
                ))}
                {uniquePhotos.map((photo, i) => (
                    <CroppedImage
                        photo={photo}
                        key={`${photo.key}-duplicate-${i}`}
                        priority={false}
                    />
                ))}
            </div>
        </div>
    );
};

export default CarouselRow;
