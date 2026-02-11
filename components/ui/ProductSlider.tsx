/**
 * Product Slider Component
 * 
 * Displays a list of products in a horizontally scrollable container with premium interactions.
 */

'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ProductCard } from '@/components/product/ProductCard';
import { useTranslations } from '@/lib/i18n/context';

interface ProductSliderProps {
    title: string;
    subtitle?: string;
    products: any[];
    viewAllLink?: string;
}

export function ProductSlider({ title, subtitle, products, viewAllLink }: ProductSliderProps) {
    const t = useTranslations('home');
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { scrollLeft, clientWidth } = scrollRef.current;
            const scrollTo = direction === 'left' ? scrollLeft - clientWidth : scrollLeft + clientWidth;
            scrollRef.current.scrollTo({ left: scrollTo, behavior: 'smooth' });
        }
    };

    if (!products || products.length === 0) return null;

    return (
        <div className="relative group container mx-auto px-4 md:px-6">
            <div className="flex flex-col items-center text-center mb-12">
                <div className="max-w-3xl">
                    <span className="text-green-600 font-black uppercase tracking-[0.4em] text-[10px] md:text-xs mb-4 block underline underline-offset-8 decoration-2 decoration-green-200">Featured</span>
                    <h2 className="text-4xl md:text-5xl font-black text-gray-900 mb-6 tracking-tighter uppercase leading-tight italic">
                        {title}
                    </h2>
                    {subtitle && (
                        <p className="text-lg text-gray-600 font-medium leading-relaxed">{subtitle}</p>
                    )}
                </div>
                {viewAllLink && (
                    <Link
                        href={viewAllLink}
                        className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-400 hover:text-green-600 transition-all group/link"
                    >
                        {t('viewAll')}
                        <svg className="w-5 h-5 group-hover/link:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                )}
            </div>

            {/* Slider Controls */}
            <div className="absolute top-1/2 -left-4 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                <button
                    onClick={() => scroll('left')}
                    className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 text-gray-800 transition-all border border-gray-100"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            </div>
            <div className="absolute top-1/2 -right-4 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100 transition-opacity hidden md:block">
                <button
                    onClick={() => scroll('right')}
                    className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 text-gray-800 transition-all border border-gray-100"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {/* Scrollable Container */}
            <div
                ref={scrollRef}
                className="flex gap-6 overflow-x-auto pb-8 scrollbar-hide snap-x"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {products.map((product, index) => (
                    <motion.div
                        key={product.id}
                        initial={{ opacity: 0, x: 20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05 }}
                        className="flex-shrink-0 w-[46%] md:w-[31%] lg:w-[19%] snap-start"
                    >
                        <ProductCard product={product} />
                    </motion.div>
                ))}
            </div>

            {/* Mobile View All Link */}
            {viewAllLink && (
                <div className="mt-8 text-center md:hidden">
                    <Link
                        href={viewAllLink}
                        className="inline-flex items-center gap-2 text-green-600 font-bold"
                    >
                        {t('viewAll')}
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            )}
        </div>
    );
}
