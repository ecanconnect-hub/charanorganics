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

    const latitude = 17.505722;
    const longitude = 78.498333;
    const locationText = '17°30\'20.6"N 78°29\'54.0"E';
    const mapNavigationUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    const mapPreviewImage = 'https://res.cloudinary.com/dur6fkyoz/image/upload/v1773142658/Screenshot_2026-03-10_170731_eznp7n.png';

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
        },
        {
            name: 'Instagram',
            href: 'https://www.instagram.com/charan_organics_cosmetics/',
            icon: (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5a3.95 3.95 0 0 0 3.95 3.95h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5Zm8.9 1.35a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z" />
                </svg>
            ),
        },
        {
            name: 'YouTube',
            href: 'https://youtube.com/@charanorganicsoapsvlogs?si=B2L-khPUbmEIjsyn',
            icon: (
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M23.5 7.1a3.03 3.03 0 0 0-2.13-2.15C19.49 4.5 12 4.5 12 4.5s-7.49 0-9.37.45A3.03 3.03 0 0 0 .5 7.1 31.3 31.3 0 0 0 0 12a31.3 31.3 0 0 0 .5 4.9 3.03 3.03 0 0 0 2.13 2.15c1.88.45 9.37.45 9.37.45s7.49 0 9.37-.45a3.03 3.03 0 0 0 2.13-2.15A31.3 31.3 0 0 0 24 12a31.3 31.3 0 0 0-.5-4.9ZM9.6 15.4V8.6L15.8 12l-6.2 3.4Z" />
                </svg>
            ),
        },
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
                <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-[minmax(280px,1.15fr)_minmax(140px,0.7fr)_minmax(140px,0.7fr)_minmax(170px,0.8fr)_minmax(260px,1fr)] lg:items-start mb-16">

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

                    {/* Column 5: Location Map */}
                    <div className="lg:pl-2">
                        <h4 className="mb-3 text-xs font-bold uppercase tracking-widest !text-gray-200">Location</h4>
                        <p className="mb-3 text-xs text-gray-300">{locationText}</p>
                        <div className="relative h-44 w-full overflow-hidden rounded-xl border border-white/15 bg-black/20 sm:h-48">
                            <a
                                href={mapNavigationUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                aria-label="Open location in Google Maps"
                                className="group block h-full w-full"
                            >
                                <img
                                    src={mapPreviewImage}
                                    alt="Charan Organics location map preview"
                                    loading="lazy"
                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
                                />
                            </a>
                            <span className="pointer-events-none absolute bottom-2 right-2 rounded-full border border-white/20 bg-black/70 px-2.5 py-1 text-[10px] font-semibold text-white">
                                Open in Maps
                            </span>
                        </div>
                    </div>
                </div>

                {/* Bottom Bar - Professional Credit */}
                <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 text-xs text-gray-400 md:flex-row">
                    <div>
                        &copy; {currentYear} Charan Organics. All rights reserved.
                    </div>

                    <div className="flex items-center gap-2">
                        Developed by
                        <a
                            href="https://www.linkedin.com/company/ecantech-esolutions/posts/?feedView=all"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-[#0A66C2] bg-[#0A66C2] text-white shadow-sm transition-all hover:-translate-y-0.5 hover:brightness-110 !p-0"
                            aria-label="eCantech Solutions LinkedIn"
                            title="LinkedIn"
                        >
                            <svg
                                className="h-4 w-4"
                                viewBox="0 0 16 16"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path
                                    fill="#ffffff"
                                    d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zM4.943 13.5V6.169H2.542V13.5h2.401zM3.743 5.167c.837 0 1.358-.554 1.358-1.248-.015-.709-.521-1.248-1.343-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.017zm5.2 8.333V9.359c0-.222.016-.444.082-.603.18-.444.59-.904 1.278-.904.902 0 1.263.682 1.263 1.682V13.5h2.401V9.257c0-2.273-1.211-3.33-2.826-3.33-1.304 0-1.874.718-2.199 1.223h.03v-.981H6.571c.03.65 0 7.331 0 7.331h2.372z"
                                />
                            </svg>
                        </a>
                        <a
                            href="https://www.instagram.com/ecantech_esolutions/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-pink-600 bg-pink-600 text-white shadow-sm transition-all hover:-translate-y-0.5 hover:brightness-110 !p-0"
                            aria-label="eCantech Solutions Instagram"
                            title="Instagram"
                        >
                            <svg
                                className="h-4 w-4"
                                viewBox="0 0 24 24"
                                fill="none"
                                aria-hidden="true"
                            >
                                <path
                                    fill="#ffffff"
                                    d="M7.75 2h8.5A5.75 5.75 0 0 1 22 7.75v8.5A5.75 5.75 0 0 1 16.25 22h-8.5A5.75 5.75 0 0 1 2 16.25v-8.5A5.75 5.75 0 0 1 7.75 2Zm0 1.8A3.95 3.95 0 0 0 3.8 7.75v8.5a3.95 3.95 0 0 0 3.95 3.95h8.5a3.95 3.95 0 0 0 3.95-3.95v-8.5a3.95 3.95 0 0 0-3.95-3.95h-8.5Zm8.9 1.35a1.15 1.15 0 1 1 0 2.3 1.15 1.15 0 0 1 0-2.3ZM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm0 1.8a3.2 3.2 0 1 0 0 6.4 3.2 3.2 0 0 0 0-6.4Z"
                                />
                            </svg>
                        </a>
                        <a
                            href="https://ecantechesolutions.vercel.app/"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="border-b border-transparent font-medium text-gray-200 transition-colors hover:border-green-500 hover:text-green-400"
                        >
                            eCantech Solutions
                        </a>
                        <span className="text-gray-300">- Yuvakiran Reddy</span>
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

