/**
 * Product Grid Component - REFINED WITH RESULTS COUNT
 * 
 * Clean layout with results count positioned above grid
 */

'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase/client';
import { ProductCard } from '@/components/product/ProductCard';
import type { Database } from '@/lib/supabase/database.types';

type Product = Database['public']['Tables']['products']['Row'] & {
    is_best_seller?: boolean;
    is_new?: boolean;
};
type Section = Database['public']['Tables']['sections']['Row'];
type ProductSection = Database['public']['Tables']['product_sections']['Row'];

export function ProductGrid() {
    const searchParams = useSearchParams();
    const requestRef = useRef(0); // Track request ID to handle race conditions

    const [products, setProducts] = useState<Product[]>([]);
    const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);

    const fetchRecommendedProducts = useCallback(async () => {
        const { data } = await supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false })
            .limit(6);

        setRecommendedProducts((data || []) as Product[]);
    }, []);

    const fetchProducts = useCallback(async () => {
        const requestId = ++requestRef.current;
        setLoading(true);

        try {
            // Get filter parameters
            const sectionsParam = searchParams.get('section');
            const sections = sectionsParam?.split(',').filter(Boolean) || [];
            const minPrice = searchParams.get('minPrice');
            const maxPrice = searchParams.get('maxPrice');
            const sort = searchParams.get('sort') || 'default';
            const search = searchParams.get('q');

            // Build query
            let query = supabase
                .from('products')
                .select('*', { count: 'exact' })
                .eq('is_active', true);

            // Apply section filter - UPDATED: Now handles multiple sections
            if (sections.length > 0) {
                // Get all section UUIDs from section_ids
                const { data: sectionData, error: sectionError } = await supabase
                    .from('sections')
                    .select('id, section_id')
                    .in('section_id', sections);

                if (sectionError) throw sectionError;

                if (sectionData && sectionData.length > 0) {
                    const sectionUUIDs = (sectionData as Pick<Section, 'id' | 'section_id'>[]).map((s) => s.id);

                    // Get all products that belong to ANY of the selected sections
                    const { data: sectionProducts, error: mappingError } = await supabase
                        .from('product_sections')
                        .select('product_id')
                        .in('section_id', sectionUUIDs);

                    if (mappingError) throw mappingError;

                    if (sectionProducts && sectionProducts.length > 0) {
                        // Get unique product IDs
                        const productIds = [...new Set((sectionProducts as Pick<ProductSection, 'product_id'>[]).map((sp) => sp.product_id))];
                        query = query.in('id', productIds);
                    } else {
                        // No products in these sections
                        if (requestRef.current !== requestId) return;
                        setProducts([]);
                        setTotalCount(0);
                        await fetchRecommendedProducts();
                        setLoading(false);
                        return;
                    }
                } else {
                    // Sections not found
                    if (requestRef.current !== requestId) return;
                    setProducts([]);
                    setTotalCount(0);
                    await fetchRecommendedProducts();
                    setLoading(false);
                    return;
                }
            }

            // Apply price filter
            if (minPrice) {
                query = query.gte('current_price', parseFloat(minPrice));
            }
            if (maxPrice) {
                query = query.lte('current_price', parseFloat(maxPrice));
            }

            // Apply search filter
            if (search) {
                query = query.or(`title_en.ilike.%${search}%,title_te.ilike.%${search}%,description_en.ilike.%${search}%,description_te.ilike.%${search}%`);
            }

            // Apply sorting
            switch (sort) {
                case 'price_asc':
                    query = query.order('current_price', { ascending: true });
                    break;
                case 'price_desc':
                    query = query.order('current_price', { ascending: false });
                    break;
                case 'newest':
                    query = query.order('created_at', { ascending: false });
                    break;
                default:
                    query = query.order('created_at', { ascending: false });
            }

            // Limit results to 20 as requested
            query = query.limit(20);

            const { data, count, error } = await query;

            if (requestRef.current !== requestId) return; // Prevent race conditions

            if (error) throw error;

            setProducts((data || []) as Product[]);
            setTotalCount(count || 0);

            // Fetch recommended products if no results
            if (!data || data.length === 0) {
                await fetchRecommendedProducts();
            }
        } catch (error) {
            const message = typeof error === 'object' && error !== null && 'message' in error
                ? (error as { message?: string }).message
                : String(error);
            console.error('Error fetching products:', message);
            if (requestRef.current === requestId) {
                setProducts([]);
            }
        } finally {
            if (requestRef.current === requestId) {
                setLoading(false);
            }
        }
    }, [fetchRecommendedProducts, searchParams]);

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
        </div>
    );
}
