import { useState } from 'react';
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

    // Simple placeholder color instead of SVG for better performance
    const blurDataURL =
        'data:image/gif;base64,R0lGODlhAQABAIAAAMLCwgAAACH5BAAAAAAALAAAAAABAAEAAAICRAEAOw==';

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
                    alt=""
                    aria-hidden="true" // Hide from screen readers since this is just decorative
                    className={`${styles.photo} ${isLoaded ? styles.loaded : ''}`}
                    onLoad={() => setIsLoaded(true)}
                    onError={() => setIsError(true)}
                    placeholder="blur"
                    blurDataURL={blurDataURL}
                    style={{ objectFit: 'cover' }}
                />
            )}
        </div>
    );
};

export default CroppedImage;
