'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from '@/lib/cart-context';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from '@/lib/i18n/context';
import { resolveLocalizedText } from '@/lib/i18n/localized';

export function CartDrawer() {
    const { isOpen, closeCart, items, removeItem, updateQuantity } = useCart();
    const locale = useLocale();

    // Calculate subtotal
    // Note: This needs product details. For guest users we might need a separate fetch.
    // However, user items have product attached.
    const subtotal = items.reduce((sum, item) => {
        const price = item.product?.current_price || 0;
        return sum + (price * item.quantity);
    }, 0);

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
                                    <p className="text-gray-500 mt-2 mb-8 max-w-xs">Looks like you haven't added anything to your cart yet.</p>
                                    <Button onClick={closeCart} variant="primary">Start Shopping</Button>
                                </div>
                            ) : (
                                items.map((item) => {
                                    if (!item.product) return null;
                                    const title = locale === 'en'
                                        ? item.product.title_en
                                        : resolveLocalizedText(item.product.title_en, item.product.title_te);

                                    return (
                                        <div key={item.product_id} className="flex gap-4">
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
                                    {subtotal < 2000 ? (
                                        <p className="text-[10px] text-green-600 font-bold bg-green-50 px-2 py-1 rounded inline-block self-end">
                                            Add ₹{(2000 - subtotal).toFixed(2)} more for FREE shipping
                                        </p>
                                    ) : (
                                        <p className="text-[10px] text-green-600 font-black uppercase tracking-widest bg-green-50 px-2 py-1 rounded inline-block self-end animate-pulse">
                                            🎉 Free Shipping Applied!
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-3">
                                    <Link href="/cart" className="block w-full" onClick={closeCart}>
                                        <Button variant="outline" fullWidth className="h-12">View Full Cart</Button>
                                    </Link>
                                    <Link href="/checkout" className="block w-full" onClick={closeCart}>
                                        <Button variant="primary" fullWidth className="h-12 shadow-lg shadow-green-200">Checkout Now</Button>
                                    </Link>
                                </div>
                                <p className="text-center text-[11px] text-gray-400 mt-4">Shipping and taxes calculated at checkout</p>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
