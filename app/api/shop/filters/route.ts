import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { ensureSupabaseDnsRouting } from '@/lib/server/ensureSupabaseDnsRouting';

type Section = Database['public']['Tables']['sections']['Row'];
type Product = Database['public']['Tables']['products']['Row'];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables for shop filters API');
}

ensureSupabaseDnsRouting();

const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

function getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    if (typeof error === 'string' && error.trim().length > 0) {
        return error;
    }

    if (typeof error === 'object' && error !== null) {
        const candidate = error as {
            message?: unknown;
            error_description?: unknown;
            hint?: unknown;
            details?: unknown;
            code?: unknown;
        };

        const parts: string[] = [];
        if (typeof candidate.message === 'string' && candidate.message.trim().length > 0) {
            parts.push(candidate.message);
        }
        if (typeof candidate.error_description === 'string' && candidate.error_description.trim().length > 0) {
            parts.push(candidate.error_description);
        }
        if (typeof candidate.hint === 'string' && candidate.hint.trim().length > 0) {
            parts.push(`hint: ${candidate.hint}`);
        }
        if (typeof candidate.details === 'string' && candidate.details.trim().length > 0) {
            parts.push(`details: ${candidate.details}`);
        }
        if (typeof candidate.code === 'string' && candidate.code.trim().length > 0) {
            parts.push(`code: ${candidate.code}`);
        }

        if (parts.length > 0) {
            return parts.join(' | ');
        }

        try {
            return JSON.stringify(error);
        } catch {
            return 'Unknown error';
        }
    }

    return 'Unknown error';
}

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
        const message = getErrorMessage(error);
        console.error('Shop filters API error:', message, error);
        return NextResponse.json(
            { error: message || 'Failed to load shop filters' },
            { status: 503 }
        );
    }
}
