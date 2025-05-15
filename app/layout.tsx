import './globals.css';

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
