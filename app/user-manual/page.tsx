'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Metadata } from 'next';

// FAQ data
const faqs = [
    {
        q: 'Do I need an account to buy?',
        a: 'No! You can checkout as a guest. Simply add items to cart and proceed to checkout. Provide your email to receive order updates and a tracking link.',
    },
    {
        q: 'How do I track my order?',
        a: 'Visit the "Track Order" page from the footer or your account menu. Enter your Order ID (ORD-XXXXXXXX-XXX) along with your registered phone number and pincode, or use the tracking link sent to your email.',
    },
    {
        q: 'What payment methods are accepted?',
        a: 'Charan Organics currently accepts UPI payments (GPay, PhonePe, Paytm, etc.). After placing the order, you will see a QR code and UPI ID to complete the payment. Upload a screenshot or enter the UTR reference number to confirm.',
    },
    {
        q: 'How long does delivery take?',
        a: 'Standard delivery takes 5–7 business days after payment confirmation. You will receive status updates as your order moves through processing, shipping, and delivery stages.',
    },
    {
        q: 'Can I cancel or modify my order?',
        a: 'Contact us via WhatsApp immediately after placing the order. Once "Confirmed" by the admin, modifications may not be possible. Check our Returns & Refunds policy for details.',
    },
    {
        q: 'Is free shipping available?',
        a: 'Yes! Orders above ₹2000 qualify for free shipping. The free shipping badge will automatically appear at checkout when your cart total reaches ₹2000.',
    },
    {
        q: 'How do I switch the website language to Telugu?',
        a: 'Click the language toggle in the top header (EN / తె). The site supports English and Telugu. Your language preference is remembered during your session.',
    },
    {
        q: 'My payment failed but money was deducted. What should I do?',
        a: 'This can happen with UPI transfers. Please wait 10 minutes; UPI sometimes auto-reverses failed transactions. If the issue persists, contact us via WhatsApp with your UTR/transaction ID.',
    },
    {
        q: 'Can I save multiple delivery addresses?',
        a: 'Yes, registered users can save multiple addresses under Account → Addresses. You can set a default address that auto-fills at checkout.',
    },
    {
        q: 'Are products cruelty-free and natural?',
        a: 'Yes. All Charan Organics products are handcrafted using natural Ayurvedic ingredients. We are committed to cruelty-free, chemical-free formulations.',
    },
];

// Flow steps for the order process
const orderFlowSteps = [
    {
        step: 1,
        icon: '🏠',
        title: 'Browse Products',
        desc: 'Visit the Shop page. Filter by category — Skin Care, Hair Care, Essential Oils, or more.',
        color: 'from-emerald-500 to-green-600',
        pathLabel: 'Select Product',
    },
    {
        step: 2,
        icon: '🛒',
        title: 'Add to Cart',
        desc: 'Click "Add to Cart" on any product. Choose a size/variant if available. No account needed.',
        color: 'from-teal-500 to-emerald-600',
        pathLabel: 'Proceed to Checkout',
    },
    {
        step: 3,
        icon: '📦',
        title: 'Enter Address',
        desc: 'Fill in your full delivery address. Enter pincode to auto-fill city and state. Optionally save for faster checkout.',
        color: 'from-cyan-500 to-teal-600',
        pathLabel: 'Place Order',
    },
    {
        step: 4,
        icon: '💳',
        title: 'Make UPI Payment',
        desc: 'Scan the QR code or send to the UPI ID. Upload your payment screenshot or enter the UTR number.',
        color: 'from-blue-500 to-cyan-600',
        pathLabel: 'Submit Payment',
    },
    {
        step: 5,
        icon: '✅',
        title: 'Order Confirmed',
        desc: 'Admin verifies payment and confirms your order. You receive email & can track on the Track Order page.',
        color: 'from-purple-500 to-blue-600',
        pathLabel: 'Track Order',
    },
    {
        step: 6,
        icon: '🚚',
        title: 'Delivery',
        desc: 'Your order ships and arrives in 5–7 business days. Status updates all along the way.',
        color: 'from-orange-500 to-purple-600',
        pathLabel: 'Delivered ✓',
    },
];

// Pre-defined random-looking styles for background bubbles to prevent hydration mismatches
const bubbleStyles = [
    { size: 280, top: 15, left: 20 },
    { size: 150, top: 40, left: 80 },
    { size: 320, top: 75, left: 10 },
    { size: 210, top: 60, left: 60 },
    { size: 260, top: 25, left: 90 },
    { size: 180, top: 85, left: 45 },
    { size: 220, top: 10, left: 65 },
    { size: 190, top: 50, left: 30 },
];

