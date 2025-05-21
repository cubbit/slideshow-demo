'use client';

import styles from './page.module.css';
import { Orbitron } from 'next/font/google';
import InfiniteCarousel from '../components/carousel/InfiniteCarousel';
import Image from 'next/image';

const orbitron = Orbitron({
    weight: '500',
    subsets: ['latin'],
    style: 'normal',
});

const h1 = `This is your geo-distributed data`;

export default function SlideshowPage() {
    const today = new Date();

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

                <h1>{h1}</h1>
                <span>{formattedDate}</span>
            </header>

            <div className={styles['carousel-container']}>
                <InfiniteCarousel />
            </div>
        </main>
    );
}
