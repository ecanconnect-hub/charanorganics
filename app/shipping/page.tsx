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
                <p className="text-sm text-gray-500 mb-8">Last updated: February 2026</p>

                <div className="space-y-8 text-gray-700 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">1. Delivery Timeline</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Estimated delivery time is 7 to 10 business days from order confirmation.</li>
                            <li>Delivery timelines may vary slightly based on location, weather, or courier delays.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">2. Dispatch & Tracking</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Orders are dispatched only after successful payment confirmation.</li>
                            <li>You can track your order status from the Track Order page.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">3. Important Notes</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Please ensure your shipping address and phone number are correct while placing the order.</li>
                            <li>If there is any delay or delivery concern, contact us directly and we will assist you.</li>
                        </ul>
                    </section>
                </div>
            </section>
        </main>
    );
}
