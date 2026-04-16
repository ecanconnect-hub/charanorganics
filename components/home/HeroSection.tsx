/**
 * Hero Section Component
 * 
 * Main hero banner with CTA buttons
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useLocale } from '@/lib/i18n/context';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase/client';

const DEFAULT_HERO_CONTENT = {
    title: 'Pure Organic & Ayurvedic Products',
    subtitle: 'Handcrafted with love, delivered with care',
};

export function HeroSection() {
    const locale = useLocale();
    const [content, setContent] = useState(DEFAULT_HERO_CONTENT);

    useEffect(() => {
        const fetchContent = async () => {
            const { data } = await (supabase
                .from('site_content' as any) as any)
                .select('*')
                .in('content_key', ['hero_title', 'hero_subtitle']);

            if (data) {
                const typedData = data as any[];
                const titleContent = typedData.find(item => item.content_key === 'hero_title');
                const subtitleContent = typedData.find(item => item.content_key === 'hero_subtitle');

                setContent({
                    title: locale === 'en'
                        ? (titleContent?.content_en || DEFAULT_HERO_CONTENT.title)
                        : (titleContent?.content_te || DEFAULT_HERO_CONTENT.title),
                    subtitle: locale === 'en'
                        ? (subtitleContent?.content_en || DEFAULT_HERO_CONTENT.subtitle)
                        : (subtitleContent?.content_te || DEFAULT_HERO_CONTENT.subtitle),
                });
            }
        };

        void fetchContent();
    }, [locale]);

    return (
        <section className="relative bg-gradient-to-br from-[rgb(var(--muted))] via-white to-[rgb(var(--primary))]/5 overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
                <div className="absolute top-0 left-0 w-96 h-96 bg-[rgb(var(--primary))] rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-[rgb(var(--accent))] rounded-full blur-3xl"></div>
            </div>

            <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
                <div className="max-w-4xl mx-auto text-center">
                    {/* Title */}
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl md:text-6xl font-bold mb-6 leading-tight"
                    >
                        <span className="gradient-text">{content.title}</span>
                    </motion.h1>

                    {/* Subtitle */}
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed"
                    >
                        {content.subtitle}
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="flex flex-col sm:flex-row gap-4 justify-center"
                    >
                        <Link href="/shop">
                            <Button variant="primary" size="lg">
                                <svg className="w-5 h-5 mr-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path>
                                </svg>
                                Shop Now
                            </Button>
                        </Link>

                        <Link href="/about">
                            <Button
                                variant="outline"
                                size="lg"
                                className="group bg-transparent border-green-700 text-green-800 hover:bg-green-800 hover:text-white hover:border-green-800 transition-all duration-300 font-bold"
                            >
                                <svg className="w-5 h-5 mr-2 text-green-800 group-hover:text-white transition-colors" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                    <path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                                </svg>
                                Discover Our Story
                            </Button>
                        </Link>
                    </motion.div>

                    {/* Decorative Elements */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.8, delay: 0.6 }}
                        className="mt-16 flex justify-center gap-8 flex-wrap"
                    >
                        {[
                            { icon: '🌿', text: 'Natural' },
                            { icon: '🧪', text: 'Lab Tested' },
                            { icon: '🚫', text: 'No Chemicals' },
                            { icon: '🌱', text: 'Eco-Friendly' },
                        ].map((item, index) => (
                            <div key={index} className="flex items-center gap-2 text-gray-700">
                                <span className="text-2xl">{item.icon}</span>
                                <span className="font-medium">{item.text}</span>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}
