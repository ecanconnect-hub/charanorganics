/**
 * About Page
 * 
 * Company information and story
 */

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
                            <li><strong>Sustainable:</strong> We're committed to eco-friendly practices and packaging</li>
                            <li><strong>Authentic:</strong> Traditional ayurvedic formulations passed down through generations</li>
                        </ul>

                        <h2>Our Promise</h2>
                        <p>
                            When you choose Charan Organics, you're choosing products that are:
                        </p>
                        <ul>
                            <li>Free from harmful chemicals and synthetic additives</li>
                            <li>Made with certified organic ingredients</li>
                            <li>Tested for quality and purity</li>
                            <li>Packaged with care for the environment</li>
                            <li>Delivered with love and attention to detail</li>
                        </ul>

                        <h2>Contact Us</h2>
                        <p>
                            We'd love to hear from you! Whether you have questions about our products or just want to say hello,
                            feel free to reach out.
                        </p>
                        <p>
                            <strong>Email:</strong> info@charanorganics.com<br />
                            <strong>Phone:</strong> +91 824 783 8125<br />
                            <strong>Address:</strong> Hyderabad, Telangana, India
                        </p>
                    </div>
                </div>
            </div>
        </main>
    );
}
