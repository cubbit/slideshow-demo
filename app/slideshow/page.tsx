'use client';

import styles from './page.module.css';
import { Orbitron } from 'next/font/google';
import InfiniteCarousel from '../components/carousel/InfiniteCarousel';
import Image from 'next/image';
import { usePublicSettings } from '@/app/hooks/usePublicSettings';

const orbitron = Orbitron({
    weight: '500',
    subsets: ['latin'],
    style: 'normal',
});

export default function SlideshowPage() {
    const today = new Date();

    // Use settings hook to get the latest S3 settings
    const { settings } = usePublicSettings();

    const s3Endpoint = settings.S3_ENDPOINT || '';
    const s3Bucket = settings.S3_BUCKET_NAME || '';

    const formattedDate = today.toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
    });

    return (
        <main className={[styles.container, orbitron.className].join(' ')}>
            <header className={styles.header}>
                <Image src="/cubbit.png" alt="Cubbit logo" width={30} height={40} priority />

                <h1>{formattedDate}</h1>
                {s3Endpoint !== '' && s3Bucket !== '' && (
                    <span>{`URL: ${s3Endpoint}/${s3Bucket}`}</span>
                )}
            </header>

            <div className={styles['carousel-container']}>
                <InfiniteCarousel />
            </div>
        </main>
    );
}
