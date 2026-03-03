/**
 * Product Grid Component - REFINED WITH RESULTS COUNT
 * 
 * Clean layout with results count positioned above grid
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ProductCard } from '@/components/product/ProductCard';
import type { Database } from '@/lib/supabase/database.types';

type Product = Database['public']['Tables']['products']['Row'] & {
    is_best_seller?: boolean;
    is_new?: boolean;
};
type ShopProductsResponse = {
    products: Product[];
    totalCount: number;
    recommendedProducts: Product[];
    error?: string;
};

export function ProductGrid() {
    const searchParams = useSearchParams();
    const requestRef = useRef(0); // Track request ID to handle race conditions

    const [products, setProducts] = useState<Product[]>([]);
    const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [visibleCount, setVisibleCount] = useState(50);
    const [serviceError, setServiceError] = useState<string | null>(null);

    const isSupabaseUnavailableError = useCallback((message: string) => {
        const normalized = message.toLowerCase();
        return (
            normalized.includes('fetch failed') ||
            normalized.includes('failed to fetch') ||
            normalized.includes('network') ||
            normalized.includes('timeout') ||
            normalized.includes('paused') ||
            normalized.includes('temporarily unavailable') ||
            normalized.includes('503') ||
            normalized.includes('502') ||
            normalized.includes('gateway')
        );
    }, []);

    const getReadableServiceError = useCallback((message: string) => {
        const normalized = message.toLowerCase();

        if (normalized.includes('unable to connect') || normalized.includes('network') || normalized.includes('failed to fetch')) {
            return 'Unable to reach Supabase. Please check your internet/VPN and retry.';
        }

        if (isSupabaseUnavailableError(message)) {
            return 'Supabase service is temporarily unavailable. Please retry in 1-2 minutes.';
        }

        return 'Could not load products right now. Please retry.';
    }, [isSupabaseUnavailableError]);

    const fetchProducts = useCallback(async () => {
        const requestId = ++requestRef.current;
        setLoading(true);
        setServiceError(null);

        try {
            const apiParams = new URLSearchParams(searchParams.toString());
            apiParams.set('limit', String(visibleCount));

            const response = await fetch(`/api/shop/products?${apiParams.toString()}`, {
                method: 'GET',
                cache: 'no-store',
            });

            const payload = await response.json() as ShopProductsResponse;
            if (!response.ok) {
                throw new Error(payload.error || `Request failed (${response.status})`);
            }

            if (requestRef.current !== requestId) return;

            setProducts(payload.products || []);
            setTotalCount(payload.totalCount || 0);
            setRecommendedProducts(payload.recommendedProducts || []);
        } catch (error) {
            const message = typeof error === 'object' && error !== null && 'message' in error
                ? (error as { message?: string }).message
                : String(error);
            console.error('Error fetching products:', message);
            if (requestRef.current === requestId) {
                setProducts([]);
                setTotalCount(0);
                setServiceError(getReadableServiceError(message || ''));
            }
        } finally {
            if (requestRef.current === requestId) {
                setLoading(false);
            }
        }
    }, [getReadableServiceError, searchParams, visibleCount]);

    useEffect(() => {
        let isCancelled = false;

        const fetchData = async () => {
            if (isCancelled) return;
            await fetchProducts();
        };

        fetchData();

        return () => {
            isCancelled = true;
        };
    }, [fetchProducts]);

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="h-8 bg-white rounded-lg border border-gray-100 animate-pulse"></div>
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                    {[...Array(6)].map((_, i) => (
                        <div key={i} className="bg-white rounded-lg overflow-hidden border border-gray-100 animate-pulse">
                            <div className="aspect-[4/3] bg-gray-100"></div>
                            <div className="p-3 space-y-2">
                                <div className="h-3 bg-gray-100 rounded w-3/4"></div>
                                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                                <div className="h-8 bg-gray-100 rounded"></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (serviceError) {
        return (
            <div className="space-y-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-lg border border-red-100"
                >
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-10 h-10 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M4.93 19h14.14c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.2 16c-.77 1.33.19 3 1.73 3z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-black text-gray-900 mb-2">Service Unavailable</h3>
                    <p className="text-gray-600 mb-5 text-center max-w-md text-sm">
                        {serviceError}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="px-5 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors"
                    >
                        Retry
                    </button>
                </motion.div>
            </div>
        );
    }

    // Empty State
    if (products.length === 0) {
        return (
            <div className="space-y-8">
                {/* Empty State */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-lg border border-gray-100"
                >
                    <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-black text-gray-900 mb-2">No Products Found</h3>
                    <p className="text-gray-600 mb-5 text-center max-w-md text-sm">
                        We could not find any products matching your filters. Try adjusting your search or browse our recommended products below.
                    </p>
                    <button
                        onClick={() => window.location.href = '/shop'}
                        className="px-5 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors"
                    >
                        Clear All Filters
                    </button>
                </motion.div>

                {/* Recommended Products */}
                {recommendedProducts.length > 0 && (
                    <div>
                        <div className="mb-5">
                            <h3 className="text-lg md:text-xl font-black text-gray-900 mb-1">
                                Recommended For You
                            </h3>
                            <p className="text-gray-600 text-sm">Check out our popular products</p>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                            {recommendedProducts.map((product, index) => (
                                <motion.div
                                    key={product.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                >
                                    <ProductCard product={product} />
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // Products Grid
    return (
        <div className="space-y-4">
            {/* Results Count - Compact */}
            <div className="flex items-center justify-between py-2 px-3 bg-white rounded-lg border border-gray-100">
                <p className="text-xs md:text-sm font-semibold text-gray-600">
                    Showing <span className="text-gray-900 font-bold">{products.length}</span> of <span className="text-gray-900 font-bold">{totalCount}</span> products
                </p>
            </div>

            {/* Products Grid - Centered when few items */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={searchParams.toString()}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className={`grid gap-3 md:gap-4 ${products.length <= 2
                        ? 'grid-cols-2 sm:grid-cols-2 max-w-2xl mx-auto'
                        : 'grid-cols-2 sm:grid-cols-2 lg:grid-cols-3'
                        }`}
                >
                    {products.map((product, index) => (
                        <motion.div
                            key={product.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <ProductCard product={product} />
                        </motion.div>
                    ))}
                </motion.div>
            </AnimatePresence>

            {/* Show Recommended Products if only 1-3 products */}
            {products.length > 0 && products.length <= 3 && recommendedProducts.length > 0 && (
                <div className="mt-10 pt-8 border-t border-gray-200">
                    <div className="mb-5">
                        <h3 className="text-lg md:text-xl font-black text-gray-900 mb-1">
                            You May Also Like
                        </h3>
                        <p className="text-gray-600 text-sm">Explore more products</p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
                        {recommendedProducts.slice(0, 6).map((product, index) => (
                            <motion.div
                                key={product.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <ProductCard product={product} />
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
            {/* Load More Button */}
            {products.length < totalCount && (
                <div className="flex justify-center mt-8 pb-8">
                    <button
                        onClick={() => setVisibleCount((prev) => prev + 20)}
                        className="px-6 py-2 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all shadow-sm"
                        disabled={loading}
                    >
                        {loading ? 'Loading...' : `Load More (${totalCount - products.length} remaining)`}
                    </button>
                </div>
            )}
        </div>
    );
}
