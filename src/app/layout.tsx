import { Source_Sans_3 } from 'next/font/google';
import { getAppName, getAppTitle } from '@/lib/appName';
import './globals.css';

const sourceSans = Source_Sans_3({
    subsets: ['latin'],
    weight: ['300', '400', '500', '600', '700'],
    display: 'swap',
});

export async function generateMetadata() {
    return {
        title: getAppTitle(),
        description: 'Upload and display photos using Cubbit DS3 storage',
    };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={sourceSans.className}>
            <head>
                <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
            </head>
            <body data-app-name={getAppName()}>{children}</body>
        </html>
    );
}
