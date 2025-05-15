import { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from './CroppedImage.module.css';
import { Photo } from './Photo';

interface CroppedImageProps {
    photo: Photo;
    priority?: boolean;
}

const CroppedImage: React.FC<CroppedImageProps> = ({ photo, priority = false }) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isError, setIsError] = useState(false);
    const [startLoading, setStartLoading] = useState(false);

    // Delayed loading to ensure we only show photos that are loaded
    useEffect(() => {
        // Priority images start loading immediately
        if (priority) {
            setStartLoading(true);
            return;
        }

        // Non-priority images get a tiny delay to stagger loading
        // This prevents too many simultaneous requests
        const timer = setTimeout(() => {
            setStartLoading(true);
        }, 10);

        return () => clearTimeout(timer);
    }, [priority]);

    // Only render the actual image after it's fully loaded
    // This prevents empty spaces in the carousel
    return (
        <div className={styles.photoContainer}>
            {isError ? (
                <div className={styles.errorContainer}>
                    <span className={styles.errorIcon}>!</span>
                </div>
            ) : (
                <>
                    {/* Always show loading placeholder until image is loaded */}
                    {!isLoaded && (
                        <div className={styles.placeholderContainer}>
                            <div className={styles.imagePlaceholder}></div>
                        </div>
                    )}

                    {/* Only start loading the image when ready */}
                    {startLoading && (
                        <Image
                            width={240}
                            height={240}
                            unoptimized
                            priority={priority}
                            loading={priority ? 'eager' : 'lazy'}
                            src={photo.url}
                            alt=""
                            aria-hidden="true"
                            className={`${styles.photo} ${isLoaded ? styles.loaded : ''}`}
                            onLoad={() => setIsLoaded(true)}
                            onError={() => setIsError(true)}
                            style={{
                                objectFit: 'cover',
                                display: isLoaded ? 'block' : 'none', // Only show when loaded
                            }}
                        />
                    )}
                </>
            )}
        </div>
    );
};

export default CroppedImage;
