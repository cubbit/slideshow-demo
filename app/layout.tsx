import './globals.css';
import { Metadata } from 'next';

export const metadata: Metadata = {
    title: {
        template: 'Cubbit DS3 Slideshow Demo - %s',
        default: 'Cubbit DS3 Slideshow',
    },
    description: 'Upload and view photos in a beautiful slideshow using Cubbit DS3 storage',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" type="image/png" sizes="16x16" href="/favicon.png" />
            </head>
            <body suppressHydrationWarning={true}>{children}</body>
        </html>
    );
}
