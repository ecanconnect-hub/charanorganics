import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Contact Us',
    description: 'Contact Charan Organics for product questions, support, collaborations, and order assistance.',
    alternates: {
        canonical: '/contact',
    },
    openGraph: {
        title: 'Contact Charan Organics',
        description: 'Reach out for support and product inquiries.',
        url: '/contact',
        type: 'website',
    },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
    return children;
}
