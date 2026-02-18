import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Shipping Policy',
    description: 'Shipping policy details for Charan Organics orders.',
    alternates: {
        canonical: '/shipping',
    },
};

export default function ShippingPolicyPage() {
    return (
        <main className="min-h-screen bg-white">
            <div className="h-24 md:h-28"></div>
            <section className="max-w-4xl mx-auto px-4 md:px-6 pb-16">
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Shipping Policy</h1>
                <p className="text-gray-700 leading-relaxed">
                    This page is a placeholder. Final Shipping Policy content will be added after client confirmation.
                </p>
            </section>
        </main>
    );
}
