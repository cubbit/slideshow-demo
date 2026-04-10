import { getAppName, getAppTitle } from '@/lib/appName';
import './globals.css';

export async function generateMetadata() {
    return {
        title: getAppTitle(),
        description: 'Upload and display photos using Cubbit DS3 storage',
    };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700&display=swap"
                    rel="stylesheet"
                />
            </head>
            <body data-app-name={getAppName()}>{children}</body>
        </html>
    );
}
