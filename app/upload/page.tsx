import UploadForm from '../components/upload/UploadForm';
import styles from './page.module.css';
import Image from 'next/image';
import { Orbitron } from 'next/font/google';

const orbitron = Orbitron({
    weight: '400',
    subsets: ['latin'],
    style: 'normal',
});

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
