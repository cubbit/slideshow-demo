'use client';

import { useState } from 'react';
import styles from './CarouselRow.module.css';
import type { PhotoMeta } from '@/types/photo';

interface Props {
    photo: PhotoMeta;
    isNew?: boolean;
    priority?: boolean;
    onClick?: (photo: PhotoMeta) => void;
}

export default function PhotoCard({ photo, isNew, priority, onClick }: Props) {
    const [loaded, setLoaded] = useState(false);
    const [src, setSrc] = useState(photo.thumbnailUrl);
    const [hidden, setHidden] = useState(false);

    if (hidden) return null;

    return (
        <div
            className={`${styles.photo} ${isNew ? styles.highlight : ''}`}
            onClick={() => onClick?.(photo)}
        >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                src={src}
                alt=""
                loading={priority ? 'eager' : 'lazy'}
                decoding="async"
                onLoad={() => setLoaded(true)}
                onError={() => {
                    if (src !== photo.url) {
                        setSrc(photo.url);
                    } else {
                        setHidden(true);
                    }
                }}
                style={{ opacity: loaded ? 1 : 0, transition: 'opacity 0.3s' }}
            />
        </div>
    );
}
