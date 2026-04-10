'use client';

import { useState, useEffect, useRef, memo } from 'react';
import styles from './CarouselRow.module.css';
import type { PhotoMeta } from '@/types/photo';

interface Props {
    photo: PhotoMeta;
    isNew?: boolean;
    priority?: boolean;
    size?: number;
    onClick?: (photo: PhotoMeta) => void;
}

export default memo(function PhotoCard({ photo, isNew, priority, size = 240, onClick }: Props) {
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
            style={{ width: `${size}px`, height: `${size}px`, backgroundColor: loaded ? 'transparent' : 'rgba(255,255,255,0.06)' }}
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
            {isNew && loaded && (
                <div style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    backgroundColor: '#0065FF',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    zIndex: 2,
                    textTransform: 'uppercase',
                    boxShadow: '0 2px 8px rgba(0,101,255,0.5)',
                }}>
                    NEW
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
})
