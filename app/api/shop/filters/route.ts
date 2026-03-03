import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';

type Section = Database['public']['Tables']['sections']['Row'];
type Product = Database['public']['Tables']['products']['Row'];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables for shop filters API');
}

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

export async function GET() {
    try {
        const [{ data: sections, error: sectionsError }, { data: prices, error: pricesError }] = await Promise.all([
            supabase
                .from('sections')
                .select('*')
                .eq('is_enabled', true)
                .order('display_order'),
            supabase
                .from('products')
                .select('current_price')
                .eq('is_active', true),
        ]);

        if (sectionsError) {
            throw sectionsError;
        }

        if (pricesError) {
            throw pricesError;
        }

        const priceValues = ((prices || []) as Pick<Product, 'current_price'>[])
            .map((item) => item.current_price)
            .filter((value): value is number => Number.isFinite(value));

        const minPrice = priceValues.length > 0 ? Math.floor(Math.min(...priceValues)) : 0;
        const maxPrice = priceValues.length > 0 ? Math.ceil(Math.max(...priceValues)) : 10000;

        return NextResponse.json({
            sections: (sections || []) as Section[],
            priceRange: {
                min: minPrice,
                max: maxPrice,
            },
        });
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Shop filters API error:', message);
        return NextResponse.json(
            { error: message || 'Failed to load shop filters' },
            { status: 503 }
        );
    }
}