export default function UserManualPage() {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    return (
        <div className="min-h-screen bg-[#f8faf7]">
            {/* Hero Section */}
            <div className="relative overflow-hidden bg-[#0B1110] text-white pt-36 pb-20">
                <div className="absolute inset-0 opacity-5">
                    {bubbleStyles.map((style, i) => (
                        <div
                            key={i}
                            className="absolute rounded-full bg-green-400"
                            style={{
                                width: style.size + 'px',
                                height: style.size + 'px',
                                top: style.top + '%',
                                left: style.left + '%',
                                transform: 'translate(-50%, -50%)',
                            }}
                        />
                    ))}
                </div>
                <div className="container mx-auto px-6 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 bg-green-500/20 border border-green-500/30 rounded-full px-4 py-1.5 text-green-400 text-sm font-semibold mb-6">
                        <span>📖</span> User Manual & Help Center
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-4">
                        How to Use<br />
                        <span className="text-green-500">Charan Organics</span>
                    </h1>
                    <p 
                        className="text-gray-300 text-lg max-w-2xl mx-auto pb-4" 
                        style={{ textAlign: 'center' }}
                    >
                        Everything you need to know — from creating an account and placing an order to tracking delivery and managing your profile.
                    </p>
                    <div className="mt-8 flex flex-wrap justify-center gap-4">
                        <a href="#flow-diagram" className="bg-green-600 hover:bg-green-500 px-6 py-2.5 rounded-full text-sm font-bold transition-colors">
                            Order Flow Diagram ↓
                        </a>
                        <a href="#guides" className="bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-full text-sm font-bold transition-colors">
                            Step-by-Step Guides ↓
                        </a>
                        <a href="#faq" className="bg-white/10 hover:bg-white/20 px-6 py-2.5 rounded-full text-sm font-bold transition-colors">
                            FAQ ↓
                        </a>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-6 md:px-12 pt-16 pb-32 space-y-24">

                {/* ── SECTION 1: Order Flow Diagram ── */}
                <section id="flow-diagram">
                    <div className="text-center mb-12">
                        <span className="text-xs font-black uppercase tracking-widest text-green-600 bg-green-100 px-3 py-1 rounded-full">Step-by-Step Flow</span>
                        <h2 className="mt-4 text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Order Flow Diagram</h2>
                        <p className="mt-2 text-gray-500 max-w-xl mx-auto">The complete journey from browsing to delivery — visualised for you.</p>
                    </div>

                    {/* Flow Steps Grid */}
                    <div className="relative">
                        {/* Connecting line (desktop) */}
                        <div className="hidden lg:block absolute top-[52px] left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-emerald-200 via-blue-200 to-orange-200 z-0" />

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-6 relative z-10">
                            {orderFlowSteps.map((step, idx) => (
                                <div key={step.step} className="flex flex-col items-center text-center group">
                                    {/* Circle icon */}
                                    <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${step.color} flex flex-col items-center justify-center text-white shadow-lg mb-4 transition-transform group-hover:scale-110 duration-300`}>
                                        <span className="text-3xl">{step.icon}</span>
                                        <span className="text-[10px] font-black uppercase tracking-widest mt-0.5 opacity-80">Step {step.step}</span>
                                    </div>
                                    <h3 className="font-black text-gray-900 text-sm mb-1">{step.title}</h3>
                                    <p className="text-xs text-gray-500 leading-relaxed">{step.desc}</p>
                                    {idx < orderFlowSteps.length - 1 && (
                                        <div className="mt-3 lg:hidden flex items-center gap-1 text-gray-400 text-xs font-semibold">
                                            <span>{step.pathLabel}</span>
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7" /></svg>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </section>
                <section id="guides">
                    <div className="text-center mb-12">
                        <span className="text-xs font-black uppercase tracking-widest text-purple-600 bg-purple-100 px-3 py-1 rounded-full">How-to Guides</span>
                        <h2 className="mt-4 text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Step-by-Step Instructions</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Guide: Create Account */}
                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                            <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-2xl mb-5">👤</div>
                            <h3 className="text-xl font-black text-gray-900 mb-4">Create an Account</h3>
                            <ol className="space-y-3">
                                {[
                                    'Click "Sign Up" or visit /signup',
                                    'Enter your full name',
                                    'Enter your email address and confirm it',
                                    'Create a password (minimum 6 characters)',
                                    'Accept the Terms & Conditions',
                                    'Click "Create Account" — a verification email is sent',
                                    'Click the link in your email to verify',
                                    'Return to /login and sign in',
                                ].map((step, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-gray-700">
                                        <span className="w-6 h-6 rounded-full bg-green-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
                                        {step}
                                    </li>
                                ))}
                            </ol>
                            <div className="mt-4">
                                <Link href="/signup" className="inline-block text-xs font-bold text-green-600 hover:text-green-700 border border-green-200 rounded-full px-4 py-1.5 transition-colors hover:bg-green-50">
                                    Create Account →
                                </Link>
                            </div>
                        </div>

                        {/* Guide: Login */}
                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                            <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-2xl mb-5">🔑</div>
                            <h3 className="text-xl font-black text-gray-900 mb-4">Login to Your Account</h3>
                            <ol className="space-y-3">
                                {[
                                    'Go to /login or click "Login" in the header',
                                    'Option A — Email: Enter your email and password, click Login',
                                    'Option B — Google: Click "Continue with Google" to login instantly',
                                    'If you forgot your password, click "Forgot Password?"',
                                    'Enter your email on the forgot-password page',
                                    'Check your email for a reset link',
                                    'Click the link and set a new password on /reset-password',
                                ].map((step, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-gray-700">
                                        <span className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
                                        {step}
                                    </li>
                                ))}
                            </ol>
                            <div className="mt-4">
                                <Link href="/login" className="inline-block text-xs font-bold text-blue-600 hover:text-blue-700 border border-blue-200 rounded-full px-4 py-1.5 transition-colors hover:bg-blue-50">
                                    Login Now →
                                </Link>
                            </div>
                        </div>

                        {/* Guide: Place Order */}
                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                            <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center text-2xl mb-5">🛍️</div>
                            <h3 className="text-xl font-black text-gray-900 mb-4">Place an Order</h3>
                            <ol className="space-y-3">
                                {[
                                    'Browse products at /shop or homepage sections',
                                    'Click a product to view details and select variant/size',
                                    'Click "Add to Cart" — you don\'t need to be logged in',
                                    'Click the cart icon at top-right to review items',
                                    'Click "Proceed to Checkout"',
                                    'Fill in your Full Name, Phone, and Delivery Address',
                                    'Enter your 6-digit Pincode — city/state auto-fill!',
                                    'Review the order total and shipping charges',
                                    'Click "Place Order" to proceed to payment',
                                ].map((step, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-gray-700">
                                        <span className="w-6 h-6 rounded-full bg-orange-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
                                        {step}
                                    </li>
                                ))}
                            </ol>
                            <div className="mt-4">
                                <Link href="/shop" className="inline-block text-xs font-bold text-orange-600 hover:text-orange-700 border border-orange-200 rounded-full px-4 py-1.5 transition-colors hover:bg-orange-50">
                                    Start Shopping →
                                </Link>
                            </div>
                        </div>

                        {/* Guide: Payment */}
                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                            <div className="w-12 h-12 bg-purple-100 rounded-2xl flex items-center justify-center text-2xl mb-5">💳</div>
                            <h3 className="text-xl font-black text-gray-900 mb-4">Complete UPI Payment</h3>
                            <ol className="space-y-3">
                                {[
                                    'After placing the order, you land on the Payment page',
                                    'Note your Order ID (e.g., ORD-20260316-001)',
                                    'Open your UPI app (GPay, PhonePe, Paytm, etc.)',
                                    'Scan the QR code OR manually enter the UPI ID shown',
                                    'Enter the EXACT amount shown — don\'t round up/down',
                                    'Complete payment in your UPI app',
                                    'Take a screenshot of the SUCCESS screen',
                                    'On the Charan Organics page: upload screenshot OR enter UTR',
                                    'Click "Submit Payment" — your order status updates!',
                                ].map((step, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-gray-700">
                                        <span className="w-6 h-6 rounded-full bg-purple-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
                                        {step}
                                    </li>
                                ))}
                            </ol>
                        </div>

                        {/* Guide: Add Address */}
                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                            <div className="w-12 h-12 bg-teal-100 rounded-2xl flex items-center justify-center text-2xl mb-5">📍</div>
                            <h3 className="text-xl font-black text-gray-900 mb-4">Manage Delivery Addresses</h3>
                            <ol className="space-y-3">
                                {[
                                    'Login to your account first',
                                    'Click your avatar/name → Account → Addresses',
                                    'Click "Add New Address"',
                                    'Enter full name, phone, address line 1 & 2, city, state, pincode',
                                    'Optionally check "Set as Default"',
                                    'Save the address',
                                    'At checkout, saved addresses appear at the top — click "Use This" to auto-fill',
                                    'Click "Manage Addresses" inside checkout to edit or delete saved addresses',
                                ].map((step, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-gray-700">
                                        <span className="w-6 h-6 rounded-full bg-teal-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
                                        {step}
                                    </li>
                                ))}
                            </ol>
                            <div className="mt-4">
                                <Link href="/account/addresses" className="inline-block text-xs font-bold text-teal-600 hover:text-teal-700 border border-teal-200 rounded-full px-4 py-1.5 transition-colors hover:bg-teal-50">
                                    My Addresses →
                                </Link>
                            </div>
                        </div>

                        {/* Guide: Track Order */}
                        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                            <div className="w-12 h-12 bg-yellow-100 rounded-2xl flex items-center justify-center text-2xl mb-5">📦</div>
                            <h3 className="text-xl font-black text-gray-900 mb-4">Track Your Order</h3>
                            <ol className="space-y-3">
                                {[
                                    'Visit /track-order or click "Track Order" in the footer',
                                    'Enter your Order ID (format: ORD-XXXXXXXX-XXX)',
                                    'Also enter your registered Phone Number and Pincode',
                                    'Click "Track Order" to see status',
                                    'For logged-in users: visit Account → Orders for full history',
                                    'Guest tracking tokens (from email link) work for 30 days',
                                    'Order statuses: Pending Payment → Confirmed → Processing → Shipped → Delivered',
                                ].map((step, i) => (
                                    <li key={i} className="flex gap-3 text-sm text-gray-700">
                                        <span className="w-6 h-6 rounded-full bg-yellow-500 text-white text-xs font-black flex items-center justify-center flex-shrink-0">{i + 1}</span>
                                        {step}
                                    </li>
                                ))}
                            </ol>
                            <div className="mt-4">
                                <Link href="/track-order" className="inline-block text-xs font-bold text-yellow-600 hover:text-yellow-700 border border-yellow-200 rounded-full px-4 py-1.5 transition-colors hover:bg-yellow-50">
                                    Track Order →
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── SECTION 4: FAQ ── */}
                <section id="faq">
                    <div className="text-center mb-12">
                        <span className="text-xs font-black uppercase tracking-widest text-orange-600 bg-orange-100 px-3 py-1 rounded-full">Quick Answers</span>
                        <h2 className="mt-4 text-3xl md:text-4xl font-black text-gray-900 tracking-tight">Frequently Asked Questions</h2>
                    </div>
                    <div className="max-w-3xl mx-auto space-y-3">
                        {faqs.map((faq, idx) => (
                            <div key={idx} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <button
                                    className="w-full text-left px-6 py-4 flex items-start justify-between gap-4 hover:bg-gray-50 transition-colors"
                                    onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                                >
                                    <span className="font-bold text-gray-900 text-sm">{faq.q}</span>
                                    <span className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${openFaq === idx ? 'rotate-180' : ''}`}>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>
                                    </span>
                                </button>
                                {openFaq === idx && (
                                    <div className="px-6 pb-4 text-sm text-gray-600 leading-relaxed border-t border-gray-50 pt-4">
                                        {faq.a}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* ── SECTION 5: Contact / Help ── */}
                <section className="bg-[#0B1110] rounded-3xl p-12 text-white text-center mb-12 shadow-md relative z-10">
                    <h2 className="text-3xl font-black mb-3">Still need help?</h2>
                    <p className="text-gray-300 mb-8 max-w-lg mx-auto">Our team is available via WhatsApp or the contact form. We typically respond within a few hours.</p>
                    <div className="flex flex-wrap justify-center gap-4">
                        <a
                            href="https://wa.me/918247838125"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 px-6 py-3 rounded-full font-bold text-sm transition-colors"
                        >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.397-4.394 9.788-9.791 9.788Z" /></svg>
                            Chat on WhatsApp
                        </a>
                        <Link href="/contact" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-full font-bold text-sm transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                            Contact Form
                        </Link>
                        <Link href="/track-order" className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-6 py-3 rounded-full font-bold text-sm transition-colors">
                            📦 Track Order
                        </Link>
                    </div>
                </section>

            </div>
        </div>
    );
}
