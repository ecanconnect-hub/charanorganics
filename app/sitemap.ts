import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';
import type { MetadataRoute } from 'next';

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const baseUrl = 'https://charanorganics.com';

    const now = new Date();
    const routes = [
        '',
        '/shop',
        '/about',
        '/contact',
        '/track-order',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: now,
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    const { data: products } = await supabase
        .from('products')
        .select('product_id, updated_at')
        .eq('is_active', true) as { data: { product_id: string; updated_at: string | null }[] | null };

    const productRoutes = (products || []).map((product) => ({
        url: `${baseUrl}/product/${product.product_id}`,
        lastModified: product.updated_at ? new Date(product.updated_at) : now,
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }));

    return [...routes, ...productRoutes];
}
