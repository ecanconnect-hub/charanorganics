/**
 * HomePage Component - REDESIGNED
 * 
 * Premium e-commerce layout following the requested flow:
 * Hero -> Trust Badges -> Best Sellers -> Shop by Category -> Journey -> Why Choose Us -> Footer
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { useTranslations, useLocale } from '@/lib/i18n/context';
import { CategoryGrid } from '@/components/home/CategoryGrid';
import { ProductSlider } from '@/components/ui/ProductSlider';
import { motion } from 'framer-motion';
import type { Database } from '@/lib/supabase/database.types';

type Product = Database['public']['Tables']['products']['Row'] & {
  is_best_seller?: boolean;
  is_new?: boolean;
};
type Section = Database['public']['Tables']['sections']['Row'] & {
  image_url: string | null;
};
type ProductSection = Database['public']['Tables']['product_sections']['Row'];
type SectionWithProducts = Section & { products: Product[] };

export default function HomePage() {
  const t = useTranslations();
  const locale = useLocale();
  const [bestSellers, setBestSellers] = useState<Product[]>([]);
  const [newArrivals, setNewArrivals] = useState<Product[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [sectionsWithProducts, setSectionsWithProducts] = useState<SectionWithProducts[]>([]);
  const MAX_PRODUCTS_PER_SLIDER = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [sectionsRes, productSectionsRes, activeProductsRes, bsProducts, newProducts] = await Promise.all([
        supabase
          .from('sections')
          .select('*')
          .eq('is_enabled', true)
          .order('display_order'),
        supabase
          .from('product_sections')
          .select('section_id, product_id, display_order')
          .order('display_order'),
        supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .order('created_at', { ascending: false }),
        supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .eq('is_best_seller', true)
          .order('updated_at', { ascending: false })
          .limit(MAX_PRODUCTS_PER_SLIDER),
        supabase
          .from('products')
          .select('*')
          .eq('is_active', true)
          .eq('is_new', true)
          .order('created_at', { ascending: false })
          .limit(MAX_PRODUCTS_PER_SLIDER)
      ]);

      if (sectionsRes.error) throw sectionsRes.error;
      if (productSectionsRes.error) throw productSectionsRes.error;
      if (activeProductsRes.error) throw activeProductsRes.error;

      const categorySections = (sectionsRes.data || []) as Section[];
      const productSections = (productSectionsRes.data || []) as ProductSection[];
      const allActiveProducts = (activeProductsRes.data || []) as Product[];

      setSections(categorySections);

      const productById = new Map(allActiveProducts.map((product) => [product.id, product]));
      const sectionProductIds = new Map<string, string[]>();

      productSections.forEach((mapping) => {
        const current = sectionProductIds.get(mapping.section_id) || [];
        current.push(mapping.product_id);
        sectionProductIds.set(mapping.section_id, current);
      });

      const activeSections = categorySections
        .map((section) => {
          const ids = sectionProductIds.get(section.id) || [];
          const sectionProducts = ids
            .map((id) => productById.get(id))
            .filter((product): product is Product => Boolean(product))
            .slice(0, MAX_PRODUCTS_PER_SLIDER);

          return {
            ...section,
            products: sectionProducts
          };
        })
        .filter((section) => section.products.length > 0);
      setSectionsWithProducts(activeSections);

      const bestSellerProducts = bsProducts.data?.length
        ? (bsProducts.data as Product[])
        : allActiveProducts.slice(0, MAX_PRODUCTS_PER_SLIDER);
      setBestSellers(bestSellerProducts);

      const bestSellerIds = new Set(bestSellerProducts.map((p) => p.id));
      const newArrivalProducts = newProducts.data?.length
        ? (newProducts.data as Product[]).filter((p) => !bestSellerIds.has(p.id))
        : allActiveProducts.filter((p) => !bestSellerIds.has(p.id)).slice(0, MAX_PRODUCTS_PER_SLIDER);
      setNewArrivals(newArrivalProducts.slice(0, MAX_PRODUCTS_PER_SLIDER));

    } catch (error) {
      console.error('Error fetching homepage data:', error);
      if (typeof error === 'object' && error !== null) {
        console.error('Error details:', JSON.stringify(error, null, 2));
        if ('message' in error) console.error('Error message:', (error as { message?: string }).message);
        if ('hint' in error) console.error('Error hint:', (error as { hint?: string }).hint);
      }
    }
  };

  return (
    <div className="bg-background">
      {/* 1. Hero Section - Premium Flow */}
      <section className="relative min-h-[70vh] lg:min-h-[90vh] flex items-center pt-32 pb-16 lg:pt-48 lg:pb-24 overflow-hidden">
        {/* Background Decorative Blobs */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50/60 via-white to-amber-50/40 -z-10" />
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-green-200/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3 -z-10 animate-pulse" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-amber-200/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4 -z-10" />

        <div className="container mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">

            {/* Text Content */}
            <div className="lg:col-span-7 text-center lg:text-left order-2 lg:order-1">
              <motion.div
                initial={{ opacity: 0, x: -30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.8, ease: "easeOut" }}
              >
                <Link href="/shop">
                  <div className="inline-flex items-center gap-7 bg-white/80 backdrop-blur-md border border-green-200 px-4 py-2 rounded-full mb-6 shadow-sm relative cursor-pointer hover:bg-white hover:shadow-md transition-all group">
                    <span className="flex h-2 w-2 relative -translate-y-4 -ml-8 -translate-x-3 md:translate-x-0 md:-translate-y-2.5 md:-ml-1">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-70"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
                    </span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-green-700 group-hover:text-green-800">Premium Organic Essence</span>
                  </div>
                </Link>

                <h1 className="text-5xl md:text-7xl lg:text-8xl font-normal text-gray-900 mb-8 tracking-tight leading-[0.9] lg:leading-[0.85] font-serif">
                  {t('home.heroTitle')}<br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-green-500">
                    {t('home.heroHighlight')}
                  </span>
                </h1>

                <p className="text-lg md:text-xl text-gray-600 mb-12 leading-relaxed max-w-xl mx-auto lg:mx-0 font-medium">
                  {t('home.heroDescription')}
                </p>

                <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start">
                  <Link href="/shop" className="w-full sm:w-auto">
                    <Button variant="primary" size="lg" className="w-full h-16 px-12 text-sm font-bold uppercase tracking-widest shadow-2xl shadow-green-200 hover:shadow-green-300 transform hover:-translate-y-1 active:scale-95 transition-all rounded-2xl">
                      {t('home.shopNow')}
                    </Button>
                  </Link>
                  <Link href="/about" className="w-full sm:w-auto">
                    <Button variant="outline" size="lg" className="w-full h-16 px-12 text-sm font-bold uppercase tracking-widest group bg-transparent border-2 border-green-700 text-green-800 hover:bg-green-800 hover:text-white transition-all rounded-2xl transform hover:-translate-y-1 active:scale-95">
                      {t('home.discoverStory')}
                    </Button>
                  </Link>
                </div>

              </motion.div>
            </div>

            {/* Hero Image - Visual Excellence (Compact Square Layout) */}
            <div className="lg:col-span-4 lg:col-start-9 order-1 lg:order-2 mt-30 lg:mt-20">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="relative group"
              >
                <div className="relative z-10 rounded-none overflow-hidden shadow-[0_20px_50px_-15px_rgba(0,0,0,0.12)] border-8 border-white aspect-square transition-all duration-700">
                  <Image
                    src="https://res.cloudinary.com/dur6fkyoz/image/upload/v1770219742/image_6_iklsgn.jpg"
                    alt="Organic Ayurvedic Products"
                    width={800}
                    height={800}
                    sizes="(max-width: 1024px) 90vw, 35vw"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-1000"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Shop by Category (Premium Grid) */}
      <section className="py-24 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex flex-col items-center text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="flex flex-col items-center"
            >
              <span className="text-green-600 font-bold uppercase tracking-[0.3em] text-[10px] md:text-xs mb-4 block relative inline-block">
                {t('home.collections')}
                <span className="absolute -bottom-1 left-0 w-8 h-[2px] bg-green-500"></span>
              </span>
              <h2 className="text-4xl md:text-6xl font-normal text-gray-900 mb-6 tracking-tight font-serif">
                {t('home.shopByCategory')}
              </h2>
              <p className="text-lg md:text-xl text-gray-600 font-medium leading-relaxed max-w-2xl">
                {t('home.exploreRange')}
              </p>
            </motion.div>
          </div>

          <CategoryGrid sections={sections} limitMobile={true} />

          <div className="mt-16 text-center">
            <Link href="/shop" className="inline-flex items-center gap-2 group">
              <span className="text-xs font-black uppercase tracking-[0.3em] text-gray-400 group-hover:text-green-600 transition-colors">
                {t('home.viewAllCategories')}
              </span>
              <span className="w-8 h-[1px] bg-gray-300 group-hover:w-12 group-hover:bg-green-600 transition-all" />
              <span className="text-gray-400 group-hover:text-green-600 group-hover:translate-x-1 transition-all">-&gt;</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 3. Best Sellers Slider */}
      <section className="py-24 bg-white overflow-hidden">
        <ProductSlider
          title={t('home.bestsellers')}
          subtitle={t('home.bestsellersDesc')}
          products={bestSellers}
          viewAllLink="/shop?sort=bestsellers"
        />
      </section>

      {/* 4. New Arrivals Slider */}
      <section className="py-24 bg-muted/20 overflow-hidden">
        <ProductSlider
          title={t('home.newArrivals')}
          subtitle={t('home.newArrivalsDesc')}
          products={newArrivals}
          viewAllLink="/shop?sort=newest"
        />
      </section>

      {/* 5. Dynamic Category Sections */}
      {sectionsWithProducts.map((section, index) => (
        <section
          key={section.id}
          className={`py-24 overflow-hidden ${index % 2 === 0 ? 'bg-white' : 'bg-muted/10'}`}
        >
          <ProductSlider
            title={locale === 'te' ? section.title_te : section.title_en}
            subtitle={(locale === 'te' ? section.subtitle_te : section.subtitle_en) ?? undefined}
            products={section.products}
            viewAllLink={`/shop?section=${section.section_id}`}
          />
        </section>
      ))}

      {/* 6. Join Our Journey (Premium Identity Section) */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        {/* Premium Gradient Background with Noise Texture */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom right, #3f6212, #4B5563, #6B7280)' }} />
        <div
          className="absolute inset-0 opacity-[0.15] mix-blend-overlay"
          style={{
            backgroundImage: 'url(https://res.cloudinary.com/dur6fkyoz/image/upload/v1770221833/cfavicon.ico_wj8cze.png)',
            backgroundSize: '200px 200px',
            backgroundRepeat: 'repeat'
          }}
        />

        {/* Decorative Gradient Orbs */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-gradient-to-br from-green-500/20 to-transparent rounded-full blur-[150px] translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-gradient-to-tr from-amber-500/10 to-transparent rounded-full blur-[120px] -translate-x-1/4 translate-y-1/4" />

        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Left Content */}
            <div>
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8 }}
              >
                <span className="inline-block text-green-400 font-bold uppercase tracking-[0.3em] text-[10px] md:text-xs mb-6 relative">
                  Our Purpose
                  <span className="absolute -bottom-1 left-0 w-8 h-[2px] bg-green-400"></span>
                </span>
                <h2 className="text-4xl md:text-6xl lg:text-7xl font-normal mb-8 tracking-tight leading-[0.9] text-white font-serif">
                  {t('home.journeyTitle')}
                </h2>
                <p className="text-lg md:text-xl text-gray-300 mb-12 leading-relaxed font-medium">
                  {t('home.partnerDesc')}
                </p>

                {/* Feature Cards */}
                <div className="grid sm:grid-cols-2 gap-6 mb-12">
                  <div className="group p-8 rounded-[2rem] bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-green-400/30 transition-all duration-500">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-green-500/20">
                      🧴
                    </div>
                    <h4 className="text-xl font-bold mb-3 uppercase tracking-tight text-white">
                      {t('home.cosmeticsTitle')}
                    </h4>
                    <p className="text-white text-sm leading-relaxed font-medium">
                      {t('home.cosmeticsDesc')}
                    </p>
                  </div>
                  <div className="group p-8 rounded-[2rem] bg-white/5 backdrop-blur-sm border border-white/10 hover:bg-white/10 hover:border-amber-400/30 transition-all duration-500">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-3xl mb-6 group-hover:scale-110 transition-transform duration-500 shadow-lg shadow-amber-500/20">
                      🧼
                    </div>
                    <h4 className="text-xl font-bold mb-3 uppercase tracking-tight text-white">
                      {t('home.homeCareTitle')}
                    </h4>
                    <p className="text-white text-sm leading-relaxed font-medium">
                      {t('home.homeCareDesc')}
                    </p>
                  </div>
                </div>

                <Link href="/about">
                  <Button variant="outline" className="h-16 px-12 border-2 border-white/40 text-white hover:!bg-white hover:!text-gray-900 text-xs font-bold uppercase tracking-widest transition-all rounded-2xl shadow-2xl hover:shadow-white/20 hover:scale-105 active:scale-95">
                    Read Our Story
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* Right Image Section */}
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1 }}
              className="relative"
            >
              <div className="relative aspect-square rounded-[4rem] overflow-hidden border-[12px] border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] backdrop-blur-sm bg-gradient-to-br from-amber-50 via-white to-green-50">
                {/* Logo Image */}
                <div className="w-full h-full flex items-center justify-center p-4 md:p-8">
                  <Image
                    src="https://res.cloudinary.com/dur6fkyoz/image/upload/v1770221833/cfavicon.ico_wj8cze.png"
                    alt="Charan organics - Business Logo"
                    width={400}
                    height={400}
                    className="w-full h-full object-contain hover:scale-110 transition-transform duration-1000"
                  />
                </div>
                {/* Subtle Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent pointer-events-none" />
              </div>

              {/* Floating CTA Card */}
              <div className="absolute -bottom-8 -right-5 md:-right-10 bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl max-w-sm transform hover:scale-105 transition-all duration-500 border-4 border-green-100">
                <h4 className="text-gray-900 font-black text-2xl mb-3 tracking-tight leading-tight">
                  Want to learn formulation?
                </h4>
                <p className="text-gray-600 text-sm mb-6 font-medium leading-relaxed">
                  Join our small-batch workshops and discover the art of organic crafting.
                </p>
                <Link href="/contact" className="inline-flex items-center gap-3 text-green-600 text-xs font-black uppercase tracking-widest hover:gap-5 transition-all group">
                  Connect with me
                  <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 6. Why Choose Us (Premium Feature Cards) */}
      <section className="py-24 lg:py-32 bg-white">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-20">
            <span className="text-green-600 font-black uppercase tracking-[0.4em] text-[10px] md:text-xs mb-4 block underline underline-offset-8 decoration-2 decoration-green-100">Quality Assured</span>
            <h2 className="text-4xl md:text-6xl font-black text-gray-900 tracking-tighter">
              {t('home.whyChoose')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-16">
            {[
              {
                icon: '🍃',
                title: t('home.naturalTitle'),
                desc: t('home.naturalDesc'),
                bg: 'bg-green-50/50',
                border: 'border-green-100/50',
                accent: 'bg-green-600'
              },
              {
                icon: '💖',
                title: t('home.handcraftedTitle'),
                desc: t('home.handcraftedDesc'),
                bg: 'bg-amber-50/50',
                border: 'border-amber-100/50',
                accent: 'bg-amber-600'
              },
              {
                icon: '🌍',
                title: t('home.ecoTitle'),
                desc: t('home.ecoDesc'),
                bg: 'bg-blue-50/50',
                border: 'border-blue-100/50',
                accent: 'bg-blue-600'
              }
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                className={`group relative p-12 lg:p-14 rounded-[4rem] ${item.bg} border ${item.border} hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4`}
              >
                <div className="w-24 h-24 rounded-[2rem] bg-white flex items-center justify-center text-5xl shadow-sm mb-10 group-hover:scale-110 transition-transform duration-500">
                  {item.icon}
                </div>
                <h3 className="text-3xl font-bold text-gray-900 mb-6 tracking-tight uppercase leading-tight">
                  {item.title}
                </h3>
                <p className="text-gray-600 leading-relaxed font-medium text-base">
                  {item.desc}
                </p>

                {/* Decorative Anchor */}
                <div className={`absolute bottom-10 right-10 w-16 h-2 ${item.accent} rounded-full opacity-20 group-hover:opacity-100 transition-opacity duration-500`} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
