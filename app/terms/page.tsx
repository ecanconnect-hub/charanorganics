import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms & Conditions',
    description: 'Terms and conditions for using Charan Organics website and services.',
    alternates: {
        canonical: '/terms',
    },
};

export default function TermsPage() {
    return (
        <main className="min-h-screen bg-white">
            <div className="h-24 md:h-28"></div>
            <section className="max-w-4xl mx-auto px-4 md:px-6 pb-16">
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Terms & Conditions</h1>
                <p className="text-sm text-gray-500 mb-8">Last updated: February 2026</p>

                <div className="space-y-8 text-gray-700 leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">1. Payment Terms</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>We currently accept online payments only.</li>
                            <li>Cash on Delivery (COD) is not available.</li>
                            <li>Orders are processed only after successful payment confirmation.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">2. Order Acceptance</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Your order is confirmed only after payment verification and confirmation from our side.</li>
                            <li>We may contact you for order verification or clarification if needed.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">3. Product Issues & Support</h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>If you face any issue with a product, contact us directly through our support channels.</li>
                            <li>Our team will review the issue and guide you on the next steps.</li>
                            <li>Damage-related claims are handled as per our Returns & Refund Policy.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-gray-900 mb-3">4. Policy References</h2>
                        <p>
                            Shipping timelines are covered under our Shipping Policy. Returns, refunds, and replacements are covered under our
                            Returns & Refund Policy.
                        </p>
                    </section>
                </div>
            </section>
        </main>
    );
}
