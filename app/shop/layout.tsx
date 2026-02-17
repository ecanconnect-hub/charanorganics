import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Shop',
    description: 'Browse Charan Organics products by category, price, and latest arrivals.',
    alternates: {
        canonical: '/shop',
    },
    openGraph: {
        title: 'Shop Organic & Ayurvedic Products',
        description: 'Explore the full Charan Organics collection.',
        url: '/shop',
        type: 'website',
    },
};

export default function ShopLayout({ children }: { children: React.ReactNode }) {
    return children;
}
