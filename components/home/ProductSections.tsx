/**
 * Product Sections Component
 * 
 * Displays admin-controlled dynamic product sections
 */

import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { ProductCard } from '@/components/product/ProductCard';
import { Button } from '@/components/ui/Button';

export async function ProductSections() {
    // Use default locale for now (can be made dynamic later)
    const locale = 'en';

    // Fetch enabled sections ordered by display_order
    const { data: sections } = await (supabase
        .from('sections' as any) as any)
        .select('*')
        .eq('is_enabled', true)
        .order('display_order', { ascending: true });

    if (!sections || (sections as any[]).length === 0) {
        return null;
    }

    // Fetch products for all sections sequentially or in parallel
    const sectionsWithProducts = await Promise.all(
        (sections as any[]).map(async (section) => {
            const { data: productSections } = await (supabase
                .from('product_sections' as any) as any)
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
                .eq('section_id', (section as any).id)
                .order('display_order', { ascending: true })
                .limit(8);

            const products = (productSections as any[])
                ?.map(ps => ps.product)
                .filter(p => p && p.is_active) || [];

            return {
                ...section,
                products
            };
        })
    );

    return (
        <div className="section-padding bg-[rgb(var(--muted))]">
            {sectionsWithProducts.map((section) => {
                const products = section.products;
                if (products.length === 0) return null;

                const title = locale === 'en' ? section.title_en : section.title_te;
                const subtitle = locale === 'en' ? section.subtitle_en : section.subtitle_te;
                const description = locale === 'en' ? section.description_en : section.description_te;

                return (
                    <div key={section.id} className="container mx-auto px-4 mb-16 last:mb-0">
                        {/* Section Header */}
                        <div className="text-center mb-12">
                            <h2 className="text-3xl md:text-4xl font-bold text-[rgb(var(--foreground))] mb-4">
                                {title}
                            </h2>
                            {subtitle && (
                                <p className="text-xl text-[rgb(var(--primary))] font-medium mb-2">
                                    {subtitle}
                                </p>
                            )}
                            {description && (
                                <p className="text-gray-600 max-w-2xl mx-auto">
                                    {description}
                                </p>
                            )}
                        </div>

                        {/* Products Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                            {products.map((product: any) => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>

                        {/* View All Button */}
                        <div className="text-center">
                            <Link href={`/shop?section=${section.section_id}`}>
                                <Button variant="outline" size="lg">
                                    View All in {title}
                                    <svg className="w-5 h-5 ml-2" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                                        <path d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                                    </svg>
                                </Button>
                            </Link>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
