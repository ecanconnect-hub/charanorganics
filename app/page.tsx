/**
 * Home Page - Charan Organics
 * Complete homepage with all sections
 */

'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';
import { TopBar } from '@/components/layout/TopBar';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/Button';
import { useTranslations } from '@/lib/i18n/context';
import { ProductCard } from '@/components/product/ProductCard';

interface Product {
  id: string;
  product_id: string;
  title_en: string;
  title_te: string;
  description_en: string;
  current_price: number;
  mrp: number;
  image_url: string;
}

interface Section {
  id: string;
  section_id: string;
  title_en: string;
  title_te: string;
  description_en: string;
  description_te: string;
  image_url: string;
}

export default function HomePage() {
  const t = useTranslations();
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    // Fetch featured products
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true)
      .limit(3);

    // Fetch sections (categories)
    const { data: categorySections } = await supabase
      .from('sections')
      .select('*')
      .order('display_order');

    setFeaturedProducts(products || []);
    setSections(categorySections || []);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-white">
      <TopBar />
      <Header />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-50 via-white to-amber-50 py-20 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-block bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold mb-6">
              {t('home.badge')}
            </div>
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              {t('home.heroTitle')} <span className="text-green-600">{t('home.heroHighlight')}</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-600 mb-8 leading-relaxed">
              {t('home.heroDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/shop">
                <Button variant="primary" size="lg">
                  {t('home.shopNow')}
                </Button>
              </Link>
              <Link href="/about">
                <Button variant="outline" size="lg">
                  {t('home.discoverStory')}
                </Button>
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-3 gap-6 mt-16 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-4xl mb-2">🌱</div>
                <p className="font-semibold text-gray-900">{t('home.organic')}</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">🐇</div>
                <p className="font-semibold text-gray-900">{t('home.crueltyFree')}</p>
              </div>
              <div className="text-center">
                <div className="text-4xl mb-2">🧴</div>
                <p className="font-semibold text-gray-900">{t('home.handmade')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              {t('home.aboutTitle')}
            </h2>
            <p className="text-lg text-gray-600 leading-relaxed">
              {t('home.aboutDescription')}
            </p>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('home.bestsellers')}
            </h2>
            <p className="text-lg text-gray-600">{t('home.bestsellersDesc')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/shop">
              <Button variant="outline" size="lg">
                {t('home.viewAll')} →
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('home.shopByCategory')}
            </h2>
            <p className="text-lg text-gray-600">{t('home.exploreRange')}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {sections.map((section) => (
              <Link
                key={section.id}
                href={`/shop?category=${section.section_id}`}
                className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
              >
                {section.image_url && (
                  <img
                    src={section.image_url}
                    alt={section.title_en}
                    className="w-full h-64 object-cover group-hover:scale-110 transition-transform duration-300"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <h3 className="text-2xl font-bold mb-2">{section.title_en}</h3>
                  <p className="text-sm opacity-90 mb-4">{section.description_en}</p>
                  <span className="text-sm font-semibold">{t('home.explore')} →</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Join Our Journey */}
      <section className="py-20 bg-gradient-to-br from-amber-50 to-green-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {t('home.journeyTitle')}
            </h2>
            <p className="text-xl text-gray-700">{t('home.journeySubtitle')}</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {/* Left Side: Partner Info */}
            <div className="bg-white p-8 rounded-2xl shadow-xl">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                {t('home.partnerTitle')}
              </h3>
              <p className="text-gray-700 mb-6">
                {t('home.partnerDesc')}
              </p>

              <h4 className="font-bold text-gray-900 mb-4">{t('home.offeringsTitle')}</h4>
              <ul className="space-y-4 mb-6">
                <li className="flex gap-3">
                  <span className="text-2xl">🌿</span>
                  <div>
                    <strong className="text-green-800 block">{t('home.cosmeticsTitle')}</strong>
                    <span className="text-gray-600 text-sm">{t('home.cosmeticsDesc')}</span>
                  </div>
                </li>
                <li className="flex gap-3">
                  <span className="text-2xl">🧺</span>
                  <div>
                    <strong className="text-amber-800 block">{t('home.homeCareTitle')}</strong>
                    <span className="text-gray-600 text-sm">{t('home.homeCareDesc')}</span>
                  </div>
                </li>
              </ul>

              <div className="bg-green-50 p-6 rounded-xl border border-green-200">
                <p className="font-bold text-green-800 mb-2">
                  🎁 {t('home.specialOffer')}
                </p>
                <p className="text-green-900 font-medium">
                  {t('home.freeShipping')}
                </p>
              </div>
            </div>

            {/* Right Side: Actions */}
            <div className="flex flex-col gap-6">
              <div className="bg-gradient-to-br from-gray-900 to-gray-800 text-white p-8 rounded-2xl shadow-xl">
                <h4 className="text-2xl font-bold mb-4">{t('home.shopNowTitle')}</h4>
                <p className="mb-6 text-gray-200">
                  {t('home.shopNowDesc')}
                </p>
                <a
                  href="https://wa.me/918247838125"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 bg-white text-green-700 font-bold py-4 px-8 rounded-full shadow-lg hover:scale-105 transition-all"
                >
                  <span>{t('home.chatWhatsApp')}</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
                  </svg>
                </a>
              </div>

              <div className="bg-white p-8 rounded-2xl border-2 border-amber-100 shadow-xl">
                <h4 className="text-xl font-bold text-gray-900 mb-4">
                  {t('home.learnWithMe')}
                </h4>
                <p className="text-gray-700 mb-4">
                  {t('home.workshopDesc')}
                </p>
                <span className="text-amber-600 font-bold flex items-center gap-2">
                  {t('home.learnMore')} <span className="text-xl">→</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-white mb-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              {t('home.whyChoose')}
            </h2>
            <div className="h-1 w-24 bg-green-500 mx-auto rounded-full"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="text-center p-8 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-2xl transition-all">
              <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                🌱
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {t('home.naturalTitle')}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {t('home.naturalDesc')}
              </p>
            </div>

            <div className="text-center p-8 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-2xl transition-all">
              <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                ❤️
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {t('home.handcraftedTitle')}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {t('home.handcraftedDesc')}
              </p>
            </div>

            <div className="text-center p-8 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-2xl transition-all">
              <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                🌍
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                {t('home.ecoTitle')}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {t('home.ecoDesc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
