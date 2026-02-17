/**
 * Product Detail Page
 * 
 * Display full product information with add to cart
 */

import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { ProductDetailClient } from '@/components/product/ProductDetailClient';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';

type ProductRow = Database['public']['Tables']['products']['Row'];
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://charanorganics.com';

async function getProductBySlug(id: string): Promise<ProductRow | null> {
    const { data } = await supabase
        .from('products')
        .select('*')
        .eq('product_id', id)
        .eq('is_active', true)
        .single();

    return (data as ProductRow | null) ?? null;
}

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    const product = await getProductBySlug(id);

    if (!product) {
        return {
            title: 'Product Not Found',
            robots: {
                index: false,
                follow: true,
            },
        };
    }

    const title = product.title_en;
    const description = product.description_en?.slice(0, 155) || `Buy ${title} from Charan Organics.`;
    const canonical = `/product/${id}`;

    return {
        title,
        description,
        alternates: {
            canonical,
        },
        openGraph: {
            title,
            description,
            type: 'website',
            url: canonical,
            images: product.image_url ? [{ url: product.image_url }] : undefined,
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: product.image_url ? [product.image_url] : undefined,
        },
    };
}

export default async function ProductDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const product = await getProductBySlug(id);

    if (!product) {
        notFound();
    }

    const productJsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.title_en,
        sku: product.product_id,
        image: product.image_url ? [product.image_url] : [],
        description: product.description_en || undefined,
        brand: {
            '@type': 'Brand',
            name: 'Charan Organics',
        },
        offers: {
            '@type': 'Offer',
            priceCurrency: 'INR',
            price: product.current_price,
            availability: product.stock_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            url: `${siteUrl}/product/${id}`,
        },
    };

    return (
        <div className="bg-background">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
            />
            {/* Safe top spacing to avoid header overlap */}
            <div className="h-24 md:h-28"></div>
            <ProductDetailClient product={product} />
        </div>
    );
}
