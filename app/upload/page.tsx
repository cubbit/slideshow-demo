import UploadForm from '../components/upload/UploadForm';
import styles from './page.module.css';
import Image from 'next/image';
import { Orbitron } from 'next/font/google';
import { Metadata } from 'next';

const orbitron = Orbitron({
    weight: '400',
    subsets: ['latin'],
    style: 'normal',
});

export const metadata: Metadata = {
    title: 'Upload a photo now',
    description: 'Upload your photos to Cubbit DS3 for the slideshow',
};

const UploadPage = () => {
    return (
        <main className={[styles['upload-page'], orbitron.className].join(' ')}>
            <div className={styles.logo}>
                <Image src="/cubbit.png" alt="Cubbit logo" width={60} height={80} priority />
            </div>
            <UploadForm />
        </main>
    );
};

export default UploadPage;
