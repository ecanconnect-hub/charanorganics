import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { ensureSupabaseDnsRouting } from '@/lib/server/ensureSupabaseDnsRouting';

type Product = Database['public']['Tables']['products']['Row'] & {
    is_best_seller?: boolean;
    is_new?: boolean;
};
type Section = Database['public']['Tables']['sections']['Row'];
type ProductSection = Database['public']['Tables']['product_sections']['Row'];
type ProductWithVariantMeta = Product & {
    has_variants?: boolean;
    variant_min_price?: number | null;
    variant_max_price?: number | null;
};

const TYPO_REPLACEMENTS: Record<string, string> = {
    hiar: 'hair',
    har: 'hair',
    sjopas: 'soaps',
    sope: 'soap',
    sop: 'soap',
    powdr: 'powder',
    powerds: 'powders',
    poudar: 'powder',
    crems: 'creams',
    crem: 'cream',
    oyl: 'oil',
    oiles: 'oils',
    fash: 'face',
    waash: 'wash',
};

const INTENT_RULES: Array<{ match: string[]; expand: string[] }> = [
    { match: ['hair', 'oil'], expand: ['hair oil', 'oils', 'amla', 'bhringraj', 'rosemary', 'hibiscus'] },
    { match: ['hair', 'powder'], expand: ['hair powder', 'henna', 'shikakai', 'reetha', 'amla', 'bhringraj'] },
    { match: ['face', 'wash'], expand: ['face wash', 'cleanser', 'soap', 'multani mitti', 'orange peel', 'neem'] },
    { match: ['face', 'cream'], expand: ['face cream', 'skin care', 'aloe vera', 'sandal', 'rose'] },
    { match: ['skin', 'soap'], expand: ['skin soap', 'soap', 'neem', 'turmeric', 'ubtan'] },
    { match: ['body', 'wash'], expand: ['body wash', 'soap', 'cleanser', 'skin care'] },
];

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables for shop products API');
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

function normalizeQuery(input: string): string {
    return input
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

function singularPluralVariants(term: string): string[] {
    if (term.length < 3) return [term];
    if (term.endsWith('s')) return [term, term.slice(0, -1)];
    return [term, `${term}s`];
}

function buildSmartSearchTerms(rawQuery: string): string[] {
    const normalized = normalizeQuery(rawQuery);
    if (!normalized) return [];

    const rawWords = normalized.split(' ').filter((word) => word.length > 1);
    const correctedWords = rawWords.map((word) => TYPO_REPLACEMENTS[word] || word);
    const correctedPhrase = correctedWords.join(' ');

    const terms = new Set<string>();
    terms.add(normalized);
    terms.add(correctedPhrase);

    correctedWords.forEach((word) => {
        singularPluralVariants(word).forEach((variant) => terms.add(variant));
    });

    INTENT_RULES.forEach((rule) => {
        const matched = rule.match.every((token) => correctedWords.includes(token) || correctedPhrase.includes(token));
        if (matched) {
            rule.expand.forEach((term) => terms.add(term));
        }
    });

    return [...terms].filter((term) => term.length > 1).slice(0, 16);
}

function parseNumber(value: string | null): number | null {
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

function parseLimit(value: string | null): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return 50;
    }
    return Math.min(Math.floor(parsed), 200);
}

function sanitizeSort(value: string | null): 'default' | 'price_asc' | 'price_desc' | 'newest' {
    if (value === 'price_asc' || value === 'price_desc' || value === 'newest') {
        return value;
    }
    return 'default';
}

function toFiniteNumber(value: unknown): number | null {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value;
    }

    if (typeof value === 'string' && value.trim() !== '') {
        const parsed = Number(value);
        if (Number.isFinite(parsed)) {
            return parsed;
        }
    }

    return null;
}

async function attachVariantMeta(items: Product[]): Promise<ProductWithVariantMeta[]> {
    const ids = items.map((product) => product.id).filter((id): id is string => Boolean(id));
    if (ids.length === 0) return items as ProductWithVariantMeta[];

    try {
        const { data: variants, error } = await supabase
            .from('product_variants')
            .select('product_id, price')
            .in('product_id', ids)
            .eq('enabled', true);

        if (error || !variants) {
            return items as ProductWithVariantMeta[];
        }

        const ranges = new Map<string, { min: number | null; max: number | null; has: boolean }>();

        (variants as Array<{ product_id: string; price: unknown }>).forEach((variant) => {
            if (!variant?.product_id) return;
            const price = toFiniteNumber(variant.price);
            const current = ranges.get(variant.product_id) || { min: null, max: null, has: false };

            current.has = true;
            if (price !== null) {
                current.min = current.min === null ? price : Math.min(current.min, price);
                current.max = current.max === null ? price : Math.max(current.max, price);
            }

            ranges.set(variant.product_id, current);
        });

        return items.map((product) => {
            const range = ranges.get(product.id);
            return {
                ...product,
                has_variants: range?.has ?? false,
                variant_min_price: range?.min ?? null,
                variant_max_price: range?.max ?? null,
            };
        });
    } catch {
        return items as ProductWithVariantMeta[];
    }
}

