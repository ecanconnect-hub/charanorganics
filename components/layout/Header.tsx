/**
 * Header Component
 * 
 * Main site header with navigation, search, and language toggle.
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations, useLocale, useSetLocale } from '@/lib/i18n/context';
import { useCart } from '@/lib/cart-context';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/Button';
import logoImage from '@/public/charan-logo.png';

export function Header() {
    const t = useTranslations('nav');
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const locale = useLocale();
    const setLocale = useSetLocale();
    const { items } = useCart();
    const { user } = useAuth();

    const [isScrolled, setIsScrolled] = useState(false);
    const [isVisible, setIsVisible] = useState(true);
    const lastScrollYRef = useRef(0);
    const isScrolledRef = useRef(false);
    const isVisibleRef = useRef(true);
    const scrollRafRef = useRef<number | null>(null);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Search State
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const searchInputRef = useRef<HTMLInputElement>(null);
    const mobileSearchInputRef = useRef<HTMLInputElement>(null);
    const searchContainerRef = useRef<HTMLDivElement>(null);
    const shouldFocusMobileSearchRef = useRef(false);
    const activeShopQuery = searchParams.get('q') || '';
    const languageToggleLabel = locale === 'en' ? 'TE' : 'EN';

    useEffect(() => {
        const handleScroll = () => {
            if (scrollRafRef.current !== null) return;

            scrollRafRef.current = window.requestAnimationFrame(() => {
                scrollRafRef.current = null;
                const currentScrollY = window.scrollY;
                const nextIsScrolled = currentScrollY > 20;
                const nextIsVisible = !(currentScrollY > lastScrollYRef.current && currentScrollY > 100);

                if (isScrolledRef.current !== nextIsScrolled) {
                    isScrolledRef.current = nextIsScrolled;
                    setIsScrolled(nextIsScrolled);
                }

                if (isVisibleRef.current !== nextIsVisible) {
                    isVisibleRef.current = nextIsVisible;
                    setIsVisible(nextIsVisible);
                }

                lastScrollYRef.current = currentScrollY;
            });
        };

        window.addEventListener('scroll', handleScroll, { passive: true });

        // Click outside handler for search
        const handleClickOutside = (event: MouseEvent) => {
            if (searchContainerRef.current && !searchContainerRef.current.contains(event.target as Node)) {
                // If clicking outside search container, close it
                setIsSearchOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsSearchOpen(false);
                setIsMobileMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            if (scrollRafRef.current !== null) {
                window.cancelAnimationFrame(scrollRafRef.current);
            }
            window.removeEventListener('scroll', handleScroll);
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    useEffect(() => {
        if (!isMobileMenuOpen || !shouldFocusMobileSearchRef.current) {
            return;
        }

        const focusTimer = window.setTimeout(() => {
            mobileSearchInputRef.current?.focus();
            shouldFocusMobileSearchRef.current = false;
        }, 120);

        return () => window.clearTimeout(focusTimer);
    }, [isMobileMenuOpen]);

    const openMobileMenu = (focusSearch = false) => {
        const nextIsOpen = !isMobileMenuOpen;

        if (nextIsOpen) {
            setSearchQuery(pathname === '/shop' ? activeShopQuery : '');
            shouldFocusMobileSearchRef.current = focusSearch;
        } else {
            shouldFocusMobileSearchRef.current = false;
        }

        setIsMobileMenuOpen(nextIsOpen);
    };

    const clearSearch = () => {
        setSearchQuery('');

        if (pathname !== '/shop' || !searchParams.get('q')) {
            return;
        }

        const params = new URLSearchParams(searchParams.toString());
        params.delete('q');
        router.push(params.toString() ? `/shop?${params.toString()}` : '/shop', { scroll: false });
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;
        setIsSearchOpen(false);
        setIsMobileMenuOpen(false);
        router.push(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
    };

    const navLinks = [
        { href: '/', label: t('home') },
        { href: '/shop', label: t('shop') },
        { href: '/about', label: t('about') },
        // Track order removed from nav
        { href: '/contact', label: t('contact') },
    ];

    const subtotal = items.reduce((acc, item) => acc + (item.product?.current_price || 0) * item.quantity, 0);

    return (
        <header
            className={`fixed left-0 right-0 z-[70] transition-all duration-500 transform ${isVisible ? 'translate-y-0 opacity-100' : 'md:-translate-y-full md:opacity-0'
                } ${isScrolled
                    ? 'bg-white/95 backdrop-blur-lg shadow-xl border-b border-gray-100 md:top-0'
                    : 'bg-white/50 backdrop-blur-sm md:top-10'
                } top-0 md:top-7 h-16 md:h-20 py-0 flex items-center`}
        >
            <div className="w-full px-0 md:px-6">
                {/* MOBILE HEADER (Single Row) */}
                <div className="flex md:hidden items-center justify-between h-16 px-4 gap-3">
                    {/* LEFT: Hamburger Menu (Fixed) */}
                    <div className="w-10 flex items-center mr-1">
                        <button
                            onClick={() => openMobileMenu(false)}
                            className="p-1 text-gray-900 transition-colors"
                            aria-label="Open menu"
                        >
                            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                            </svg>
                        </button>
                    </div>

                    {/* CENTER: Logo & Brand (Centering) */}
                    <Link href="/" className="flex-1 min-w-0 flex items-center justify-center gap-3">
                        <div className="relative w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center shadow-sm border border-gray-200 overflow-hidden shrink-0">
                            <Image
                                src={logoImage}
                                alt="Charan Organics"
                                fill
                                sizes="40px"
                                className="object-cover object-top"
                                priority
                            />
                        </div>
                        <span className="flex-1 min-w-0 text-[15px] font-bold text-gray-900 truncate">
                            Charan Organics
                        </span>
                    </Link>

                    {/* RIGHT: Actions (Fixed) */}
                    <div className="flex items-center justify-end shrink-0">
                        <button
                            type="button"
                            onClick={() => openMobileMenu(true)}
                            className="ml-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-gray-100 text-gray-900 shadow-sm transition-colors hover:border-green-200 hover:bg-green-50 hover:text-green-600"
                            aria-label="Search products"
                        >
                            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </button>

                        <Link href="/cart" className="relative shrink-0 ml-2 mr-1" aria-label="Cart">
                            <div className="bg-white rounded-full p-2 border border-gray-100 shadow-sm text-gray-900">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            {items.length > 0 && (
                                <span className="absolute -top-2 -right-2 min-w-[20px] h-5 px-1.5 bg-green-600 rounded-lg text-xs font-semibold text-white flex items-center justify-center border-2 border-white shadow-md">
                                    {items.length}
                                </span>
                            )}
                        </Link>
                    </div>
                </div>

                {/* DESKTOP HEADER */}
                <div className="hidden md:flex items-center justify-between h-20">
                    {/* Logo (Image-based) */}
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="relative w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform duration-500 overflow-hidden p-0.5 border border-gray-100">
                            <Image
                                src={logoImage}
                                alt="Charan Organics"
                                fill
                                sizes="64px"
                                className="object-cover object-top"
                                priority
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xl font-black tracking-tighter text-gray-900 leading-none">
                                Charan Organics
                            </span>
                            <span className="text-[8px] font-bold text-green-600 uppercase tracking-[0.2em] mt-0.5 opacity-80">
                                Crafted Purity
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden lg:flex items-center gap-10">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                className={`text-[11px] font-bold uppercase tracking-[0.2em] transition-all relative group py-2 ${pathname === link.href ? 'text-green-600' : 'text-gray-500 hover:text-green-600'
                                    }`}
                            >
                                {link.label}
                                <span className={`absolute bottom-0 left-0 w-full h-[2px] bg-green-600 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left ${pathname === link.href ? 'scale-x-100' : ''}`} />
                            </Link>
                        ))}
                    </nav>

                    {/* Desktop Search */}
                    <div className="hidden md:flex items-center ml-2 mr-0" ref={searchContainerRef}>
                        <form onSubmit={handleSearchSubmit} className={`relative flex items-center transition-all duration-300 ease-out ${isSearchOpen ? 'w-64' : 'w-32'}`}>
                            <input
                                ref={searchInputRef}
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search..."
                                className={`absolute right-0 top-1/2 -translate-y-1/2 bg-white text-gray-900 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all duration-300 shadow-sm
                                    ${isSearchOpen
                                        ? 'w-full h-11 !pl-20 !pr-16 opacity-100 pointer-events-auto'
                                        : 'w-full h-10 opacity-0 pointer-events-none'
                                    }`}
                            />
                            <button
                                type="button"
                                onClick={() => {
                                    if (isSearchOpen) {
                                        // Submit if open (this path might not be reachable if we hide the button, but good for safety)
                                        if (searchQuery.trim()) {
                                            handleSearchSubmit({ preventDefault: () => { } } as React.FormEvent);
                                        } else {
                                            searchInputRef.current?.focus();
                                        }
                                    } else {
                                        setSearchQuery(pathname === '/shop' ? activeShopQuery : '');
                                        setIsSearchOpen(true);
                                        setTimeout(() => searchInputRef.current?.focus(), 100);
                                    }
                                }}
                                className={`absolute right-0 top-1/2 -translate-y-1/2 w-full h-10 flex flex-row items-center justify-center px-3 gap-2 rounded-lg bg-gray-100 text-gray-900 hover:text-green-600 hover:bg-green-50 hover:border-green-200 border border-transparent transition-all duration-300 z-10 ${isSearchOpen ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}
                            >
                                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                <span className="text-sm font-medium whitespace-nowrap">Search</span>
                            </button>
                            {/* Search Icon inside Input (visible when open) */}
                            <div className={`absolute left-0 top-0 h-full w-10 flex items-center justify-center text-gray-500 pointer-events-none transition-opacity duration-300 ${isSearchOpen ? 'opacity-100' : 'opacity-0'}`}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            {/* Close/Clear Button when open */}
                            {isSearchOpen && (
                                <button
                                    type="button"
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        if (searchQuery) {
                                            clearSearch();
                                            searchInputRef.current?.focus();
                                        } else {
                                            setIsSearchOpen(false);
                                        }
                                    }}
                                    aria-label={searchQuery ? 'Clear search' : 'Close search'}
                                    className="absolute right-2.5 top-1/2 z-20 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-all hover:border-green-200 hover:bg-green-50 hover:text-green-700 active:scale-95"
                                >
                                    {searchQuery ? (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    ) : (
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    )}
                                </button>
                            )}
                        </form>
                    </div>

                    {/* Actions (Desktop Only now) */}
                    <div className="hidden md:flex items-center gap-2 md:gap-6">
                        {/* Language Toggle */}
                        {/* Language Toggle (Desktop) */}
                        <button
                            onClick={() => setLocale(locale === 'en' ? 'te' : 'en')}
                            className="w-10 h-10 flex items-center justify-center bg-gray-100 rounded-full text-xs font-bold text-gray-900 border border-gray-200 shadow-sm hover:shadow-md hover:border-green-600 hover:text-green-600 transition-all active:scale-95"
                            aria-label="Switch Language"
                        >
                            {languageToggleLabel}
                        </button>

                        {/* Cart (Optimized Display) */}
                        <Link href="/cart" className="group relative flex items-center bg-white text-gray-900 px-4 md:px-10 py-2.5 md:py-4 rounded-2xl md:rounded-[2rem] shadow-xl md:shadow-2xl hover:shadow-green-900/10 hover:border-green-600 transition-all duration-500 border-2 border-gray-100 gap-3 md:gap-8">
                            <div className="relative">
                                <svg className="w-5 h-5 md:w-7 md:h-7 text-green-600 group-hover:rotate-12 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                                </svg>
                            </div>
                            <div className="flex items-center gap-3 md:gap-10 border-l border-gray-100 pl-3 md:pl-10">
                                <div className="flex flex-col items-center leading-none">
                                    <span className="text-sm md:text-lg font-bold text-gray-900 mb-0.5 md:mb-1">{items.length}</span>
                                    <span className="text-[7px] md:text-[9px] font-semibold uppercase tracking-widest text-gray-400">{t('items') || 'Items'}</span>
                                </div>
                                <span className="text-sm md:text-base font-bold text-green-600 tracking-tighter">
                                    ₹{subtotal.toFixed(0)}
                                </span>
                            </div>
                        </Link>

                        {/* Wishlist Link */}
                        <div className="hidden md:block">
                            <Link
                                href="/account/wishlist"
                                className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-pink-50 hover:text-pink-500 transition-all group"
                                title="My Wishlist"
                            >
                                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </Link>
                        </div>

                        {/* Profile/Auth (Icon Style) */}
                        <div className="hidden md:block">
                            <Link
                                href={user ? "/account" : "/login"}
                                className="w-12 h-12 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-green-50 hover:text-green-600 transition-all group"
                                title={user ? t('myAccount') : `${t('login')} / ${t('signup')}`}
                            >
                                <svg className="w-6 h-6 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile Menu (Full Overlay Style) */}
            {isMobileMenuOpen && (
                <div className="lg:hidden absolute top-full left-0 right-0 bg-white/95 backdrop-blur-md shadow-xl border-t border-gray-100/80 py-5 px-6 animate-fade-in-down transition-all duration-300 max-h-[85vh] overflow-y-auto">
                    <nav className="flex flex-col gap-1">
                        {/* Mobile Search - Top of menu */}
                        <div className="mb-4">
                            <form onSubmit={handleSearchSubmit} className="relative">
                                <input
                                    ref={mobileSearchInputRef}
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search products..."
                                    className="w-full h-12 !pl-16 !pr-16 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all font-medium py-3 text-base shadow-sm"
                                // autoFocus might not work well with transition, so we rely on user tap or effect
                                />
                                <div className="absolute left-0 top-0 h-full w-11 flex items-center justify-center text-gray-600 pointer-events-none">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                    </svg>
                                </div>
                                {searchQuery && (
                                    <button
                                        type="button"
                                        onClick={clearSearch}
                                        aria-label="Clear search"
                                        className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-all hover:border-green-200 hover:bg-green-50 hover:text-green-700 active:scale-95"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                )}
                            </form>
                        </div>
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={`group py-3 text-lg font-semibold tracking-[0.01em] flex items-center justify-between border-b border-gray-100/70 transition-colors ${pathname === link.href ? 'text-green-600' : 'text-gray-700 hover:text-gray-900'}`}
                            >
                                <span>{link.label}</span>
                                <svg className={`w-4 h-4 transition-all duration-200 ${pathname === link.href ? 'text-green-500 translate-x-0.5' : 'text-gray-400 group-hover:text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                                </svg>
                            </Link>
                        ))}
                        <Link
                            href="/cart"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className={`group py-3 text-lg font-semibold tracking-[0.01em] flex items-center justify-between border-b border-gray-100/70 transition-colors ${pathname === '/cart' ? 'text-green-600' : 'text-gray-700 hover:text-gray-900'}`}
                        >
                            <span className="flex items-center gap-3">
                                My Cart
                                <span className="min-w-[22px] h-6 px-2 rounded-lg text-xs font-semibold bg-green-100 text-green-700 inline-flex items-center justify-center leading-none">{items.length}</span>
                            </span>
                            <svg className={`w-4 h-4 transition-all duration-200 ${pathname === '/cart' ? 'text-green-500 translate-x-0.5' : 'text-gray-400 group-hover:text-gray-500'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                            </svg>
                        </Link>
                        <button
                            type="button"
                            onClick={() => setLocale(locale === 'en' ? 'te' : 'en')}
                            className="group py-3 text-lg font-semibold tracking-[0.01em] flex items-center justify-between border-b border-gray-100/70 text-gray-700 hover:text-gray-900 transition-colors"
                        >
                            <span>Language</span>
                            <span className="inline-flex min-w-[52px] items-center justify-center rounded-full border border-gray-200 bg-gray-100 px-3 py-1 text-sm font-bold text-gray-900 transition-colors group-hover:border-green-200 group-hover:bg-green-50 group-hover:text-green-700">
                                {languageToggleLabel}
                            </span>
                        </button>
                        <div className="pt-5 mt-3 border-t border-gray-100/80 flex flex-col gap-3">
                            {user ? (
                                <Link
                                    href="/account"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="group py-2 text-lg font-semibold tracking-[0.01em] text-green-600 flex items-center justify-between transition-colors hover:text-green-700"
                                >
                                    <span>My Account</span>
                                    <svg className="w-4 h-4 text-green-500 transition-all duration-200 group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                </Link>
                            ) : (
                                <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                                    <Button variant="primary" fullWidth size="lg" className="rounded-2xl font-semibold uppercase tracking-[0.08em] text-sm h-12 shadow-md shadow-green-100/60">
                                        {t('login')} / {t('signup')}
                                    </Button>
                                </Link>
                            )}
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
}
