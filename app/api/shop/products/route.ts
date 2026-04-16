import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/database.types';
import { NO_STORE_HEADERS, PUBLIC_SEARCH_CACHE_HEADERS } from '@/lib/server/cacheHeaders';
import { ensureSupabaseDnsRouting } from '@/lib/server/ensureSupabaseDnsRouting';
import { withApiProtection } from '@/lib/middleware/withApiProtection';

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
    heir: 'hair',
    sjopas: 'soaps',
    sope: 'soap',
    sop: 'soap',
    sops: 'soaps',
    powdr: 'powder',
    powerds: 'powders',
    poudar: 'powder',
    crems: 'creams',
    crem: 'cream',
    shampo: 'shampoo',
    shamppo: 'shampoo',
    shamoo: 'shampoo',
    conditoner: 'conditioner',
    condisioner: 'conditioner',
    serom: 'serum',
    sirum: 'serum',
    oyl: 'oil',
    oiles: 'oils',
    fash: 'face',
    waash: 'wash',
    multhani: 'multani',
    manjista: 'manjistha',
    bidal: 'bridal',
    tamato: 'tomato',
    colou: 'colour',
};

const INTENT_RULES: Array<{ match: string[]; expand: string[] }> = [
    { match: ['hair', 'oil'], expand: ['hair oil', 'oils', 'amla', 'bhringraj', 'rosemary', 'hibiscus'] },
    { match: ['hair', 'powder'], expand: ['hair powder', 'henna', 'shikakai', 'reetha', 'amla', 'bhringraj'] },
    { match: ['hair', 'serum'], expand: ['hair serum', 'hair regrowth', 'baldness', 'rosemary', 'bhringraj', 'amla'] },
    { match: ['face', 'wash'], expand: ['face wash', 'cleanser', 'soap', 'multani mitti', 'orange peel', 'neem'] },
    { match: ['face', 'cream'], expand: ['face cream', 'skin care', 'aloe vera', 'sandal', 'rose'] },
    { match: ['skin', 'soap'], expand: ['skin soap', 'soap', 'neem', 'turmeric', 'ubtan'] },
    { match: ['body', 'wash'], expand: ['body wash', 'soap', 'cleanser', 'skin care'] },
];

