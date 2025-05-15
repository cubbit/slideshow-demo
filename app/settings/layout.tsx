import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Settings',
    description: 'Configure Cubbit DS3 Slideshow settings',
};

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    return children;
}
