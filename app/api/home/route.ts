import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { ensureSupabaseDnsRouting } from '@/lib/server/ensureSupabaseDnsRouting';

type Product = Database['public']['Tables']['products']['Row'] & {
    is_best_seller?: boolean;
    is_new?: boolean;
};
type Section = Database['public']['Tables']['sections']['Row'] & {
    image_url: string | null;
    product_count?: number;
};
type ProductSection = Database['public']['Tables']['product_sections']['Row'];
type SectionWithProducts = Section & { products: Product[] };

const MAX_PRODUCTS_PER_SLIDER = 10;

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables for home API');
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
        const sectionsRes = await supabase
            .from('sections')
            .select('*')
            .eq('is_enabled', true)
            .order('display_order');

        const productSectionsRes = await supabase
            .from('product_sections')
            .select('section_id, product_id, display_order')
            .order('display_order');

        const activeProductsRes = await supabase
            .from('products')
            .select('*')
            .eq('is_active', true)
            .order('created_at', { ascending: false });

        if (sectionsRes.error) throw sectionsRes.error;
        if (productSectionsRes.error) throw productSectionsRes.error;
        if (activeProductsRes.error) throw activeProductsRes.error;

        let bestSellerQueryData: Product[] = [];
        let newArrivalQueryData: Product[] = [];

        try {
            const bsProductsRes = await supabase
                .from('products')
                .select('*')
                .eq('is_active', true)
                .eq('is_best_seller', true)
                .order('updated_at', { ascending: false })
                .limit(MAX_PRODUCTS_PER_SLIDER);

            if (!bsProductsRes.error && bsProductsRes.data) {
                bestSellerQueryData = bsProductsRes.data as Product[];
            }
        } catch (error) {
            console.warn('Home API: best-seller query fallback triggered:', getErrorMessage(error));
        }

        try {
            const newProductsRes = await supabase
                .from('products')
                .select('*')
                .eq('is_active', true)
                .eq('is_new', true)
                .order('created_at', { ascending: false })
                .limit(MAX_PRODUCTS_PER_SLIDER);

            if (!newProductsRes.error && newProductsRes.data) {
                newArrivalQueryData = newProductsRes.data as Product[];
            }
        } catch (error) {
            console.warn('Home API: new-arrival query fallback triggered:', getErrorMessage(error));
        }

        const sections = (sectionsRes.data || []) as Section[];
        const productSections = (productSectionsRes.data || []) as ProductSection[];
        const allActiveProducts = (activeProductsRes.data || []) as Product[];

        const productById = new Map(allActiveProducts.map((product) => [product.id, product]));
        const sectionProductIds = new Map<string, string[]>();

        productSections.forEach((mapping) => {
            const current = sectionProductIds.get(mapping.section_id) || [];
            current.push(mapping.product_id);
            sectionProductIds.set(mapping.section_id, current);
        });

        const sectionsWithCounts = sections.map((section) => ({
            ...section,
            product_count: sectionProductIds.get(section.id)?.length || 0,
        }));

        const sectionsWithProducts: SectionWithProducts[] = sectionsWithCounts
            .map((section) => {
                const ids = sectionProductIds.get(section.id) || [];
                const sectionProducts = ids
                    .map((id) => productById.get(id))
                    .filter((product): product is Product => Boolean(product))
                    .slice(0, MAX_PRODUCTS_PER_SLIDER);

                return {
                    ...section,
                    products: sectionProducts,
                };
            })
            .filter((section) => section.products.length > 0)
            .sort((a, b) => (b.product_count || 0) - (a.product_count || 0));

        const bestSellers = bestSellerQueryData.length
            ? bestSellerQueryData
            : allActiveProducts.slice(0, MAX_PRODUCTS_PER_SLIDER);

        const bestSellerIds = new Set(bestSellers.map((product) => product.id));
        const newArrivalsSource = newArrivalQueryData.length
            ? newArrivalQueryData.filter((product) => !bestSellerIds.has(product.id))
            : allActiveProducts.filter((product) => !bestSellerIds.has(product.id));
        const newArrivals = newArrivalsSource.slice(0, MAX_PRODUCTS_PER_SLIDER);

        return NextResponse.json({
            sections: sectionsWithCounts,
            sectionsWithProducts,
            bestSellers,
            newArrivals,
        });
    } catch (error: unknown) {
        const message = getErrorMessage(error);
        console.error('Home API error:', message, error);
        return NextResponse.json(
            { error: message || 'Failed to load home data' },
            { status: 503 }
        );
    }
}
