import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy',
    description: 'Privacy policy for Charan Organics website and customer data handling.',
    alternates: {
        canonical: '/privacy',
    },
};

export default function PrivacyPolicyPage() {
    return (
        <main className="min-h-screen bg-white">
            <div className="h-24 md:h-28"></div>
            <section className="max-w-4xl mx-auto px-4 md:px-6 pb-16">
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 mb-4">Privacy Policy</h1>
                <p className="text-sm text-gray-500 mb-8">Effective date: February 18, 2026</p>

                <div className="space-y-8 text-gray-700 leading-relaxed">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">1. Who We Are</h2>
                        <p>
                            Charan Organics operates this website and related services for browsing products, placing orders,
                            and customer support. If you have any privacy questions, contact us at
                            {' '}<a href="mailto:info@charanorganics.com" className="text-green-700 underline">info@charanorganics.com</a>{' '}
                            or +91 8247838125.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">2. Information We Collect</h2>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>Account information: name, email, phone number.</li>
                            <li>Order and shipping information: address, pincode, city/state, purchased items.</li>
                            <li>Payment verification information: UTR/transaction reference and payment screenshot (for UPI orders).</li>
                            <li>Support communication details you share with us.</li>
                            <li>Basic technical data such as device/browser logs for security and troubleshooting.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">3. Why We Use Your Information</h2>
                        <ul className="list-disc pl-6 space-y-1">
                            <li>To process orders, confirm payments, and deliver products.</li>
                            <li>To provide customer support and order updates.</li>
                            <li>To improve website performance, search relevance, and user experience.</li>
                            <li>To prevent fraud, abuse, and unauthorized activity.</li>
                            <li>To meet legal, tax, and compliance requirements.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">4. Payments</h2>
                        <p>
                            We currently support UPI-style payment flow and payment verification. We do not intentionally store full
                            card data on this website.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">5. Sharing of Information</h2>
                        <p>We may share limited data only when needed with:</p>
                        <ul className="list-disc pl-6 space-y-1 mt-2">
                            <li>Delivery/logistics providers for order fulfillment.</li>
                            <li>Technology providers used for hosting, storage, and communication.</li>
                            <li>Authorities or legal bodies when required by law.</li>
                        </ul>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">6. Data Retention</h2>
                        <p>
                            We retain information only for as long as needed for order processing, support, accounting, legal compliance,
                            and security needs.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">7. Security</h2>
                        <p>
                            We apply reasonable technical and organizational measures to protect your information. No online system can be
                            guaranteed 100% secure.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">8. Your Choices</h2>
                        <p>
                            You may request access, correction, or deletion of your personal data by contacting us at
                            {' '}<a href="mailto:info@charanorganics.com" className="text-green-700 underline">info@charanorganics.com</a>.
                            We will review and respond as per applicable law and operational requirements.
                        </p>
                    </div>

                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">9. Policy Updates</h2>
                        <p>
                            We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated
                            effective date.
                        </p>
                    </div>
                </div>
            </section>
        </main>
    );
}
