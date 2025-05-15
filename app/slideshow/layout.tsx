import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Slideshow',
    description: 'View photos in a beautiful slideshow using Cubbit DS3 storage',
};

export default function SlideshowLayout({ children }: { children: React.ReactNode }) {
    return children;
}
