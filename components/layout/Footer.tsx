/**
 * Footer Component - PREMIUM REDESIGN
 *
 * Clean, industry-standard footer layout with clear hierarchy,
 * professional typography, and attribution.
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from '@/lib/i18n/context';

export function Footer() {
    const t = useTranslations();
    const locale = useLocale();
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
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.397-4.394 9.788-9.791 9.788Z" />
                </svg>
            ),
        }
    ];

    const categoryLinks = [
        {
            href: '/shop',
            label: locale === 'te' ? 'à°…à°¨à±à°¨à°¿ à°‰à°¤à±à°ªà°¤à±à°¤à±à°²à±' : 'All Products'
        },
        {
            href: '/shop?section=herbal-powders-skin-soap',
            label: locale === 'te' ? 'à°šà°°à±à°® à°¸à°‚à°°à°•à±à°·à°£' : 'Skin Care'
        },
        {
            href: '/shop?section=herbal-powders-hair-shampoo',
            label: locale === 'te' ? 'à°œà±à°Ÿà±à°Ÿà± à°¸à°‚à°°à°•à±à°·à°£' : 'Hair Care'
        },
        {
            href: '/shop?section=essential-oils',
            label: locale === 'te' ? 'à°Žà°¸à±†à°¨à±à°·à°¿à°¯à°²à± à°†à°¯à°¿à°²à±à°¸à±' : 'Essential Oils'
        },
    ];

    return (
        <footer className="relative border-t border-white/10 bg-[#0B1110] pt-20 pb-8 text-white">
            <div className="container mx-auto px-6 md:px-12">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 lg:gap-16 mb-20">

                    {/* Column 1: Brand & Newsletter */}
                    <div className="lg:col-span-1 space-y-8">
                        <Link href="/" className="inline-block group">
                            <div className="flex items-center gap-3">
                                <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-gray-800 bg-white shadow-sm transition-transform group-hover:rotate-6 !p-0">
                                    <Image
                                        src="/charan-emblem-tight.png"
                                        alt="Charan Organics"
                                        fill
                                        sizes="40px"
                                        className="scale-[0.95] object-cover object-center"
                                    />
                                </div>
                                <div>
                                    <span className="block text-lg font-bold tracking-tight text-white leading-none">
                                        CHARAN<span className="text-green-500">ORGANICS</span>
                                    </span>
                                    <span className="mt-1 block text-[10px] uppercase tracking-[0.2em] text-gray-400">
                                        Pure Ayurvedic Soul
                                    </span>
                                </div>
                            </div>
                        </Link>

                        <p className="text-sm font-medium leading-relaxed text-gray-300">
                            Crafting organic, small-batch Ayurvedic formulas for the modern soul. Purely natural, scientifically inspired.
                        </p>

                        <div className="pt-2">
                            <h5 className="mb-4 text-xs font-bold uppercase tracking-widest !text-gray-200">Join our community</h5>
                            <form className="flex gap-2">
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    className="w-full rounded-lg border border-white/20 bg-white/[0.06] px-4 py-2.5 text-sm text-gray-100 transition-all placeholder:text-gray-400 focus:border-green-500 focus:bg-white/[0.1] focus:outline-none"
                                />
                                <button className="px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white rounded-lg text-xs font-bold uppercase tracking-wider transition-colors">
                                    Join
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Column 2: Shop */}
                    <div>
                        <h4 className="mb-6 text-xs font-bold uppercase tracking-widest !text-gray-200">{locale === 'te' ? 'à°·à°¾à°ªà±' : 'Shop'}</h4>
                        <ul className="space-y-3">
                            {categoryLinks.map((item) => (
                                <li key={item.href}>
                                    <Link href={item.href} className="inline-block text-sm text-gray-200/90 transition-all hover:translate-x-1 hover:text-white">
                                        {item.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Column 3: Company */}
                    <div>
                        <h4 className="mb-6 text-xs font-bold uppercase tracking-widest !text-gray-200">Company</h4>
                        <ul className="space-y-3">
                            <li><Link href="/about" className="inline-block text-sm text-gray-200/90 transition-all hover:translate-x-1 hover:text-white">Our Story</Link></li>
                            <li><Link href="/contact" className="inline-block text-sm text-gray-200/90 transition-all hover:translate-x-1 hover:text-white">Contact Us</Link></li>
                            <li><Link href="/track-order" className="inline-block text-sm text-gray-200/90 transition-all hover:translate-x-1 hover:text-white">Track Order</Link></li>
                        </ul>
                    </div>

                    {/* Column 4: Support & Contact */}
                    <div>
                        <h4 className="mb-6 text-xs font-bold uppercase tracking-widest !text-gray-200">Support</h4>
                        <ul className="space-y-3 mb-8">
                            {footerLinks.map((link) => (
                                <li key={link.href}>
                                    <Link href={link.href} className="inline-block text-sm text-gray-200/90 transition-all hover:translate-x-1 hover:text-white">
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
                                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-gray-200 transition-all transform hover:scale-105 hover:bg-green-600 hover:text-white !p-0"
                                    title={social.name}
                                >
                                    {social.icon}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom Bar - Professional Credit */}
                <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-gray-400 md:flex-row">
                    <div>
                        &copy; {currentYear} Charan Organics. All rights reserved.
                    </div>

                    <div className="flex items-center gap-1">
                        Developed by
                        <a
                            href="https://ecantechesolutions.vercel.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border-b border-transparent font-medium text-gray-200 transition-colors hover:border-green-500 hover:text-green-400"
                        >
                            eCantech Solutions (Yuva Kiran)
                        </a>
                    </div>
                </div>
            </div>

            {/* Minimal Decorative Element */}
            <div className="absolute bottom-0 right-0 opacity-[0.03] pointer-events-none select-none overflow-hidden">
                <span className="text-[150px] leading-none text-white">ðŸŒ¿</span>
            </div>
        </footer>
    );
}

