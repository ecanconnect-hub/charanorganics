/**
 * Footer Component - PREMIUM REDESIGN
 *
 * Clean, industry-standard footer layout with clear hierarchy,
 * professional typography, and attribution.
 */

'use client';

import Link from 'next/link';
import { useTranslations } from '@/lib/i18n/context';

export function Footer() {
    const t = useTranslations();
    const currentYear = new Date().getFullYear();

    const footerLinks = [
        { href: '/terms', label: t('footer.termsConditions') },
        { href: '/shipping', label: t('footer.shippingPolicy') },
        { href: '/returns', label: t('footer.returnsRefunds') },
        { href: '/privacy', label: t('footer.privacyPolicy') },
    ];

    const socialLinks = [
        {
            name: 'WhatsApp',
            href: 'https://wa.me/918247838125',
            icon: (
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.397-4.394 9.788-9.791 9.788Z" />
                </svg>
            ),
        }
    ];

    return (
        <footer className="bg-[#050505] text-white relative pt-20 pb-8 border-t border-gray-900">
            <div className="container mx-auto px-6 md:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-16 mb-20">

                    {/* Column 1: Brand & Newsletter */}
                    <div className="lg:col-span-1 space-y-8">
                        <Link href="/" className="inline-block group">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center p-1 border border-gray-800 shadow-sm transition-transform group-hover:rotate-6">
                                    <img src="/favicon.ico" alt="Charan Organics" className="w-full h-full object-contain" />
                                </div>
                                <div>
                                    <span className="block text-lg font-bold tracking-tight text-white leading-none">
                                        CHARAN<span className="text-green-500">ORGANICS</span>
                                    </span>
                                    <span className="block text-[10px] uppercase tracking-[0.2em] text-gray-500 mt-1">
                                        Pure Ayurvedic Soul
                                    </span>
                                </div>
                            </div>
                        </Link>

                        <p className="text-sm text-gray-400 leading-relaxed font-medium">
                            Crafting organic, small-batch Ayurvedic formulas for the modern soul. Purely natural, scientifically inspired.
                        </p>

                        <div className="pt-2">
                            <h5 className="text-xs font-bold uppercase tracking-widest text-white mb-4">Join our community</h5>
                            <form className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-green-600 focus:bg-white/10 transition-all placeholder:text-gray-600"
                                />
                                <button className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">
                                    Join
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Column 2: Shop */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-6">Shop</h4>
                        <ul className="space-y-3">
                            <li><Link href="/shop" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 transition-all inline-block">All Products</Link></li>
                            <li><Link href="/shop?section=skincare" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 transition-all inline-block">Skincare</Link></li>
                            <li><Link href="/shop?section=haircare" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 transition-all inline-block">Haircare</Link></li>
                            <li><Link href="/shop?section=homecare" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 transition-all inline-block">Homecare</Link></li>
                        </ul>
                    </div>

                    {/* Column 3: Company */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-6">Company</h4>
                        <ul className="space-y-3">
                            <li><Link href="/about" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 transition-all inline-block">Our Story</Link></li>
                            <li><Link href="/contact" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 transition-all inline-block">Contact Us</Link></li>
                            <li><Link href="/track-order" className="text-sm text-gray-300 hover:text-white hover:translate-x-1 transition-all inline-block">Track Order</Link></li>
                        </ul>
                    </div>

                    {/* Column 4: Support & Contact */}
                    <div>
                        <h4 className="text-xs font-bold uppercase tracking-widest text-white mb-6">Support</h4>
                        <ul className="space-y-3 mb-8">
                            {footerLinks.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="text-sm text-gray-300 hover:text-white hover:translate-x-1 transition-all inline-block">
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>

                        <div className="flex gap-4">
                            {socialLinks.map((social) => (
                                <a
                                    key={social.name}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-gray-400 hover:bg-green-600 hover:text-white transition-all transform hover:scale-105"
                                    title={social.name}
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Bar - Professional Credit */}
                <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500">
                    <div>
                        &copy; {currentYear} Charan Organics. All rights reserved.
                    </div>

                    <div className="flex items-center gap-1">
                        Developed by
                        <a
                            href="https://ecantechesolutions.vercel.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-300 hover:text-green-500 font-medium transition-colors border-b border-transparent hover:border-green-500"
                        >
                            eCantech Solutions
                        </a>
                    </div>
                </div>
            </div>

            {/* Minimal Decorative Element */}
            <div className="absolute bottom-0 right-0 opacity-[0.03] pointer-events-none select-none overflow-hidden">
                <span className="text-[150px] leading-none text-white">🌿</span>
            </div>
        </footer>
    );
}
