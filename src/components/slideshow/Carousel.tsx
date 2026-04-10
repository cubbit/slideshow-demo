'use client';

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import CarouselRow from './CarouselRow';
import PhotoModal from './PhotoModal';
import EmptyState from './EmptyState';
import { usePhotos } from '@/hooks/usePhotos';
import { usePublicSettings } from '@/hooks/usePublicSettings';
import { useS3Health } from '@/contexts/S3HealthContext';
import { useDate } from '@/contexts/DateContext';
import { shuffleArray, diffPhotos } from '@/lib/photos/diff';
import { distributeIntoRows } from '@/lib/photos/rows';
import { useOptimalRows } from '@/hooks/useOptimalRows';
import type { PhotoMeta } from '@/types/photo';
import type { PublicSettings } from '@/types/settings';

interface Props {
    initialPhotos: PhotoMeta[];
    initialSettings: PublicSettings;
}

export default function Carousel({ initialPhotos, initialSettings }: Props) {
    const { apiDate } = useDate();
    const { photos, newKeys } = usePhotos(initialPhotos, apiDate);
    const settings = usePublicSettings(initialSettings);
    const s3Status = useS3Health();

    // Detect mobile — must be before any conditional returns
    const [isMobile, setIsMobile] = useState(false);
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 768);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);
    const { rowCount: autoRowCount, cardSize: autoCardSize } = useOptimalRows(photos.length, settings.rows);
    const baseCardSize = settings.autoRows ? autoCardSize : 240;
    const [sizeOverride, setSizeOverride] = useState<number | null>(null);
    const cardSize = sizeOverride ?? baseCardSize;

    // Restore slider value from localStorage after mount (avoids hydration mismatch)
    useEffect(() => {
        const stored = localStorage.getItem('slideshow-card-size');
        if (stored) setSizeOverride(parseInt(stored, 10));
    }, []);

    const handleSizeChange = useCallback((value: number) => {
        setSizeOverride(value);
        localStorage.setItem('slideshow-card-size', String(value));
    }, []);

    // Recalculate rows based on actual card size — if slider makes photos smaller, add more rows
    const effectiveRows = useMemo(() => {
        if (!settings.autoRows && sizeOverride === null) return settings.rows;
        const availableHeight = typeof window !== 'undefined' ? window.innerHeight - 80 - 32 : 800;
        const fitsByHeight = Math.max(1, Math.floor((availableHeight + 24) / (cardSize + 24)));
        const fitsByPhotos = Math.max(1, Math.floor(photos.length / 2));
        return Math.min(fitsByHeight, fitsByPhotos);
    }, [cardSize, photos.length, settings.rows, settings.autoRows, sizeOverride]);
    const [globalPaused, setGlobalPaused] = useState(false);
    const [hoveredRow, setHoveredRow] = useState<number | null>(null);
    const [selectedPhoto, setSelectedPhoto] = useState<PhotoMeta | null>(null);

    // Maintain a stable display list: use server order for initial render (no hydration mismatch),
    // shuffle on mount, then only diff (add/remove) on subsequent polls.
    const [displayPhotos, setDisplayPhotos] = useState<PhotoMeta[]>(initialPhotos);
    const mountedRef = useRef(false);
    useEffect(() => {
        if (photos.length === 0) {
            setDisplayPhotos([]);
            return;
        }

        if (!mountedRef.current) {
            mountedRef.current = true;
            setDisplayPhotos(shuffleArray(photos));
        } else {
            setDisplayPhotos(prev => diffPhotos(prev, photos));
        }
    }, [photos]);

    // Distribute photos across rows with stable references.
    // Rows whose photos haven't changed keep the same array reference,
    // so memoized CarouselRow components skip re-rendering.
    const prevRowsRef = useRef<PhotoMeta[][]>([]);
    const rows = useMemo(() => {
        const distributed = distributeIntoRows(displayPhotos, effectiveRows);

        const result = distributed.map((newRow, i) => {
            const prevRow = prevRowsRef.current[i];
            // Reuse previous reference if keys are identical
            if (prevRow && prevRow.length === newRow.length &&
                prevRow.every((p, j) => p.key === newRow[j].key)) {
                return prevRow;
            }
            return newRow;
        });

        prevRowsRef.current = result;
        return result;
    }, [displayPhotos, effectiveRows]);

    // Stable callbacks for row interaction
    const handleMouseEnter = useCallback((row: number) => setHoveredRow(row), []);
    const handleMouseLeave = useCallback(() => setHoveredRow(null), []);

    const handlePhotoClick = useCallback((photo: PhotoMeta) => {
        setSelectedPhoto(photo);
        setGlobalPaused(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setSelectedPhoto(null);
        setGlobalPaused(false);
    }, []);

    const togglePause = useCallback(() => {
        setGlobalPaused(prev => !prev);
    }, []);

    // Keyboard controls: Space to toggle pause
    useEffect(() => {
        function handleKey(e: KeyboardEvent) {
            if (e.code === 'Space' && !selectedPhoto) {
                e.preventDefault();
                togglePause();
            }
        }
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [togglePause, selectedPhoto]);

    // Show splash briefly on initial mount, dismiss once first fetch resolves
    const [splashDone, setSplashDone] = useState(false);
    const splashMountRef = useRef(false);
    useEffect(() => {
        if (splashMountRef.current) return;
        // Wait minimum 500ms, then dismiss as soon as data is available or 2s max
        const minTimer = setTimeout(() => {
            splashMountRef.current = true;
            setSplashDone(true);
        }, photos.length > 0 || s3Status === 'error' ? 500 : 2000);
        return () => clearTimeout(minTimer);
    }, [photos.length, s3Status]);

    if (!splashDone) {
        const splashName = typeof document !== 'undefined' ? document.body.dataset.appName || 'Slideshow' : 'Slideshow';
        return (
            <div style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: 'calc(100vh - 80px)',
                gap: '28px',
                animation: 'carouselFadeIn 0.5s ease-out both',
            }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/cubbit-logo.svg" alt="Cubbit" style={{ height: '64px', width: 'auto' }} />
                <span style={{
                    fontSize: '16px',
                    fontWeight: 700,
                    letterSpacing: '0.2em',
                    color: '#0065FF',
                    textTransform: 'uppercase',
                }}>
                    {splashName}
                </span>
                <div style={{
                    width: 36,
                    height: 36,
                    border: '2.5px solid rgba(255,255,255,0.08)',
                    borderTopColor: '#0065FF',
                    borderRadius: '50%',
                    animation: 'spin 0.8s linear infinite',
                    marginTop: '8px',
                }} />
            </div>
        );
    }

    if (photos.length === 0 || s3Status === 'error') {
        return <EmptyState />;
    }

    // Mobile: camera roll grid using thumbnails
    if (isMobile) {
        return (
            <>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, 1fr)',
                    gap: '1px',
                    overflowY: 'auto',
                    height: 'calc(100vh - 90px)',
                    backgroundColor: 'rgba(255,255,255,0.05)',
                }}>
                    {displayPhotos.map(photo => (
                        <div
                            key={photo.key}
                            onClick={() => handlePhotoClick(photo)}
                            style={{
                                position: 'relative',
                                paddingBottom: '100%',
                                overflow: 'hidden',
                                backgroundColor: '#0E0E15',
                                cursor: 'pointer',
                            }}
                        >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={photo.thumbnailUrl}
                                alt=""
                                loading="lazy"
                                style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block',
                                }}
                            />
                        </div>
                    ))}
                </div>
                {selectedPhoto && (
                    <PhotoModal photo={selectedPhoto} onClose={handleCloseModal} />
                )}
            </>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', justifyContent: 'center', minHeight: 'calc(100vh - 80px)' }}>
            {rows.map((rowPhotos, i) => (
                <CarouselRow
                    key={i}
                    rowIndex={i}
                    photos={rowPhotos}
                    direction={i % 2 === 0 ? 'left' : 'right'}
                    speedS={settings.speedS}
                    minCount={settings.minCountForMarquee}
                    paused={globalPaused || hoveredRow === i}
                    newKeys={newKeys}
                    cardSize={cardSize}
                    onPhotoClick={handlePhotoClick}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                />
            ))}

            {/* Bottom controls */}
            <div style={{
                position: 'fixed',
                bottom: 24,
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                backgroundColor: 'rgba(22,22,33,0.8)',
                backdropFilter: 'blur(12px)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.08)',
                padding: '8px 16px',
                zIndex: 10,
            }}>
                {/* Pause/Resume */}
                <button
                    onClick={togglePause}
                    style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        border: '1px solid rgba(255,255,255,0.15)',
                        color: 'rgba(255,255,255,0.7)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '12px',
                        transition: 'all 0.15s',
                    }}
                    aria-label={globalPaused ? 'Resume slideshow' : 'Pause slideshow'}
                >
                    {globalPaused ? '▶' : '⏸'}
                </button>

                <div style={{ width: '1px', height: '20px', backgroundColor: 'rgba(255,255,255,0.1)' }} />

                {/* Size slider */}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
                <input
                    type="range"
                    min={120}
                    max={320}
                    value={cardSize}
                    onChange={e => handleSizeChange(parseInt(e.target.value))}
                    style={{
                        width: '120px',
                        accentColor: '#0065FF',
                        cursor: 'pointer',
                    }}
                    aria-label="Photo size"
                />
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5">
                    <rect x="3" y="3" width="7" height="7" rx="1" />
                    <rect x="14" y="3" width="7" height="7" rx="1" />
                    <rect x="3" y="14" width="7" height="7" rx="1" />
                    <rect x="14" y="14" width="7" height="7" rx="1" />
                </svg>
            </div>

            {/* Photo modal */}
            {selectedPhoto && (
                <PhotoModal photo={selectedPhoto} onClose={handleCloseModal} />
            )}
        </div>
    );
}
