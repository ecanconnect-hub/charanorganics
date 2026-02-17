/**
 * Shop Page - POLISHED & REFINED
 * 
 * Perfectly balanced layout with consistent spacing and alignment
 */

'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { ProductGrid } from '@/components/shop/ProductGrid';
import { ShopFilters } from '@/components/shop/ShopFilters';

function ShopContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
    const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'default');
    const [showFilters, setShowFilters] = useState(false);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const params = new URLSearchParams(searchParams.toString());

        if (searchQuery.trim()) {
            params.set('q', searchQuery.trim());
        } else {
            params.delete('q');
        }

        router.push(`/shop?${params.toString()}`, { scroll: false });
    };

    const handleSort = (value: string) => {
        setSortBy(value);
        const params = new URLSearchParams(searchParams.toString());

        if (value && value !== 'default') {
            params.set('sort', value);
        } else {
            params.delete('sort');
        }

        router.push(`/shop?${params.toString()}`, { scroll: false });
    };

    return (
        <div className="bg-gray-50/30 min-h-screen">
            {/* Safe top spacing to avoid header overlap */}
            <div className="h-24 md:h-28"></div>

            <div className="max-w-7xl mx-auto px-4 md:px-6 pb-16">
                {/* Page Header */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-5"
                >
                    <h1 className="text-2xl md:text-3xl font-black text-gray-900 mb-1 tracking-tight">
                        Shop All Products
                    </h1>
                    <p className="text-xs md:text-sm text-gray-600 font-medium">
                        Discover our complete range of organic products
                    </p>
                </motion.div>

                {/* Search & Sort Bar - Compact & Aligned */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-5"
                >
                    <div className="flex flex-col sm:flex-row gap-2.5">
                        {/* Mobile Filter Toggle */}
                        <button
                            type="button"
                            onClick={() => setShowFilters(!showFilters)}
                            className="lg:hidden flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-xs font-bold hover:bg-gray-50 transition-colors bg-white"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                            </svg>
                            Filters
                        </button>

                        {/* Search */}
                        <form onSubmit={handleSearch} className="flex-1">
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    placeholder="Search products..."
                                    className="w-full h-11 !py-0 !pl-12 pr-4 border border-gray-200 rounded-lg text-sm font-medium text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white shadow-sm transition-all leading-[44px]"
                                />
                                <svg
                                    className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                        </form>

                        {/* Sort Dropdown */}
                        <div className="w-full sm:w-56">
                            <select
                                value={sortBy}
                                onChange={(e) => handleSort(e.target.value)}
                                className="w-full h-11 !py-0 pl-4 pr-10 border border-gray-200 rounded-lg text-sm font-bold text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent appearance-none bg-white cursor-pointer shadow-sm transition-all"
                                style={{
                                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23374151'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                                    backgroundRepeat: 'no-repeat',
                                    backgroundPosition: 'right 0.75rem center',
                                    backgroundSize: '1rem'
                                }}
                            >
                                <option value="default" className="text-gray-900">Sort: Default</option>
                                <option value="price_asc" className="text-gray-900">Price: Low to High</option>
                                <option value="price_desc" className="text-gray-900">Price: High to Low</option>
                                <option value="newest" className="text-gray-900">Newest First</option>
                            </select>
                        </div>
                    </div>
                </motion.div>

                {/* Main Layout: Filters + Products - Aligned Top */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
                    {/* Sidebar Filters */}
                    <aside className={`lg:col-span-3 ${showFilters ? 'block' : 'hidden lg:block'}`}>
                        <Suspense fallback={
                            <div className="bg-white rounded-lg p-4 shadow-sm border border-gray-100 animate-pulse">
                                <div className="h-5 bg-gray-100 rounded w-1/2 mb-3"></div>
                                <div className="space-y-1.5">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className="h-8 bg-gray-50 rounded"></div>
                                    ))}
                                </div>
                            </div>
                        }>
                            <ShopFilters />
                        </Suspense>
                    </aside>

                    {/* Product Grid */}
                    <div className="lg:col-span-9">
                        <Suspense fallback={
                            <div className="space-y-4">
                                <div className="h-8 bg-white rounded-lg border border-gray-100 animate-pulse"></div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {[...Array(6)].map((_, i) => (
                                        <div key={i} className="bg-white rounded-lg overflow-hidden border border-gray-100 animate-pulse">
                                            <div className="aspect-[5/4] bg-gray-100"></div>
                                            <div className="p-3 space-y-2">
                                                <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                                                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                                                <div className="h-8 bg-gray-100 rounded"></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        }>
                            <ProductGrid />
                        </Suspense>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function ShopPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gray-50/30 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                    <p className="text-gray-600 font-semibold text-sm">Loading products...</p>
                </div>
            </div>
        }>
            <ShopContent />
        </Suspense>
    );
}
