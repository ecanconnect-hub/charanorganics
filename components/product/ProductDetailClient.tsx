/**
 * Product Detail Client Component - REFINED REDESIGN
 * 
 * Holistic display of product details with variant support, reviews, and interactive elements.
 * Improved layout for industry-standard premium feel.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useLocale, useTranslations } from '@/lib/i18n/context';
import { resolveLocalizedText } from '@/lib/i18n/localized';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth/context';
import { useCart } from '@/lib/cart-context';
import { supabase } from '@/lib/supabase/client';
import { ProductCard } from '@/components/product/ProductCard';
import { SHIPPING_POLICY_LINES, formatWeight, getProductMeasurement, measurementToWeightKg } from '@/lib/utils/shipping';
import toast from 'react-hot-toast';

interface ProductDetailClientProps {
    product: any;
}

type Tab = 'description' | 'ingredients' | 'reviews' | 'shipping' | null;

export function ProductDetailClient({ product }: ProductDetailClientProps) {
    const { addItem } = useCart();
    const router = useRouter();
    const locale = useLocale();
    const { user } = useAuth();
    const userId = user?.id;
    const t = useTranslations('product');
    const ct = useTranslations('common');

    // States
    const [quantity, setQuantity] = useState(1);
    const [adding, setAdding] = useState(false);
    const [activeTab, setActiveTab] = useState<Tab>(null);
    const [showFullDesc, setShowFullDesc] = useState(false);
    const [variants, setVariants] = useState<any[]>([]);
    const [selectedVariant, setSelectedVariant] = useState<any>(null);
    const [reviews, setReviews] = useState<any[]>([]);
    const [loadingReviews, setLoadingReviews] = useState(true);
    const [isWishlisted, setIsWishlisted] = useState(false);
    const [wishlistLoading, setWishlistLoading] = useState(false);
    const [hasPurchased, setHasPurchased] = useState(false);

    const title = locale === 'en'
        ? product.title_en
        : resolveLocalizedText(product.title_en, product.title_te);
    const description = locale === 'en' ? product.description_en : product.description_te;
    const additionalInfo = locale === 'en' ? product.additional_info_en : product.additional_info_te;
    const specifications = locale === 'en' ? product.specifications_en : product.specifications_te;
    const usage = locale === 'en' ? product.usage_en : product.usage_te;

    // Derived prices
    const parsePrice = (value: unknown): number => {
        const parsed = typeof value === 'number' ? value : Number(value);
        return Number.isFinite(parsed) ? parsed : 0;
    };
    const displayedPrice = selectedVariant ? parsePrice(selectedVariant.price) : parsePrice(product.current_price);
    const sourceMrp = selectedVariant ? parsePrice(selectedVariant.mrp ?? selectedVariant.price) : parsePrice(product.mrp);
    const fallbackMrp = displayedPrice > 0 ? displayedPrice / 0.9 : displayedPrice;
    const displayedMrp = sourceMrp > displayedPrice ? sourceMrp : fallbackMrp;
    const displayedShipping = selectedVariant ? (selectedVariant.shipping_charge ?? product.shipping_charges) : product.shipping_charges;
    const discount = displayedMrp > displayedPrice && displayedPrice > 0
        ? Math.max(1, Math.round(((displayedMrp - displayedPrice) / displayedMrp) * 100))
        : 0;
    const selectedMeasurement = getProductMeasurement(product, selectedVariant);
    const selectedWeightLabel = selectedMeasurement
        ? `${selectedMeasurement.value} ${selectedMeasurement.unit}`
        : null;
    const selectedWeightKg = measurementToWeightKg(selectedMeasurement);

    const fetchData = useCallback(async () => {
        // Fetch Variants
        try {
            const { data: variantData, error: variantError } = await (supabase
                .from('product_variants' as any) as any)
                .select('*')
                .eq('product_id', product.id)
                .eq('enabled', true)
                .order('price', { ascending: true });

            if (!variantError && variantData && variantData.length > 0) {
                setVariants(variantData);
            }
        } catch (error) {
            console.log('Product variants feature not available');
        }

        // Fetch Wishlist Status
        if (userId) {
            try {
                const { data, error } = await (supabase
                    .from('wishlist') as any)
                    .select('id')
                    .eq('user_id', userId)
                    .eq('product_id', product.id)
                    .single();

                if (data && !error) setIsWishlisted(true);
            } catch (err) {
                console.log('Wishlist status check error');
            }

            // Check if user has purchased and received this product (delivered)
            try {
                const { data: purchaseData, error: purchaseError } = await (supabase
                    .from('order_items' as any) as any)
                    .select('id, orders!inner(status, user_id)')
                    .eq('product_id', product.id)
                    .eq('orders.user_id', userId)
                    .eq('orders.status', 'delivered')
                    .limit(1);

                if (purchaseData && purchaseData.length > 0) {
                    setHasPurchased(true);
                }
            } catch (err) {
                console.log('Purchase verification error');
            }
        }

        // Fetch Reviews
        setLoadingReviews(true);
        try {
            const { data: reviewData, error: reviewError } = await (supabase
                .from('reviews' as any) as any)
                .select('*, profiles(full_name)')
                .eq('product_id', product.id)
                .order('created_at', { ascending: false });

            if (!reviewError && reviewData) {
                setReviews(reviewData);
            }
        } catch (error) {
            console.log('Reviews feature not available');
        } finally {
            setLoadingReviews(false);
        }
    }, [product.id, userId]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const toggleWishlist = async () => {
        if (!user) {
            toast.error('Login to use wishlist');
            return;
        }

        setWishlistLoading(true);
        try {
            if (isWishlisted) {
                const { error } = await (supabase
                    .from('wishlist') as any)
                    .delete()
                    .eq('user_id', user.id)
                    .eq('product_id', product.id);

                if (!error) {
                    setIsWishlisted(false);
                    toast.success('Removed from wishlist');
                }
            } else {
                const { error } = await (supabase
                    .from('wishlist') as any)
                    .insert({ user_id: user.id, product_id: product.id });

                if (!error) {
                    setIsWishlisted(true);
                    toast.success('Added to wishlist');
                }
            }
        } catch (err) {
            toast.error('Failed to update wishlist');
        } finally {
            setWishlistLoading(false);
        }
    };

    const handleAddToCart = async () => {
        if (variants.length > 0 && !selectedVariant) {
            toast.error('Please select a variant first');
            return;
        }

        setAdding(true);
        try {
            await addItem(product.id, selectedVariant?.id, quantity);
            toast.success('Added to cart!');
        } catch (error) {
            console.error('Error adding to cart:', error);
            toast.error('Failed to add to cart');
        } finally {
            setAdding(false);
        }
    };

    const handleBuyNow = async () => {
        if (variants.length > 0 && !selectedVariant) {
            toast.error('Please select a variant first');
            return;
        }

        setAdding(true);
        try {
            await addItem(product.id, selectedVariant?.id, quantity);
            router.push('/checkout');
        } catch (error) {
            console.error('Error buying now:', error);
            toast.error('Failed to start checkout');
        } finally {
            setAdding(false);
        }
    };

    return (
        <div className="container mx-auto px-4 md:px-6 pt-8 pb-24 text-gray-900">
            {/* Breadcrumbs - Simplified */}
            <nav className="flex items-center gap-2 text-xs font-medium text-gray-500 mb-8">
                <Link href="/" className="hover:text-green-600 transition-colors">Home</Link>
                <span className="text-gray-300">/</span>
                <Link href="/shop" className="hover:text-green-600 transition-colors">Shop</Link>
                <span className="text-gray-300">/</span>
                <span className="text-gray-900 truncate max-w-[200px]">{title}</span>
            </nav>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 mb-20">
                {/* 1. Visual Section (Left) - Structure Improved */}
                <div className="relative">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="lg:sticky lg:top-32 space-y-4"
                    >
                        {/* Main Image Container */}
                        <div className="relative aspect-square rounded-2xl overflow-hidden bg-white border border-gray-200 shadow-sm group">
                            {product.image_url ? (
                                <Image
                                    src={product.image_url}
                                    alt={title}
                                    fill
                                    sizes="(max-width: 1024px) 100vw, 50vw"
                                    className="object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                                    priority
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-gray-50 text-gray-400 font-medium">
                                    No Image Available
                                </div>
                            )}

                            {/* Badges inside container */}
                            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                                <Link href="/shop" className="group">
                                    <span className="bg-green-600 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full shadow-sm group-hover:bg-green-700 transition-colors cursor-pointer">
                                        Authentic Ayurveda
                                    </span>
                                </Link>
                            </div>

                            {/* Wishlist Button inside container */}
                            <button
                                onClick={toggleWishlist}
                                disabled={wishlistLoading}
                                className="absolute top-4 right-4 w-12 h-12 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow-md hover:scale-110 transition-all z-20"
                                title={isWishlisted ? "Remove from Wishlist" : "Add to Wishlist"}
                            >
                                <svg
                                    className={`w-6 h-6 transition-colors ${isWishlisted ? 'fill-red-500 text-red-500' : 'text-gray-400 hover:text-red-500'}`}
                                    fill={isWishlisted ? "currentColor" : "none"}
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </button>
                        </div>

                        {/* Thumbnails (Placeholder logic) */}
                        {product.additional_images && product.additional_images.length > 0 && (
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                                <div className="w-20 h-20 rounded-lg border-2 border-green-600 overflow-hidden relative shrink-0">
                                    <Image src={product.image_url} alt="thumbnail" fill className="object-cover" />
                                </div>
                                {product.additional_images.map((img: string, i: number) => (
                                    <div key={i} className="w-20 h-20 rounded-lg border border-gray-200 overflow-hidden relative shrink-0 hover:border-green-400 transition-colors cursor-pointer">
                                        <Image src={img} alt={`thumbnail-${i}`} fill className="object-cover" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </motion.div>
                </div>

                {/* 2. Information Section (Right) - Hierarchy Improved */}
                <div className="flex flex-col">
                    <motion.div
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.4 }}
                    >
                        {/* 1. Product Name */}
                        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2 leading-tight">
                            {title}
                        </h1>

                        {/* 2. Rating & Reviews - Simplified */}
                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-sm font-medium text-gray-500 hover:text-green-600 cursor-pointer underline-offset-4 hover:underline">
                                {reviews.length} Customer Reviews
                            </span>
                        </div>

                        {/* 3. Price + Discount */}
                        <div className="flex items-end gap-3 mb-6 pb-6 border-b border-gray-100">
                            <span className="text-3xl font-bold text-gray-900 leading-none">
                                ₹{displayedPrice.toFixed(0)}
                            </span>
                            {displayedMrp > displayedPrice && (
                                <span className="text-lg text-gray-400 line-through font-medium mb-1">
                                    ₹{displayedMrp.toFixed(0)}
                                </span>
                            )}
                            {discount > 0 && (
                                <span className="mb-2 bg-red-100 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wide">
                                    {discount}% OFF
                                </span>
                            )}
                        </div>

                        {/* Unit / Net Quantity Display - UPDATED */}
                        {(() => {
                            // Helper to extract unit from title if explicit fields are missing
                            const extractUnit = (text: string) => {
                                const match = text.match(/\b\d+\s*(?:g|kg|gm|ml|l|ltr|pcs|pack)\b/i);
                                return match ? match[0] : null;
                            };

                            const unitLabel = selectedVariant
                                ? selectedVariant.label
                                : (product.unit_value && product.unit_type
                                    ? `${product.unit_value} ${product.unit_type}`
                                    : extractUnit(title));

                            if (!unitLabel) return null;

                            return (
                                <div className="mb-6 flex items-center gap-2">
                                    <span className="text-sm font-bold text-gray-900 uppercase tracking-wider bg-gray-100 px-3 py-1 rounded-md">
                                        Net Qty: {unitLabel}
                                    </span>
                                </div>
                            );
                        })()}

                        {/* 4. Short Description */}
                        <div className="mb-6">
                            <p className={`text-base text-gray-600 leading-relaxed ${!showFullDesc ? 'line-clamp-3' : ''}`}>
                                {description}
                            </p>
                            {description.length > 200 && (
                                <button
                                    onClick={() => setShowFullDesc(!showFullDesc)}
                                    className="text-green-600 text-sm font-semibold mt-2 hover:underline focus:outline-none"
                                >
                                    {showFullDesc ? 'Show Less' : 'Read More'}
                                </button>
                            )}
                        </div>

                        {/* Variant Selection */}
                        {variants.length > 0 && (
                            <div className="mb-8">
                                <h3 className="text-sm font-bold text-gray-900 mb-3 uppercase tracking-wide">Choose Option</h3>
                                <div className="flex flex-wrap gap-3">
                                    {variants.map((v) => (
                                        <button
                                            key={v.id}
                                            onClick={() => setSelectedVariant(v)}
                                            className={`min-w-[4rem] px-4 py-2 rounded-lg border text-sm font-medium transition-all ${selectedVariant?.id === v.id
                                                ? 'border-green-600 bg-green-50 text-green-700'
                                                : 'border-gray-200 text-gray-700 hover:border-gray-300'
                                                }`}
                                        >
                                            {v.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* 5. Quantity + CTA (Grouped Block) */}
                        <div className="flex flex-col sm:flex-row gap-4 mb-8">
                            {/* Quantity Selector - Inline & Compact */}
                            <div className="flex items-center h-12 border border-gray-300 rounded-lg bg-white w-fit shrink-0 shadow-sm !p-0">
                                <button
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-10 h-full flex items-center justify-center text-black hover:bg-gray-100 rounded-l-lg transition-colors !p-0 !min-h-0"
                                    aria-label="Decrease quantity"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M20 12H4" />
                                    </svg>
                                </button>
                                <div className="w-12 h-full flex items-center justify-center font-bold text-black text-lg bg-white border-x border-gray-200 !p-0">
                                    {quantity}
                                </div>
                                <button
                                    onClick={() => setQuantity(Math.min(selectedVariant?.stock_quantity ?? product.stock_quantity, quantity + 1))}
                                    className="w-10 h-full flex items-center justify-center text-black hover:bg-gray-100 rounded-r-lg transition-colors !p-0 !min-h-0"
                                    aria-label="Increase quantity"
                                >
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                                    </svg>
                                </button>
                            </div>

                            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <Button
                                    variant="primary"
                                    onClick={handleBuyNow}
                                    isLoading={adding}
                                    className="h-12 text-sm font-bold uppercase tracking-widest rounded-lg shadow-lg hover:shadow-green-500/30 transition-shadow"
                                    disabled={(selectedVariant ? selectedVariant.stock_quantity <= 0 : product.stock_quantity <= 0)}
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                                        {(selectedVariant ? selectedVariant.stock_quantity <= 0 : product.stock_quantity <= 0) ? 'Out of Stock' : t('buyNow')}
                                    </span>
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={handleAddToCart}
                                    disabled={(selectedVariant ? selectedVariant.stock_quantity <= 0 : product.stock_quantity <= 0) || adding}
                                    className="h-12 text-sm font-bold uppercase tracking-widest rounded-lg"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                                        {t('addToCart')}
                                    </span>
                                </Button>
                            </div>
                        </div>

                        {/* 6. Trust Indicators - Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-5 bg-gray-50 rounded-xl border border-gray-100">
                            {[
                                { icon: '🌿', text: '100% Organic', sub: 'Certified' },
                                { icon: '🔬', text: 'Lab Tested', sub: 'Pure & Safe' },
                                { icon: '🪔', text: 'Authentic', sub: 'Ayurvedic' },
                                { icon: '📦', text: 'Fast Ship', sub: 'Pan India' }
                            ].map((feature, i) => (
                                <div key={i} className="flex flex-col items-center text-center sm:items-start sm:text-left">
                                    <div className="text-xl mb-1">{feature.icon}</div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-900">{feature.text}</span>
                                    <span className="text-[9px] text-gray-500">{feature.sub}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* 3. Detailed Information - Industry-Standard Vertical Stack */}
            <div className="mt-16 space-y-24">
                {/* A. Description Section */}
                <section className="scroll-mt-24">
                    <div className="flex items-center gap-3 mb-8 relative inline-flex">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl">📝</div>
                        <h3 className="text-3xl font-bold text-gray-900">
                            Description
                            <span className="absolute -bottom-1 left-0 w-12 h-[2px] bg-green-500"></span>
                        </h3>
                    </div>
                    <div className="max-w-4xl">
                        <div className="whitespace-pre-line text-lg font-medium text-gray-600 leading-relaxed tracking-tight">
                            {description}
                        </div>
                        {usage && (
                            <div className="mt-10 pt-8 border-t border-green-100 relative">
                                <h4 className="font-bold text-green-700 mb-3 uppercase text-xs tracking-widest flex items-center gap-2">
                                    How to use
                                    <span className="w-8 h-[1px] bg-green-200"></span>
                                </h4>
                                <p className="font-medium text-green-900 italic text-lg leading-relaxed">{usage}</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* B. Ingredients Section */}
                <section className="scroll-mt-24">
                    <div className="flex items-center gap-3 mb-8 relative inline-flex">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl">🍃</div>
                        <h3 className="text-3xl font-bold text-gray-900">
                            Ingredients
                            <span className="absolute -bottom-1 left-0 w-12 h-[2px] bg-green-500"></span>
                        </h3>
                    </div>
                    <div className="bg-gray-50/50 rounded-[3rem] p-8 md:p-16 border border-gray-100 relative overflow-hidden">
                        <div className="relative z-10 max-w-4xl mx-auto text-center">
                            <p className="text-gray-600 leading-relaxed text-xl max-w-2xl mx-auto italic font-medium">
                                {specifications || '100% natural, farm-sourced ingredients.'}
                            </p>
                            {additionalInfo && (
                                <div className="mt-8 pt-8 border-t border-gray-100/50 text-gray-400 text-sm tracking-wide lowercase italic">
                                    * {additionalInfo}
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* C. Shipping & Delivery */}
                <section>
                    <div className="flex items-center gap-3 mb-8 relative inline-flex">
                        <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl">🚚</div>
                        <h3 className="text-3xl font-bold text-gray-900">
                            Shipping Info
                            <span className="absolute -bottom-1 left-0 w-12 h-[2px] bg-green-500"></span>
                        </h3>
                    </div>
                    <div className="grid md:grid-cols-2 gap-8 max-w-5xl">
                        <div className="p-8 bg-white border border-gray-100 rounded-3xl shadow-sm">
                            <h4 className="font-bold text-gray-900 mb-4 uppercase text-[10px] tracking-[0.2em] text-green-700">Delivery Policy</h4>
                            <p className="text-lg text-gray-600 font-medium leading-relaxed">Orders are typically dispatched within 24-48 hours. Expect delivery in 4-7 business days depending on your location.</p>
                        </div>
                        <div className="p-8 bg-green-600 rounded-3xl shadow-xl shadow-green-900/20 text-white flex flex-col justify-center">
                            <span className="text-3xl mb-4">🎁</span>
                            <h4 className="font-bold mb-3 uppercase text-[10px] tracking-[0.2em] text-green-100">Shipping Charges</h4>
                            {selectedWeightLabel && (
                                <p className="text-sm text-green-50 font-semibold mb-3">
                                    Selected size: {selectedWeightLabel}{selectedWeightKg > 0 ? ` (${formatWeight(selectedWeightKg)})` : ''}
                                </p>
                            )}
                            <div className="space-y-2">
                                {SHIPPING_POLICY_LINES.map((line) => (
                                    <p key={line} className="text-sm font-semibold text-green-50">
                                        {line}
                                    </p>
                                ))}
                            </div>
                            <p className="text-xs text-green-100 mt-4 font-medium">
                                Final shipping is calculated from the total billable weight of all items in your cart.
                            </p>
                        </div>
                    </div>
                </section>

                {/* D. Reviews Section */}
                <section className="pt-20 border-t border-gray-100">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
                        <div className="flex items-center gap-4 relative inline-flex">
                            <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-xl">⭐</div>
                            <div>
                                <h3 className="text-3xl font-bold text-gray-900">
                                    Customer Reviews
                                    <span className="absolute -bottom-1 left-0 w-12 h-[2px] bg-green-500"></span>
                                </h3>
                            </div>
                        </div>
                        {user && hasPurchased && (
                            <Button
                                variant="outline"
                                onClick={() => router.push(`/product/${product.product_id}/review`)}
                                className="rounded-xl border-2 h-12 px-8"
                            >
                                Share Your Experience
                            </Button>
                        )}
                        {user && !hasPurchased && (
                            <div className="bg-gray-50 px-6 py-3 rounded-xl border border-gray-100 flex items-center gap-3">
                                <span className="text-xl">🔒</span>
                                <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">Only customers who purchased this can review</span>
                            </div>
                        )}
                    </div>

                    {reviews.length > 0 ? (
                        <div className="grid gap-8 md:grid-cols-2">
                             {reviews.map((review) => (
                                 <div key={review.id} className="p-8 bg-white rounded-[2.5rem] border border-gray-100 hover:shadow-2xl transition-all group">
                                     <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                                         <div className="flex items-center gap-4">
                                             <div className="w-12 h-12 rounded-full bg-green-600 text-white flex-shrink-0 flex items-center justify-center font-bold shadow-lg">
                                                 {review.profiles?.full_name?.[0] || 'U'}
                                             </div>
                                             <div className="min-w-0">
                                                 <p className="font-bold text-gray-900 truncate">{review.profiles?.full_name || 'Verified User'}</p>
                                                {(() => {
                                                    const isVerified =
                                                        typeof review.verified_purchase === 'boolean'
                                                            ? review.verified_purchase
                                                            : false; // don't claim verification if column doesn't exist yet

                                                    if (!isVerified) return null;

                                                    return (
                                                        <div className="flex items-center gap-1.5 mt-1">
                                                            <div className="w-3.5 h-3.5 bg-green-100 rounded-full flex items-center justify-center">
                                                                <svg className="w-2.5 h-2.5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                </svg>
                                                            </div>
                                                            <span className="text-[9px] font-bold text-green-600 uppercase tracking-widest">Verified Purchaser</span>
                                                        </div>
                                                    );
                                                })()}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-start sm:items-end gap-1">
                                            {(() => {
                                                const rawRating = typeof review.rating === 'number' ? review.rating : Number(review.rating);
                                                const rating = Number.isFinite(rawRating) ? Math.max(1, Math.min(5, Math.round(rawRating))) : null;
                                                if (!rating) return null;

                                                return (
                                                    <div className="flex items-center gap-1">
                                                        {Array.from({ length: 5 }).map((_, idx) => (
                                                            <svg
                                                                key={idx}
                                                                className={`w-4 h-4 ${idx < rating ? 'text-yellow-400' : 'text-gray-200'}`}
                                                                fill="currentColor"
                                                                viewBox="0 0 20 20"
                                                                aria-hidden="true"
                                                            >
                                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                                            </svg>
                                                        ))}
                                                        <span className="text-[10px] font-bold text-gray-400 ml-1">{rating}/5</span>
                                                    </div>
                                                );
                                            })()}
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest sm:text-right">
                                                {new Date(review.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <p className="text-gray-600 text-lg font-medium leading-relaxed italic">&ldquo;{review.review_text}&rdquo;</p>
                                    {review.user_id === userId && (
                                        <div className="mt-5 flex justify-end">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => router.push(`/product/${product.product_id}/review`)}
                                                className="rounded-xl !border-green-200 !text-green-700 hover:!bg-green-50 hover:!text-green-800"
                                            >
                                                <svg className="mr-1.5 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16.862 4.487l1.651-1.651a2.121 2.121 0 013 3l-9.193 9.193a4 4 0 01-1.897 1.13l-3.087.772.772-3.087a4 4 0 011.13-1.897l7.624-7.46z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.5 7.125L16.875 4.5M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
                                                </svg>
                                                Edit
                                            </Button>
                                        </div>
                                    )}
                                 </div>
                             ))}
                         </div>
                    ) : (
                        <div className="text-center py-24 bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                            <p className="text-gray-400 text-lg font-medium">No reviews yet. Be the first to share your experience!</p>
                        </div>
                    )}
                </section>
            </div>

            {/* Related Products Section */}
            <RelatedProducts currentProductId={product.id} category={product.category} />
        </div >
    );
}

// Related Products Component
function RelatedProducts({ currentProductId, category }: { currentProductId: string; category?: string }) {
    const [relatedProducts, setRelatedProducts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const locale = useLocale();

    const toFiniteNumber = (value: unknown): number | null => {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value === 'string' && value.trim() !== '') {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? parsed : null;
        }
        return null;
    };

    useEffect(() => {
        async function fetchRelated() {
            setLoading(true);
            try {
                let query = (supabase
                    .from('products' as any) as any)
                    .select('*')
                    .eq('is_active', true)
                    .neq('id', currentProductId)
                    .limit(8);

                // If category exists, filter by category, otherwise just get random products
                if (category) {
                    query = query.eq('category', category);
                }

                const { data, error } = await query;

                if (!error && data) {
                    const products = data as any[];
                    const ids = products
                        .map((p) => p?.id)
                        .filter((id): id is string => typeof id === 'string' && id.length > 0);

                    let productsWithMeta = products;

                    if (ids.length > 0) {
                        const { data: variantData, error: variantsError } = await (supabase
                            .from('product_variants' as any) as any)
                            .select('product_id, price, enabled')
                            .in('product_id', ids)
                            .eq('enabled', true);

                        if (!variantsError && variantData) {
                            const ranges = new Map<string, { min: number | null; max: number | null; has: boolean }>();

                            (variantData as any[]).forEach((v) => {
                                const productId = v?.product_id;
                                if (typeof productId !== 'string' || productId.length === 0) return;

                                const price = toFiniteNumber(v?.price);
                                const current = ranges.get(productId) || { min: null, max: null, has: false };
                                current.has = true;

                                if (price !== null) {
                                    current.min = current.min === null ? price : Math.min(current.min, price);
                                    current.max = current.max === null ? price : Math.max(current.max, price);
                                }

                                ranges.set(productId, current);
                            });

                            productsWithMeta = products.map((p) => {
                                const meta = ranges.get(p.id);
                                return {
                                    ...p,
                                    has_variants: meta?.has ?? false,
                                    variant_min_price: meta?.min ?? null,
                                    variant_max_price: meta?.max ?? null,
                                };
                            });
                        }
                    }

                    setRelatedProducts(productsWithMeta);
                }
            } catch (error) {
                console.error('Error fetching related products:', error);
            } finally {
                setLoading(false);
            }
        }

        fetchRelated();
    }, [currentProductId, category]);

    if (loading) {
        return (
            <div className="mt-20 border-t border-gray-200 pt-16">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Related Products</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="bg-gray-100 rounded-lg h-64 animate-pulse"></div>
                    ))}
                </div>
            </div>
        );
    }

    if (relatedProducts.length === 0) {
        return null;
    }

    return (
        <div className="mt-20 border-t border-gray-200 pt-16">
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">Related Products</h2>
                <Link href="/shop" className="text-sm font-bold text-green-600 hover:text-green-700 uppercase tracking-wide flex items-center gap-1">
                    View All
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                {relatedProducts.map((product) => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
}
