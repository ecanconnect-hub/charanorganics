/**
 * Shop Filters Component - ULTRA COMPACT
 * 
 * Minimal spacing with clean, tight layout
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useLocale } from '@/lib/i18n/context';
import { resolveLocalizedText } from '@/lib/i18n/localized';
import { Button } from '@/components/ui/Button';
import type { Database } from '@/lib/supabase/database.types';

type Section = Database['public']['Tables']['sections']['Row'];
type ShopFiltersResponse = {
    sections: Section[];
    priceRange: {
        min: number;
        max: number;
    };
    error?: string;
};

// Module-level cache: filters data changes rarely (sections, price range).
// Caching here means re-mounts (e.g. back-navigation) resolve instantly
// without another network round-trip to /api/shop/filters.
let filtersCache: ShopFiltersResponse | null = null;

export function ShopFilters() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const locale = useLocale();

    const [sections, setSections] = useState<Section[]>([]);
    const [loading, setLoading] = useState(true);
    const [minPrice, setMinPrice] = useState('');
    const [maxPrice, setMaxPrice] = useState('');
    const [priceRange, setPriceRange] = useState({ min: 0, max: 10000 });

    const fetchFilters = useCallback(async () => {
        // Return from module-level cache if available (avoids re-fetch on re-mount)
        if (filtersCache) {
            setSections(filtersCache.sections || []);
            setPriceRange(filtersCache.priceRange || { min: 0, max: 10000 });
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const response = await fetch('/api/shop/filters', {
                method: 'GET',
            });

            const payload = await response.json() as ShopFiltersResponse;
            if (!response.ok) {
                throw new Error(payload.error || `Request failed (${response.status})`);
            }

            // Store in module cache for subsequent mounts
            filtersCache = payload;
            setSections(payload.sections || []);
            setPriceRange(payload.priceRange || { min: 0, max: 10000 });
        } catch (error) {
            console.error('Failed to load shop filters:', error);
            setSections([]);
            setPriceRange({ min: 0, max: 10000 });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        void fetchFilters();
    }, [fetchFilters]);

    const handleSectionFilter = (sectionId: string) => {
        const params = new URLSearchParams(searchParams.toString());
        const currentSections = params.get('section')?.split(',').filter(Boolean) || [];

        // Toggle section selection
        const index = currentSections.indexOf(sectionId);
        if (index > -1) {
            // Remove if already selected
            currentSections.splice(index, 1);
        } else {
            // Add if not selected
            currentSections.push(sectionId);
        }

        if (currentSections.length > 0) {
            params.set('section', currentSections.join(','));
        } else {
            params.delete('section');
        }

        params.delete('q');
        router.push(`/shop?${params.toString()}`, { scroll: false });
    };

    const handlePriceFilter = () => {
        const params = new URLSearchParams(searchParams.toString());

        if (minPrice) params.set('minPrice', minPrice);
        else params.delete('minPrice');

        if (maxPrice) params.set('maxPrice', maxPrice);
        else params.delete('maxPrice');

        router.push(`/shop?${params.toString()}`, { scroll: false });
    };

    const clearPriceFilter = () => {
        setMinPrice('');
        setMaxPrice('');
        const params = new URLSearchParams(searchParams.toString());
        params.delete('minPrice');
        params.delete('maxPrice');
        router.push(`/shop?${params.toString()}`, { scroll: false });
    };

    const clearAllFilters = () => {
        setMinPrice('');
        setMaxPrice('');
        router.push('/shop', { scroll: false });
    };

    const selectedSections = searchParams.get('section')?.split(',').filter(Boolean) || [];
    const hasActiveFilters = selectedSections.length > 0 || searchParams.get('minPrice') || searchParams.get('maxPrice');
    const sortedSections = useMemo(() => {
        const languageTag = locale === 'te' ? 'te' : 'en';

        return [...sections].sort((a, b) => {
            const labelA = locale === 'te'
                ? resolveLocalizedText(a.title_en, a.title_te)
                : a.title_en;
            const labelB = locale === 'te'
                ? resolveLocalizedText(b.title_en, b.title_te)
                : b.title_en;

            return labelA.localeCompare(labelB, languageTag, {
                sensitivity: 'base',
                numeric: true,
            });
        });
    }, [locale, sections]);

    if (loading) return (
        <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 animate-pulse">
            <div className="h-5 bg-gray-100 rounded w-1/2 mb-3"></div>
            <div className="space-y-1.5">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-8 bg-gray-50 rounded"></div>
                ))}
            </div>
        </div>
    );

    return (
        <div className="bg-white rounded-lg p-3.5 shadow-sm border border-gray-100 sticky top-28">
            {/* Header - Compact */}
            <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-gray-100">
                <h3 className="text-xs font-black uppercase tracking-wide text-gray-900">
                    Filters
                </h3>
                {hasActiveFilters && (
                    <button
                        onClick={clearAllFilters}
                        className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
                    >
                        Clear
                    </button>
                )}
            </div>

            {/* Categories Section - Simple Click to Toggle */}
            <div className="mb-3.5">
                <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
                    Categories {selectedSections.length > 0 && (
                        <span className="text-green-600">({selectedSections.length})</span>
                    )}
                </h4>

                <div className="flex flex-col gap-1 max-h-[220px] md:max-h-[280px] lg:max-h-[350px] overflow-y-auto pr-1.5 custom-scrollbar transition-all duration-300">
                    {sortedSections.map((section) => {
                        const isSelected = selectedSections.includes(section.section_id);
                        return (
                            <button
                                key={section.id}
                                onClick={() => handleSectionFilter(section.section_id)}
                                className={`text-left px-2.5 py-1.5 rounded-md transition-all duration-200 font-semibold text-xs ${isSelected
                                    ? 'bg-green-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                {locale === 'te'
                                    ? resolveLocalizedText(section.title_en, section.title_te)
                                    : section.title_en}
                            </button>
                        );
                    })}
                </div>

                <style jsx>{`
                    .custom-scrollbar::-webkit-scrollbar {
                        width: 4px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-track {
                        background: transparent;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb {
                        background: #e2e8f0;
                        border-radius: 10px;
                    }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                        background: #cbd5e1;
                    }
                    .custom-scrollbar {
                        scrollbar-width: thin;
                        scrollbar-color: #e2e8f0 transparent;
                        scroll-behavior: smooth;
                    }
                `}</style>
            </div>

            {/* Price Filter Section - Compact */}
            <div className="pt-2.5 border-t border-gray-100">
                <h4 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-2">
                    Price Range
                </h4>

                <div className="space-y-2">
                    {/* Price Inputs - Single Row, Equal Width */}
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Min</label>
                            <input
                                type="number"
                                value={minPrice}
                                onChange={(e) => setMinPrice(e.target.value)}
                                placeholder={`Rs.${priceRange.min}`}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                        <div className="flex-1">
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Max</label>
                            <input
                                type="number"
                                value={maxPrice}
                                onChange={(e) => setMaxPrice(e.target.value)}
                                placeholder={`Rs.${priceRange.max}`}
                                className="w-full px-2 py-1.5 border border-gray-200 rounded-md text-xs font-medium focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Action Buttons - Single Row, Equal Height */}
                    <div className="flex gap-2">
                        <Button
                            onClick={handlePriceFilter}
                            variant="primary"
                            size="sm"
                            className="flex-1 h-8 text-xs font-bold uppercase tracking-wide"
                        >
                            Apply
                        </Button>
                        <Button
                            onClick={clearPriceFilter}
                            variant="outline"
                            size="sm"
                            className="h-8 px-3 text-xs font-bold uppercase tracking-wide"
                        >
                            Clear
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
