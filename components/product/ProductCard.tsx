/**
 * Product Card Component - COMPACT & UNIFORM
 * 
 * Smaller cards with fixed image height and consistent layout
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from '@/lib/i18n/context';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useCart } from '@/lib/cart-context';
import toast from 'react-hot-toast';

interface ProductCardProps {
    product: {
        id: string;
        product_id: string;
        title_en: string;
        title_te: string;
        image_url: string | null;
        mrp: number;
        current_price: number;
        unit_value?: number;
        unit_type?: string;
    };
}

export function ProductCard({ product }: ProductCardProps) {
    const { addItem } = useCart();
    const locale = useLocale();
    const [isAdding, setIsAdding] = useState(false);
    const [imageError, setImageError] = useState(false);

    const title = locale === 'en' ? product.title_en : product.title_te;
    const discount = Math.round(((product.mrp - product.current_price) / product.mrp) * 100);

    const handleAddToCart = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsAdding(true);

        try {
            await addItem(product.id, null, 1);
            toast.success('Added to cart!', {
                icon: '🛒',
                style: {
                    borderRadius: '8px',
                    background: '#2cdea3ff',
                    color: '#fff',
                    fontWeight: '600',
                    fontSize: '13px'
                }
            });
        } catch (error) {
            console.error('Error adding to cart:', error);
            toast.error('Failed to add to cart');
        } finally {
            setIsAdding(false);
        }
    };

    return (
        <Link href={`/product/${product.product_id}`} className="block h-full group">
            <motion.div
                className="bg-white rounded-[20px] overflow-hidden border border-gray-100/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.1)] transition-all duration-500 h-full flex flex-col !p-0 group"
                whileHover={{ y: -6 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
                {/* Image Container */}
                <div className="relative aspect-square overflow-hidden bg-[#F9F9F7]">
                    {product.image_url && !imageError ? (
                        <Image
                            src={product.image_url}
                            alt={title}
                            fill
                            className="object-contain group-hover:scale-110 transition-transform duration-700 ease-out p-3 md:p-4"
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            onError={() => setImageError(true)}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                            <span className="text-4xl opacity-20">🌿</span>
                        </div>
                    )}

                    {/* Discount Badge - Premium & Elegant */}
                    {discount > 0 && (
                        <div className="absolute top-0 left-0 z-10">
                            <div className="bg-[#E25C5C] text-white px-2.5 py-1.5 md:px-3 md:py-1.5 font-bold text-[11px] md:text-[10px] uppercase tracking-widest rounded-br-2xl shadow-sm">
                                {discount}% OFF
                            </div>
                        </div>
                    )}

                    {/* Subtle Hover Overlay */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/[0.02] transition-colors duration-500" />
                </div>

                {/* Content - Precision Spacing */}
                <div className="p-3 md:p-5 flex-1 flex flex-col">
                    {/* Title - Clean Typography */}
                    <h3 className="font-bold text-[#1A1A1A] text-[17px] md:text-[16px] leading-[1.2] mb-1 md:mb-1.5 line-clamp-2 md:h-[42px]">
                        {title}
                    </h3>

                    {/* Variant / Size - Muted & Minimal */}
                    {product.unit_value && product.unit_type && (
                        <div className="text-[13px] md:text-[12px] text-gray-400 font-medium uppercase tracking-[0.05em] mb-2 md:mb-3">
                            {product.unit_value} {product.unit_type}
                        </div>
                    )}

                    {/* Pricing - Bold & Prominent */}
                    <div className="flex items-center gap-2 mb-3 md:mb-5">
                        <span className="text-[20px] md:text-[20px] font-black text-[#1A1A1A]">
                            ₹{product.current_price.toFixed(0)}
                        </span>
                        {product.mrp > product.current_price && (
                            <span className="text-[14px] md:text-[14px] text-gray-300 line-through decoration-gray-300">
                                ₹{product.mrp.toFixed(0)}
                            </span>
                        )}
                    </div>

                    {/* CTA Button - Industry Standard */}
                    <div className="mt-auto">
                        <Button
                            variant="primary"
                            size="sm"
                            fullWidth
                            isLoading={isAdding}
                            onClick={handleAddToCart}
                            className="rounded-xl font-bold text-[12px] md:text-[12px] uppercase tracking-widest h-[40px] md:h-[44px] shadow-[0_4px_12px_rgba(var(--primary),0.2)] hover:shadow-[0_8px_20px_rgba(var(--primary),0.35)] transition-all duration-300 active:scale-[0.98]"
                        >
                            {isAdding ? 'Adding...' : 'Add to Cart'}
                        </Button>
                    </div>
                </div>
            </motion.div>
        </Link>
    );
}

