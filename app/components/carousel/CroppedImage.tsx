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

    return (
        <div className={styles.photoContainer}>
            {isError ? (
                <div className={styles.errorContainer}>
                    <span className={styles.errorIcon}>!</span>
                </div>
            ) : (
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
                    style={{ objectFit: 'cover' }}
                />
            )}
        </div>
    );
};

export default CroppedImage;
