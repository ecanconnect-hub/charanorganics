/**
 * Product Detail Page
 * 
 * Display full product information with add to cart
 */

import { notFound } from 'next/navigation';
import { ProductDetailClient } from '@/components/product/ProductDetailClient';
import { supabase } from '@/lib/supabase/client';

export default async function ProductDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const { data: product } = await supabase
        .from('products')
        .select('*')
        .eq('product_id', id)
        .eq('is_active', true)
        .single();

    if (!product) {
        notFound();
    }

    return (
        <div className="bg-background">
            {/* Safe top spacing to avoid header overlap */}
            <div className="h-24 md:h-28"></div>
            <ProductDetailClient product={product} />
        </div>
    );
}
