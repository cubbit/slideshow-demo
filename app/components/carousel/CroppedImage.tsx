import { useState } from 'react';
import Image from 'next/image';
import styles from './CroppedImage.module.css';
import { Photo } from './Photo';

interface CroppedImageProps {
    photo: Photo;
    priority?: boolean;
}

const CroppedImage: React.FC<CroppedImageProps> = ({
    photo,
    priority = false, // Only set priority for images in viewport initially
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [isError, setIsError] = useState(false);

    // Generate placeholder blur data URL (can be pre-computed for production)
    const blurDataURL = `data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 500 500'%3E%3Cfilter id='b' color-interpolation-filters='sRGB'%3E%3CfeGaussianBlur stdDeviation='20'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' fill='%23555555'/%3E%3C/svg%3E`;

    return (
        <div className={styles.photoContainer}>
            {isError ? (
                <div className={styles.errorContainer}>
                    <span className={styles.errorIcon}>!</span>
                </div>
            ) : (
                <Image
                    width={500}
                    height={500}
                    unoptimized
                    priority={priority}
                    loading={priority ? 'eager' : 'lazy'}
                    src={photo.url}
                    alt={`Photo ${photo.key.split('/').pop() || 'image'}`}
                    className={`${styles.photo} ${isLoaded ? styles.loaded : ''}`}
                    onLoad={() => setIsLoaded(true)}
                    onError={() => setIsError(true)}
                    placeholder="blur"
                    blurDataURL={blurDataURL}
                />
            )}
        </div>
    );
};

export default CroppedImage;
