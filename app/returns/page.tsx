import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Returns & Refund Policy',
    description: 'Returns and refund policy for Charan Organics purchases.',
    alternates: {
        canonical: '/returns',
    },
};

export default function ReturnsPolicyPage() {
    return (
        <main className="min-h-screen bg-white">
            <div className="h-24 md:h-28"></div>
            <section className="max-w-4xl mx-auto px-4 md:px-6 pb-16">
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Returns & Refund Policy</h1>
                <p className="text-sm text-gray-500 mb-8">Last updated: February 2026</p>

                <div className="space-y-8 text-gray-700 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">1. No Return Policy</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>We do not accept product returns once an order is delivered.</li>
                            <li>Please review product details carefully before placing your order.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">2. Damaged Product Replacement</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>If a product is received in damaged condition, we can send a replacement product.</li>
                            <li>Replacement is provided only for genuine damage cases after verification by our team.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">3. How to Report an Issue</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Contact us immediately if there is any issue with your product.</li>
                            <li>Share your order ID, issue details, and supporting photos/videos for faster resolution.</li>
                            <li>Our team will discuss with you directly and provide the final resolution.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">4. Refunds</h2>
                        <p>
                            Refunds are generally not provided under the no-return policy. Valid damage cases are addressed through replacement.
                        </p>
                    </section>
                </div>
            </section>
        </main>
    );
}
