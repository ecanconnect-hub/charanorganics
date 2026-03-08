/**
 * Cart Page
 *
 * View and manage cart items
 */

'use client';

import { useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { useLocale } from '@/lib/i18n/context';
import { resolveLocalizedText } from '@/lib/i18n/localized';
import { useCart } from '@/lib/cart-context';
import toast from 'react-hot-toast';

const toFiniteNumber = (value: unknown): number | null => {
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
};

export default function CartPage() {
    const router = useRouter();
    const locale = useLocale();
    const { items: cartItems, updateQuantity, removeItem, isLoading } = useCart();
    const cleanupInProgressRef = useRef(false);

    const subtotal = cartItems.reduce((sum, item) => {
        const price = toFiniteNumber(item.product?.current_price);
        return price !== null ? sum + price * item.quantity : sum;
    }, 0);

    const shippingCandidates = cartItems
        .map((item) => toFiniteNumber(item.product?.shipping_charges))
        .filter((value): value is number => value !== null);
    const maxShipping = shippingCandidates.length > 0 ? Math.max(...shippingCandidates) : 0;
    const shipping = subtotal >= 2000 ? 0 : maxShipping;
    const total = subtotal + shipping;
    const unavailableItems = useMemo(
        () => cartItems.filter((item) => toFiniteNumber(item.product?.current_price) === null),
        [cartItems]
    );
    const hasUnavailablePricing = unavailableItems.length > 0;

    useEffect(() => {
        if (unavailableItems.length === 0 || cleanupInProgressRef.current) {
            return;
        }

        cleanupInProgressRef.current = true;

        const cleanupUnavailableItems = async () => {
            try {
                for (const item of unavailableItems) {
                    await removeItem(item.product_id, item.variant_id);
                }
                toast.error('Unavailable items were removed from your cart.');
            } finally {
                cleanupInProgressRef.current = false;
            }
        };

        void cleanupUnavailableItems();
    }, [removeItem, unavailableItems]);

    return (
        <main className="section-padding min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Safe top spacing to avoid header overlap */}
            <div className="h-24 md:h-28"></div>

            <div className="container mx-auto px-4 max-w-6xl">
                <div className="mb-8 md:mb-10">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-gray-900 mb-2">Shopping Cart</h1>
                    <p className="text-sm md:text-base text-gray-500 font-medium">Review your organic selection before checkout</p>
                </div>

                {isLoading && cartItems.length === 0 ? (
                    <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="w-16 h-16 border-4 border-green-100 border-t-green-600 rounded-full animate-spin mx-auto mb-6"></div>
                        <p className="text-gray-500 font-bold text-lg">Brewing your cart...</p>
                    </div>
                ) : cartItems.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8 text-gray-300">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Your cart is empty</h2>
                        <p className="text-gray-500 mb-10 max-w-xs mx-auto">Looks like you haven&apos;t added any Ayurvedic goodness yet.</p>
                        <Link href="/shop">
                            <Button variant="primary" size="lg" className="rounded-full px-12 shadow-xl shadow-green-100 font-bold">
                                Start Shopping
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
                        {/* Cart Items */}
                        <div className="lg:col-span-8 space-y-4">
                            {cartItems.map((item) => {
                                const product = item.product;
                                const title = locale === 'en'
                                    ? product?.title_en
                                    : resolveLocalizedText(product?.title_en, product?.title_te);
                                const itemKey = item.id || `${item.product_id}-${item.variant_id || 'none'}`;
                                const productHref = product?.product_id ? `/product/${product.product_id}` : '/shop';
                                const unitPrice = toFiniteNumber(product?.current_price);
                                const hasUnitPrice = unitPrice !== null;
                                const lineTotal = hasUnitPrice ? unitPrice * item.quantity : null;

                                return (
                                    <div key={itemKey} className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 flex gap-4 md:gap-5 group hover:shadow-md hover:border-gray-200 transition-all duration-200">
                                        {/* Image */}
                                        <Link
                                            href={productHref}
                                            className="w-24 h-24 md:w-28 md:h-28 bg-gray-50 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-gray-100"
                                        >
                                            {product?.image_url ? (
                                                <img
                                                    src={product.image_url}
                                                    alt={title || 'Product'}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                    <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" /></svg>
                                                </div>
                                            )}
                                        </Link>

                                        {/* Details */}
                                        <div className="flex-1 min-w-0 flex flex-col justify-between">
                                            <div>
                                                <div className="flex justify-between items-start gap-3 mb-2">
                                                    <Link href={productHref}>
                                                        <h3 className="text-lg font-semibold leading-snug text-gray-900 group-hover:text-green-700 transition-colors">
                                                            {title || 'Product unavailable'}
                                                        </h3>
                                                    </Link>
                                                    <p className="text-xl font-bold text-gray-900 tracking-tight whitespace-nowrap">
                                                        {lineTotal === null ? 'Price unavailable' : `₹${lineTotal.toFixed(2)}`}
                                                    </p>
                                                </div>
                                                {item.variant_label && (
                                                    <span className="inline-flex items-center text-[11px] font-semibold text-green-700 bg-green-50 px-2 py-1 rounded-lg ring-1 ring-green-100 mb-3">
                                                        {item.variant_label}
                                                    </span>
                                                )}
                                                <p className="text-sm font-medium text-gray-500">
                                                    Unit Price: {hasUnitPrice ? `₹${unitPrice.toFixed(2)}` : 'Unavailable'}
                                                </p>
                                            </div>

                                            {/* Controls */}
                                            <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-gray-100">
                                                <div className="inline-flex items-center rounded-xl border border-gray-200 bg-white p-1 shadow-sm">
                                                    <button
                                                        onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity - 1)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-base font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:scale-95 transition-all disabled:opacity-30"
                                                        disabled={item.quantity <= 1}
                                                    >
                                                        -
                                                    </button>
                                                    <span className="w-8 text-center text-sm font-semibold text-gray-900">{item.quantity}</span>
                                                    <button
                                                        onClick={() => updateQuantity(item.product_id, item.variant_id, item.quantity + 1)}
                                                        className="w-8 h-8 flex items-center justify-center rounded-lg text-base font-semibold text-gray-700 hover:bg-gray-100 hover:text-gray-900 active:scale-95 transition-all"
                                                    >
                                                        +
                                                    </button>
                                                </div>

                                                <button
                                                    onClick={() => removeItem(item.product_id, item.variant_id)}
                                                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-red-600 bg-white hover:bg-red-50 px-3 py-1.5 rounded-lg transition-all border border-gray-200 hover:border-red-200"
                                                >
                                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    Remove
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Order Summary */}
                        <div className="lg:col-span-4">
                            <div className="bg-white rounded-2xl p-5 md:p-6 shadow-sm border border-gray-100 sticky top-36">
                                <h2 className="text-xl md:text-2xl font-semibold text-gray-900 mb-6 flex items-center gap-3">
                                    Summary
                                    <span className="text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-lg">{cartItems.length} Items</span>
                                </h2>

                                <div className="space-y-4 mb-6">
                                    <div className="flex justify-between text-sm font-medium text-gray-500">
                                        <span>Subtotal</span>
                                        <span className="text-base font-semibold text-gray-900">₹{subtotal.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm font-medium text-gray-500">
                                        <span>Shipping</span>
                                        <span className="text-base font-semibold text-gray-900">
                                            {subtotal >= 2000 ? (
                                                <span className="text-green-600 font-semibold text-xs uppercase tracking-[0.14em]">Free Shipping</span>
                                            ) : `₹${shipping.toFixed(2)}`}
                                        </span>
                                    </div>
                                    <div className="pt-5 mt-5 border-t border-gray-200 flex justify-between items-end">
                                        <div>
                                            <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-[0.15em] mb-1">Total Amount</p>
                                            <p className="text-3xl md:text-4xl font-bold text-gray-900">₹{total.toFixed(2)}</p>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    variant="primary"
                                    size="lg"
                                    fullWidth
                                    className="rounded-xl h-12 shadow-md shadow-green-100/70 font-semibold text-base group"
                                    disabled={hasUnavailablePricing}
                                    onClick={() => router.push('/checkout')}
                                >
                                    {hasUnavailablePricing ? 'Fix Cart Items' : 'Checkout'}
                                    <svg className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                </Button>

                                {hasUnavailablePricing ? (
                                    <p className="mt-2 text-xs text-amber-700 font-medium">
                                        Fixing unavailable item prices...
                                    </p>
                                ) : null}

                                <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                                    <p className="text-[11px] text-gray-400 font-semibold uppercase tracking-[0.12em] mb-3">Safe & Secure Payment</p>
                                    <div className="flex justify-center gap-4 grayscale opacity-50">
                                        <div className="w-10 h-6 bg-gray-200 rounded-md"></div>
                                        <div className="w-10 h-6 bg-gray-200 rounded-md"></div>
                                        <div className="w-10 h-6 bg-gray-200 rounded-md"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
