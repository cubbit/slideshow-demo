'use client';

import { useState, useEffect, useRef } from 'react';
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
    const imgRef = useRef<HTMLImageElement>(null);

    // Check if image was already cached (onLoad won't fire for cached images)
    useEffect(() => {
        const img = imgRef.current;
        if (img && img.complete && img.naturalWidth > 0) {
            setLoaded(true);
        }
    }, []);

    if (hidden) return null;

    return (
        <div
            className={`${styles.photo} ${isNew ? styles.highlight : ''}`}
            onClick={() => onClick?.(photo)}
            style={{ backgroundColor: loaded ? 'transparent' : 'rgba(255,255,255,0.06)' }}
        >
            {!loaded && (
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}>
                    <div style={{
                        width: 24,
                        height: 24,
                        border: '2px solid rgba(255,255,255,0.15)',
                        borderTopColor: 'rgba(255,255,255,0.5)',
                        borderRadius: '50%',
                        animation: 'spin 0.8s linear infinite',
                    }} />
                </div>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
                ref={imgRef}
                src={src}
                alt=""
                loading={priority ? 'eager' : 'lazy'}
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
