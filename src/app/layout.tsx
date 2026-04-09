import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Cubbit Slideshow',
    description: 'Upload and display photos using Cubbit DS3 storage',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link
                    href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body>{children}</body>
        </html>
    );
}
