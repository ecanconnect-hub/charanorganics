/**
 * Category Grid Component
 * 
 * Displays product categories in a responsive grid layout.
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';

interface Section {
    id: string;
    section_id: string;
    title_en: string;
    title_te: string;
    image_url: string | null;
    display_order: number;
    product_count?: number; // Added product_count
}

interface CategoryGridProps {
    sections: Section[];
    limitMobile?: boolean;
}

export function CategoryGrid({ sections, limitMobile = false }: CategoryGridProps) {
    const locale = useLocale();
    const t = useTranslations('home');
    const [counts, setCounts] = useState<Record<string, number>>({});

    useEffect(() => {
        fetchCounts();
    }, [sections]);

    const fetchCounts = async () => {
        if (!sections.length) return;

        try {
            // Fetch product counts for each section from the mapping table
            const { data, error } = await (supabase
                .from('product_sections' as any) as any)
                .select('section_id');

            if (error) {
                console.error('Error fetching category counts:', error);
                return;
            }

            if (data) {
                const countMap: Record<string, number> = {};
                data.forEach((item: any) => {
                    countMap[item.section_id] = (countMap[item.section_id] || 0) + 1;
                });
                setCounts(countMap);
            }
        } catch (error) {
            console.error('Error fetching category counts:', error);
        }
    };

    if (!sections || sections.length === 0) return null;

    // Always show all sections (Mobile Limit Removed)
    const displaySections = sections;

    return (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 md:gap-6">
            {displaySections.map((section, index) => {
                const title = locale === 'en' ? section.title_en : section.title_te;
                const productCount = counts[section.id] || 0;

                return (
                    <motion.div
                        key={section.id}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.05 }}
                        className="block"
                    >
                        <Link
                            href={`/shop?category=${section.section_id}`}
                            className="group relative block aspect-square rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 bg-gray-100 border border-gray-100"
                        >
                            {/* image */}
                            {section.image_url ? (
                                <Image
                                    src={section.image_url}
                                    alt={title}
                                    fill
                                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
                                    className="object-cover group-hover:scale-110 transition-transform duration-700"
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">
                                    🌿
                                </div>
                            )}

                            {/* Subtle gradient overlay - reduced opacity for better image visibility */}
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors duration-500" />

                            {/* Category Label - Auto-sizing container */}
                            <div className="absolute bottom-2 left-2 right-2">
                                <div className="bg-white/70 backdrop-blur-md px-2 py-1.5 rounded-lg shadow-md border border-white/30 transform group-hover:-translate-y-1 transition-transform duration-500 text-center min-h-fit">
                                    <span
                                        className="block font-bold text-gray-900 uppercase tracking-tight leading-tight line-clamp-2"
                                        style={{ fontSize: '15px', lineHeight: '1.15' }}
                                    >
                                        {title}
                                    </span>
                                    <p className="text-[10px] font-semibold text-green-600 uppercase tracking-normal opacity-90 leading-tight mt-0.5">
                                        {productCount} Products
                                    </p>
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                );
            })}
        </div>
    );
}
