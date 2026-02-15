import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';

export default async function sitemap() { // Corrected export for next.js
    const supabase = createClient<Database>(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const baseUrl = 'https://charanorganics.com';

    // 1. Static Routes
    const routes = [
        '',
        '/shop',
        '/about',
        '/contact',
        '/login',
        '/signup',
        '/track-order',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }));

    // 2. Dynamic Product Routes
    const { data: products } = await supabase
        .from('products')
        .select('id, updated_at') as { data: { id: string; updated_at: string | null }[] | null };

    const productRoutes = (products || []).map((product) => ({
        url: `${baseUrl}/product/${product.id}`,
        lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.9,
    }));

    return [...routes, ...productRoutes];
}
