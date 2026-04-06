'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/lib/cart-context';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from '@/lib/i18n/context';
import { resolveLocalizedText } from '@/lib/i18n/localized';
import { calculateWeightBasedShipping } from '@/lib/utils/shipping';

export function CartDrawer() {
    const { isOpen, closeCart, items, removeItem, updateQuantity } = useCart();
    const locale = useLocale();
    const supportWhatsappPhone = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_PHONE || '';
    const supportWhatsappDigits = supportWhatsappPhone.replace(/\D/g, '');

    // Calculate subtotal
    // Note: This needs product details. For guest users we might need a separate fetch.
    // However, user items have product attached.
    const subtotal = items.reduce((sum, item) => {
        const price = item.product?.current_price || 0;
        return sum + (price * item.quantity);
    }, 0);
    const shippingSummary = calculateWeightBasedShipping(items);
    const estimatedShipping = shippingSummary.shippingCharge;
    const estimatedTotal = subtotal + estimatedShipping;

    const handleWhatsappCart = () => {
        try {
            if (!supportWhatsappDigits) {
                return;
            }

            if (items.length === 0) {
                return;
            }

            const lines: string[] = [];
            lines.push('Hi Charan Organics, I need help placing an order for these items:');
            lines.push('');

            for (const item of items) {
                const product = item.product;
                const title = locale === 'en'
                    ? product?.title_en
                    : resolveLocalizedText(product?.title_en, product?.title_te);
                const safeTitle = title || product?.title_en || 'Product';
                const variantLabel = item.variant_label ? ` (${item.variant_label})` : '';
                const unitPrice = typeof product?.current_price === 'number' ? product.current_price : null;
                const lineTotal = unitPrice === null ? null : unitPrice * item.quantity;

                lines.push(
                    `- ${safeTitle}${variantLabel} x${item.quantity}${lineTotal === null ? '' : ` - Rs.${lineTotal.toFixed(0)}`}`
                );
            }

            lines.push('');
            lines.push(`Subtotal: Rs.${subtotal.toFixed(0)}`);
            lines.push(`Actual Weight: ${shippingSummary.formattedActualWeight}`);
            lines.push(`Billable Weight: ${shippingSummary.formattedBillableWeight}`);
            lines.push(`Estimated Shipping: Rs.${estimatedShipping.toFixed(0)}`);
            lines.push(`Estimated Total: Rs.${estimatedTotal.toFixed(0)}`);
            lines.push('');
            lines.push(`From: ${window.location.origin}`);

            const href = `https://wa.me/${supportWhatsappDigits}?text=${encodeURIComponent(lines.join('\n'))}`;
            window.open(href, '_blank', 'noopener,noreferrer');
            closeCart();
        } catch (error) {
            console.error('WhatsApp cart error:', error);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={closeCart}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100]"
                    />

                    {/* Drawer */}
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[101] flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900">Your Cart</h2>
                            </div>
                            <button
                                onClick={closeCart}
                                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                            >
                                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Items List */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6">
                            {items.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center">
                                    <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center text-3xl mb-4">🛒</div>
                                    <h3 className="text-lg font-bold text-gray-900">Your cart is empty</h3>
                                    <p className="text-gray-500 mt-2 mb-8 max-w-xs">Looks like you haven&apos;t added anything to your cart yet.</p>
                                    <Button onClick={closeCart} variant="primary">Start Shopping</Button>
                                </div>
                            ) : (
                                items.map((item) => {
                                    if (!item.product) return null;
                                    const title = locale === 'en'
                                        ? item.product.title_en
                                        : resolveLocalizedText(item.product.title_en, item.product.title_te);

                                    return (
                                        <div key={`${item.product_id}:${item.variant_id || 'base'}`} className="flex gap-4">
                                            <div className="w-20 h-20 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 border border-gray-100">
                                                {item.product.image_url ? (
                                                    <Image
                                                        src={item.product.image_url}
                                                        alt={title}
                                                        width={80}
                                                        height={80}
                                                        className="object-cover w-full h-full"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-xl">🌿</div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-sm font-bold text-gray-900 truncate">{title}</h4>
                                                <p className="text-green-600 font-bold mt-1">₹{item.product.current_price.toFixed(2)}</p>

                                                <div className="flex items-center justify-between mt-3">
                                                    <div className="flex items-center border border-gray-200 rounded-lg p-1">
                                                        <button
                                                            onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity - 1)}
                                                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded text-gray-500"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                                                        <button
                                                            onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity + 1)}
                                                            className="w-8 h-8 flex items-center justify-center hover:bg-gray-50 rounded text-gray-500"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                    <button
                                                        onClick={() => removeItem(item.product_id, item.variant_id)}
                                                        className="text-xs font-bold text-red-500 hover:text-red-600 uppercase tracking-wider"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Footer */}
                        {items.length > 0 && (
                            <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                                <div className="flex flex-col mb-4">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-gray-500 font-medium">Subtotal</span>
                                        <span className="text-xl font-bold text-gray-900 font-mono">₹{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm mt-2">
                                        <span className="text-gray-500 font-medium">Weight</span>
                                        <span className="text-sm font-bold text-gray-900">{shippingSummary.formattedBillableWeight}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm mt-1">
                                        <span className="text-gray-500 font-medium">Shipping</span>
                                        <span className="text-sm font-bold text-gray-900">₹{estimatedShipping.toFixed(2)}</span>
                                    </div>
                                    {shippingSummary.hasFixedShipping && (
                                        <p className="text-[11px] text-gray-500 mt-1">
                                            Special fixed shipping is applied for selected items like kits.
                                        </p>
                                    )}
                                    <div className="flex items-center justify-between text-sm mt-1">
                                        <span className="text-gray-500 font-medium">Estimated Total</span>
                                        <span className="text-sm font-bold text-gray-900">₹{estimatedTotal.toFixed(2)}</span>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Link href="/cart" className="block w-full" onClick={closeCart}>
                                        <Button variant="outline" fullWidth className="h-12">View Full Cart</Button>
                                    </Link>
                                    <Link href="/checkout" className="block w-full" onClick={closeCart}>
                                        <Button variant="primary" fullWidth className="h-12 shadow-lg shadow-green-200">Checkout Now</Button>
                                    </Link>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        fullWidth
                                        className="h-12"
                                        disabled={!supportWhatsappDigits || items.length === 0}
                                        onClick={handleWhatsappCart}
                                    >
                                        WhatsApp Order / Help
                                    </Button>
                                </div>
                                {!supportWhatsappDigits && (
                                    <p className="text-center text-[11px] text-gray-400 mt-3">
                                        WhatsApp support not configured
                                    </p>
                                )}
                                <p className="text-center text-[11px] text-gray-400 mt-4">
                                    Guest checkout available. Shipping is calculated by total billable weight at checkout.
                                </p>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
