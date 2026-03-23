/**
 * Recently Browsed Products Component
 * 
 * Shows products user has recently viewed
 * - Guest users: localStorage
 * - Logged-in users: database
 */

'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import { ProductCard } from '@/components/product/ProductCard';

function toFiniteNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
}

async function attachVariantMeta(products: any[]): Promise<any[]> {
    const ids = products.map((p) => p?.id).filter((id): id is string => typeof id === 'string' && id.length > 0);
    if (ids.length === 0) return products;

    try {
        const { data: variants, error } = await (supabase
            .from('product_variants' as any) as any)
            .select('product_id, price, enabled')
            .in('product_id', ids)
            .eq('enabled', true);

        if (error || !variants) return products;

        const ranges = new Map<string, { min: number | null; max: number | null; has: boolean }>();

        (variants as any[]).forEach((v) => {
            const productId = v?.product_id;
            if (typeof productId !== 'string' || productId.length === 0) return;

            const price = toFiniteNumber(v?.price);
            const current = ranges.get(productId) || { min: null, max: null, has: false };
            current.has = true;

            if (price !== null) {
                current.min = current.min === null ? price : Math.min(current.min, price);
                current.max = current.max === null ? price : Math.max(current.max, price);
            }

            ranges.set(productId, current);
        });

        return products.map((p) => {
            const meta = ranges.get(p.id);
            return {
                ...p,
                has_variants: meta?.has ?? false,
                variant_min_price: meta?.min ?? null,
                variant_max_price: meta?.max ?? null,
            };
        });
    } catch {
        return products;
    }
}

export function RecentlyBrowsed() {
    const [products, setProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, loading: authLoading } = useAuth();

    useEffect(() => {
        const fetchRecentlyBrowsed = async () => {
            if (authLoading) return;

            try {
                if (user) {
                    // Fetch from database
                    const { data } = await (supabase
                        .from('browsing_history' as any) as any)
                        .select(`
              product:products (
                id,
                product_id,
                title_en,
                title_te,
                image_url,
                mrp,
                current_price,
                is_active
              )
            `)
                        .eq('user_id', user.id)
                        .order('viewed_at', { ascending: false })
                        .limit(4);

                    const recentProducts = (data as any[])
                        ?.map((item: any) => item.product)
                        .filter((p: any) => p && p.is_active) || [];

                    const recentProductsWithMeta = await attachVariantMeta(recentProducts);
                    setProducts(recentProductsWithMeta);
                } else {
                    // Fetch from localStorage
                    try {
                        const browsedIds = JSON.parse(localStorage.getItem('recently_browsed') || '[]');

                        if (browsedIds.length > 0) {
                            const { data } = await (supabase
                                .from('products' as any) as any)
                                .select('id, product_id, title_en, title_te, image_url, mrp, current_price, is_active')
                                .in('id', browsedIds.slice(0, 4))
                                .eq('is_active', true);

                            const recentProductsWithMeta = await attachVariantMeta(data || []);
                            setProducts(recentProductsWithMeta);
                        }
                    } catch {
                        setProducts([]);
                    }
                }
            } catch (error) {
                console.error('Error fetching recently browsed:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecentlyBrowsed();
    }, [authLoading, user]);

    if (loading || products.length === 0) {
        return null;
    }

    return (
        <section className="section-padding bg-white">
            <div className="container mx-auto px-4">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-[rgb(var(--foreground))] mb-4">
                        Recently Browsed
                    </h2>
                    <p className="text-gray-600">
                        Continue where you left off
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {products.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            </div>
        </section>
    );
}