export async function GET(req: NextRequest) {
    try {
        const params = req.nextUrl.searchParams;
        const sectionsParam = params.get('section');
        const sections = sectionsParam?.split(',').map((item) => item.trim()).filter(Boolean) || [];
        const minPrice = parseNumber(params.get('minPrice'));
        const maxPrice = parseNumber(params.get('maxPrice'));
        const sort = sanitizeSort(params.get('sort'));
        const search = params.get('q')?.trim() || '';
        const limit = parseLimit(params.get('limit'));
        const smartSearchTerms = search ? buildSmartSearchTerms(search) : [];

        let sectionProductIds: string[] | null = null;
        let query = supabase
            .from('products')
            .select('*', { count: 'exact' })
            .eq('is_active', true);

        if (sections.length > 0) {
            const { data: sectionData, error: sectionError } = await supabase
                .from('sections')
                .select('id, section_id')
                .in('section_id', sections);

            if (sectionError) {
                throw sectionError;
            }

            if (!sectionData || sectionData.length === 0) {
                const { data: recommended } = await supabase
                    .from('products')
                    .select('*')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false })
                    .limit(6);

                return NextResponse.json({
                    products: [],
                    totalCount: 0,
                    recommendedProducts: (recommended || []) as Product[],
                });
            }

            const sectionUUIDs = (sectionData as Pick<Section, 'id' | 'section_id'>[]).map((item) => item.id);

            const { data: sectionProducts, error: mappingError } = await supabase
                .from('product_sections')
                .select('product_id')
                .in('section_id', sectionUUIDs);

            if (mappingError) {
                throw mappingError;
            }

            if (!sectionProducts || sectionProducts.length === 0) {
                const { data: recommended } = await supabase
                    .from('products')
                    .select('*')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false })
                    .limit(6);

                return NextResponse.json({
                    products: [],
                    totalCount: 0,
                    recommendedProducts: (recommended || []) as Product[],
                });
            }

            sectionProductIds = [...new Set((sectionProducts as Pick<ProductSection, 'product_id'>[]).map((item) => item.product_id))];
            query = query.in('id', sectionProductIds);
        }

        if (minPrice !== null) {
            query = query.gte('current_price', minPrice);
        }

        if (maxPrice !== null) {
            query = query.lte('current_price', maxPrice);
        }

        if (smartSearchTerms.length > 0) {
            const searchFields = [
                'title_en',
                'title_te',
                'description_en',
                'description_te',
                'specifications_en',
                'usage_en',
                'additional_info_en',
            ];

            const searchOr = smartSearchTerms
                .flatMap((term) => searchFields.map((field) => `${field}.ilike.%${term}%`))
                .join(',');

            query = query.or(searchOr);
        }

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
                break;
        }

        query = query.limit(limit);

        const { data, count, error } = await query;
        if (error) {
            throw error;
        }

        let products = (data || []) as Product[];
        let totalCount = count || 0;
        let recommendedProducts: Product[] = [];

        if (products.length === 0 && smartSearchTerms.length > 0) {
            const fuzzyQueries = smartSearchTerms.slice(0, 8);
            const fuzzyResponses = await Promise.all(
                fuzzyQueries.map((term) =>
                    supabase.rpc(
                        'search_products_fuzzy' as never,
                        { p_query: term, p_limit: 180 } as never
                    )
                )
            );

            const fuzzyMap = new Map<string, Product>();
            fuzzyResponses.forEach((response) => {
                if (response.error || !Array.isArray(response.data)) return;
                (response.data as Product[]).forEach((item) => {
                    if (item?.id && item?.is_active && !fuzzyMap.has(item.id)) {
                        fuzzyMap.set(item.id, item);
                    }
                });
            });

            if (fuzzyMap.size > 0) {
                let fuzzyProducts = [...fuzzyMap.values()];

                if (sectionProductIds && sectionProductIds.length > 0) {
                    const allowedIds = new Set(sectionProductIds);
                    fuzzyProducts = fuzzyProducts.filter((item) => allowedIds.has(item.id));
                }

                if (minPrice !== null) {
                    fuzzyProducts = fuzzyProducts.filter((item) => (item.current_price ?? 0) >= minPrice);
                }

                if (maxPrice !== null) {
                    fuzzyProducts = fuzzyProducts.filter((item) => (item.current_price ?? 0) <= maxPrice);
                }

                switch (sort) {
                    case 'price_asc':
                        fuzzyProducts.sort((a, b) => (a.current_price ?? 0) - (b.current_price ?? 0));
                        break;
                    case 'price_desc':
                        fuzzyProducts.sort((a, b) => (b.current_price ?? 0) - (a.current_price ?? 0));
                        break;
                    case 'newest':
                    default:
                        fuzzyProducts.sort((a, b) => {
                            const aTs = a.created_at ? new Date(a.created_at).getTime() : 0;
                            const bTs = b.created_at ? new Date(b.created_at).getTime() : 0;
                            return bTs - aTs;
                        });
                        break;
                }

                totalCount = fuzzyProducts.length;
                products = fuzzyProducts.slice(0, limit);
            }
        }

        if (products.length === 0) {
            const { data: recommended } = await supabase
                .from('products')
                .select('*')
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(6);
            recommendedProducts = (recommended || []) as Product[];
        }

        const [productsWithMeta, recommendedWithMeta] = await Promise.all([
            attachVariantMeta(products),
            attachVariantMeta(recommendedProducts),
        ]);

        return NextResponse.json({
            products: productsWithMeta,
            totalCount,
            recommendedProducts: recommendedWithMeta,
        });
    } catch (error: unknown) {
        const message = getErrorMessage(error);
        console.error('Shop products API error:', message, error);
        return NextResponse.json(
            { error: 'Failed to load products' },
            { status: 503 }
        );
    }
}
