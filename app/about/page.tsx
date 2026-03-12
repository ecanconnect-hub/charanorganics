/**
 * About Page
 * 
 * Company information and story
 */
import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'About Us',
    description: 'Learn about Charan Organics, our natural wellness philosophy, and how we craft organic and ayurvedic products.',
    alternates: {
        canonical: '/about',
    },
    openGraph: {
        title: 'About Charan Organics',
        description: 'Our story, values, and approach to handcrafted organic and ayurvedic products.',
        url: '/about',
        type: 'website',
    },
};

export default function AboutPage() {
    return (
        <main>
            {/* Safe top spacing to avoid header overlap */}
            <div className="h-24 md:h-28"></div>
            <div className="section-padding">
                <div className="container mx-auto px-4 max-w-4xl">
                    <h1 className="text-5xl font-bold text-center mb-8">About Charan Organics</h1>

                    <div className="prose prose-lg max-w-none">
                        <p className="text-xl text-gray-700 mb-8">
                            Welcome to Charan Organics, your trusted source for pure, handcrafted organic and ayurvedic products.
                        </p>
                        <p className="text-gray-700 leading-relaxed mb-6">
                            Our brand operates with proper legal authorization and trademark application under The Trademarks Act, 1999.
                            The trademark process is officially handled through authorized legal representatives to ensure full compliance
                            with Indian intellectual property laws. This step reflects our commitment to authenticity, brand protection,
                            and building customer trust while delivering high-quality organic and personal care products.
                        </p>
                        <p className="text-gray-700 leading-relaxed mb-10">
                            We also provide training classes on how organic and personal care products are made, and online classes are
                            available to help learners join from anywhere.
                        </p>

                        <h2>Our Story</h2>
                        <p>
                            Founded with a passion for natural wellness, Charan Organics brings you the finest organic and ayurvedic products,
                            handcrafted with love and care. We believe in the power of nature to heal and nourish, and every product we create
                            reflects this philosophy.
                        </p>

                        <h2>Our Values</h2>
                        <ul>
                            <li><strong>Pure & Natural:</strong> We use only pure, natural ingredients with no harmful chemicals</li>
                            <li><strong>Handmade:</strong> Each product is carefully handcrafted in small batches</li>
                            <li><strong>Cruelty-Free:</strong> We never test on animals and use only ethical ingredients</li>
                            <li><strong>Sustainable:</strong> We are committed to eco-friendly practices and packaging</li>
                            <li><strong>Authentic:</strong> Traditional ayurvedic formulations passed down through generations</li>
                        </ul>

                        <h2>Our Promise</h2>
                        <p>
                            When you choose Charan Organics, you are choosing products that are:
                        </p>
                        <ul>
                            <li>Free from harmful chemicals and synthetic additives</li>
                            <li>Made with certified organic ingredients</li>
                            <li>Tested for quality and purity</li>
                            <li>Packaged with care for the environment</li>
                            <li>Delivered with love and attention to detail</li>
                        </ul>

                        <h2>Follow Us for Daily Updates</h2>
                        <p>
                            Stay connected with Charan Organics for daily product updates, behind-the-scenes content,
                            and natural wellness tips.
                        </p>
                        <p>
                            <strong>Instagram:</strong>{' '}
                            <a
                                href="https://www.instagram.com/charan_organics_cosmetics/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                @charan_organics_cosmetics
                            </a>
                            <br />
                            <strong>YouTube:</strong>{' '}
                            <a
                                href="https://youtube.com/@charanorganicsoapsvlogs?si=B2L-khPUbmEIjsyn"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                @charanorganicsoapsvlogs
                            </a>
                        </p>

                        <h2>Contact Us</h2>
                        <p>
                            We would love to hear from you! Whether you have questions about our products or just want to say hello,
                            feel free to reach out.
                        </p>
                        <p>
                            <strong>Email:</strong> chinnammadu46@gmail.com<br />
                            <strong>Phone:</strong> +91 824 783 8125<br />
                            <strong>Address:</strong> Hyderabad, Telangana, India
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}