const COMPOUND_SUFFIXES = [
    'shampoo',
    'conditioner',
    'powder',
    'extract',
    'colour',
    'color',
    'serum',
    'cream',
    'soaps',
    'soap',
    'oils',
    'oil',
    'base',
    'gel',
    'wax',
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

function compactQuery(input: string): string {
    return normalizeQuery(input).replace(/\s+/g, '');
}

function splitCompoundCatalogWord(word: string): string[] {
    const normalized = normalizeQuery(word);
    if (!normalized || normalized.includes(' ')) {
        return normalized ? [normalized] : [];
    }

    for (const suffix of COMPOUND_SUFFIXES) {
        if (normalized.length > suffix.length + 2 && normalized.endsWith(suffix)) {
            const prefix = normalized.slice(0, -suffix.length);
            if (prefix.length > 1) {
                return [prefix, suffix];
            }
        }
    }

    return [normalized];
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
    const expandedWords = correctedWords.flatMap((word) => splitCompoundCatalogWord(word));
    const expandedPhrase = expandedWords.join(' ');

    const terms = new Set<string>();
    terms.add(normalized);
    terms.add(correctedPhrase);
    terms.add(compactQuery(normalized));
    terms.add(compactQuery(correctedPhrase));

    if (expandedPhrase) {
        terms.add(expandedPhrase);
        terms.add(compactQuery(expandedPhrase));
    }

    expandedWords.forEach((word) => {
        singularPluralVariants(word).forEach((variant) => terms.add(variant));
    });

    for (let index = 0; index < expandedWords.length - 1; index += 1) {
        terms.add(`${expandedWords[index]} ${expandedWords[index + 1]}`);
    }

    INTENT_RULES.forEach((rule) => {
        const matched = rule.match.every((token) => correctedWords.includes(token) || correctedPhrase.includes(token));
        if (matched) {
            rule.expand.forEach((term) => terms.add(term));
        }
    });

    return [...terms].filter((term) => term.length > 1).slice(0, 8);
}

function normalizeField(value: string | null | undefined): string {
    return normalizeQuery(value || '');
}

function getCreatedAtTimestamp(product: Product): number {
    return product.created_at ? new Date(product.created_at).getTime() : 0;
}

function scoreProductMatch(
    product: Product,
    rawQuery: string,
    smartTerms: string[],
    fuzzyRankMap: Map<string, number>
): number {
    const normalizedQuery = normalizeQuery(rawQuery);
    if (!normalizedQuery) return 0;

    const compactNormalizedQuery = compactQuery(normalizedQuery);
    const titleEn = normalizeField(product.title_en);
    const titleTe = normalizeField(product.title_te);
    const compactTitleEn = compactQuery(titleEn);
    const compactTitleTe = compactQuery(titleTe);
    const queryWords = normalizedQuery.split(' ').filter(Boolean);
    const supplementaryText = [
        product.description_en,
        product.description_te,
        product.specifications_en,
        product.specifications_te,
        product.usage_en,
        product.usage_te,
        (product as Product & { additional_info_en?: string | null }).additional_info_en,
    ]
        .map((value) => normalizeField(value))
        .join(' ');

    let score = 0;

    if (titleEn === normalizedQuery || titleTe === normalizedQuery) {
        score += 1600;
    }

    if (compactNormalizedQuery && (compactTitleEn === compactNormalizedQuery || compactTitleTe === compactNormalizedQuery)) {
        score += 1500;
    }

    if (titleEn.includes(normalizedQuery) || titleTe.includes(normalizedQuery)) {
        score += 900;
    }

    if (
        compactNormalizedQuery
        && (compactTitleEn.includes(compactNormalizedQuery) || compactTitleTe.includes(compactNormalizedQuery))
    ) {
        score += 780;
    }

    if (
        queryWords.length > 1
        && queryWords.every((word) => titleEn.includes(word) || titleTe.includes(word))
    ) {
        score += 620;
    }

    queryWords.forEach((word) => {
        if (!word) return;

        if (titleEn.split(' ').includes(word) || titleTe.split(' ').includes(word)) {
            score += 120;
        } else if (titleEn.includes(word) || titleTe.includes(word)) {
            score += 85;
        } else if (supplementaryText.includes(word)) {
            score += 18;
        }
    });

    smartTerms.forEach((term, index) => {
        if (!term) return;

        const termBoost = Math.max(150 - index * 7, 35);
        const compactTerm = compactQuery(term);

        if (
            titleEn.includes(term)
            || titleTe.includes(term)
            || (compactTerm && (compactTitleEn.includes(compactTerm) || compactTitleTe.includes(compactTerm)))
        ) {
            score += termBoost;
        } else if (supplementaryText.includes(term)) {
            score += Math.max(34 - index * 2, 8);
        }
    });

    const fuzzyRank = fuzzyRankMap.get(product.id);
    if (typeof fuzzyRank === 'number') {
        score += Math.max(260 - fuzzyRank * 4, 30);
    }

    return score;
}

async function fetchFuzzyMatches(smartSearchTerms: string[]): Promise<{
    fuzzyMap: Map<string, Product>;
    fuzzyRankMap: Map<string, number>;
}> {
    const fuzzyMap = new Map<string, Product>();
    const fuzzyRankMap = new Map<string, number>();
    const fuzzyQueries = smartSearchTerms.slice(0, 3);

    if (fuzzyQueries.length === 0) {
        return { fuzzyMap, fuzzyRankMap };
    }

    const responses = await Promise.allSettled(
        fuzzyQueries.map((term) =>
            supabase.rpc(
                'search_products_fuzzy' as never,
                { p_query: term, p_limit: 80 } as never
            )
        )
    );

    responses.forEach((result, queryIndex) => {
        if (result.status !== 'fulfilled') return;

        const response = result.value;
        if (response.error || !Array.isArray(response.data)) return;

        (response.data as Product[]).forEach((item, itemIndex) => {
            if (!item?.id || !item?.is_active) return;

            if (!fuzzyMap.has(item.id)) {
                fuzzyMap.set(item.id, item);
            }

            const rankValue = queryIndex * 50 + itemIndex;
            const existingRank = fuzzyRankMap.get(item.id);
            if (existingRank === undefined || rankValue < existingRank) {
                fuzzyRankMap.set(item.id, rankValue);
            }
        });
    });

    return { fuzzyMap, fuzzyRankMap };
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
    return Math.min(Math.floor(parsed), 100);
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

async function handleGET(req: NextRequest) {
    try {
        const params = req.nextUrl.searchParams;
        const sectionsParam = params.get('section');
        const sections = sectionsParam?.split(',').map((item) => item.trim()).filter(Boolean) || [];
        const minPrice = parseNumber(params.get('minPrice'));
        const maxPrice = parseNumber(params.get('maxPrice'));
        const sort = sanitizeSort(params.get('sort'));
        const search = (params.get('q')?.trim() || '').slice(0, 80);
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

                return NextResponse.json(
                    {
                        products: [],
                        totalCount: 0,
                        recommendedProducts: (recommended || []) as Product[],
                    },
                    { headers: PUBLIC_SEARCH_CACHE_HEADERS }
                );
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

                return NextResponse.json(
                    {
                        products: [],
                        totalCount: 0,
                        recommendedProducts: (recommended || []) as Product[],
                    },
                    { headers: PUBLIC_SEARCH_CACHE_HEADERS }
                );
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
                'product_id',
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

        const fetchLimit = smartSearchTerms.length > 0 ? Math.max(limit, 120) : limit;
        query = query.limit(fetchLimit);

        const { data, count, error } = await query;
        if (error) {
            throw error;
        }

        let products = (data || []) as Product[];
        let totalCount = count || 0;
        let recommendedProducts: Product[] = [];

        if (smartSearchTerms.length > 0) {
            const { fuzzyMap, fuzzyRankMap } = await fetchFuzzyMatches(smartSearchTerms);
            const mergedMap = new Map<string, Product>();

            products.forEach((item) => {
                if (item?.id) {
                    mergedMap.set(item.id, item);
                }
            });

            fuzzyMap.forEach((item, id) => {
                mergedMap.set(id, item);
            });

            let mergedProducts = [...mergedMap.values()];

            if (sectionProductIds && sectionProductIds.length > 0) {
                const allowedIds = new Set(sectionProductIds);
                mergedProducts = mergedProducts.filter((item) => allowedIds.has(item.id));
            }

            if (minPrice !== null) {
                mergedProducts = mergedProducts.filter((item) => (item.current_price ?? 0) >= minPrice);
            }

            if (maxPrice !== null) {
                mergedProducts = mergedProducts.filter((item) => (item.current_price ?? 0) <= maxPrice);
            }

            switch (sort) {
                case 'price_asc':
                    mergedProducts.sort((a, b) => (a.current_price ?? 0) - (b.current_price ?? 0));
                    break;
                case 'price_desc':
                    mergedProducts.sort((a, b) => (b.current_price ?? 0) - (a.current_price ?? 0));
                    break;
                case 'newest':
                    mergedProducts.sort((a, b) => getCreatedAtTimestamp(b) - getCreatedAtTimestamp(a));
                    break;
                default:
                    mergedProducts.sort((a, b) => {
                        const scoreDifference =
                            scoreProductMatch(b, search, smartSearchTerms, fuzzyRankMap)
                            - scoreProductMatch(a, search, smartSearchTerms, fuzzyRankMap);

                        if (scoreDifference !== 0) {
                            return scoreDifference;
                        }

                        return getCreatedAtTimestamp(b) - getCreatedAtTimestamp(a);
                    });
                    break;
            }

            totalCount = mergedProducts.length;
            products = mergedProducts.slice(0, limit);
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

        return NextResponse.json(
            {
                products: productsWithMeta,
                totalCount,
                recommendedProducts: recommendedWithMeta,
            },
            { headers: PUBLIC_SEARCH_CACHE_HEADERS }
        );
    } catch (error: unknown) {
        const message = getErrorMessage(error);
        console.error('Shop products API error:', message, error);
        return NextResponse.json(
            { error: 'Failed to load products' },
            { status: 503, headers: NO_STORE_HEADERS }
        );
    }
}

// Protected export: sliding-window (middleware) + Supabase rate limit + search abuse guard
export const GET = withApiProtection(handleGET, {
    searchGuard: { searchParam: 'q', maxQueryLength: 80 },
});
