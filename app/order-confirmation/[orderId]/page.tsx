/**
 * Order Confirmation Page
 * 
 * Show order success message and details
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth/context';

export default function OrderConfirmationPage() {
    const params = useParams();
    const orderId = params.orderId as string;
    const { user, loading: authLoading } = useAuth();
    const userId = user?.id;
    const [order, setOrder] = useState<any>(null);
    const [showEmailModal, setShowEmailModal] = useState(true);

    const fetchOrder = useCallback(async () => {
        if (!orderId) return;

        const normalizedOrderId = orderId.toUpperCase();
        const guestToken =
            sessionStorage.getItem(`guest_track_token:${orderId}`) ||
            sessionStorage.getItem(`guest_track_token:${normalizedOrderId}`) ||
            sessionStorage.getItem(`guest_payment_token:${orderId}`) ||
            sessionStorage.getItem(`guest_payment_token:${normalizedOrderId}`) ||
            null;

        const response = await fetch('/api/track-order', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                orderId: normalizedOrderId,
                accessToken: userId ? undefined : guestToken || undefined,
            }),
        });

        if (!response.ok) {
            setOrder(null);
            return;
        }

        const payload = await response.json();
        const normalizedItems = Array.isArray(payload?.items)
            ? payload.items.map((item: any) => ({
                ...item,
                total_price: Number(item.unit_price || 0) * Number(item.quantity || 0),
            }))
            : [];

        setOrder({
            ...(payload?.order || null),
            order_items: normalizedItems,
        });
    }, [orderId, userId]);

    useEffect(() => {
        if (!orderId || authLoading) {
            return;
        }

        const fetchTimer = setTimeout(() => {
            void fetchOrder();
        }, 0);

        // Auto-close modal after 10 seconds
        const timer = setTimeout(() => {
            setShowEmailModal(false);
        }, 10000);

        return () => {
            clearTimeout(fetchTimer);
            clearTimeout(timer);
        };
    }, [fetchOrder, orderId, authLoading]);

    return (
        <main className="section-padding">
            {/* Email Sent Modal */}
            {showEmailModal && (
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 relative animate-slideUp">
                        {/* Close Button */}
                        <button
                            onClick={() => setShowEmailModal(false)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>

                        {/* Email Icon */}
                        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                        </div>

                        {/* Message */}
                        <h3 className="text-xl font-bold text-gray-900 text-center mb-2">
                            Payment Update
                        </h3>
                        <p className="text-gray-600 text-center mb-6">
                            We received your payment details. You should receive a payment review email shortly.
                        </p>

                        {/* Auto-close indicator */}
                        <div className="text-center">
                            <p className="text-xs text-gray-400">This will close automatically in 10 seconds or click X to close</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="container mx-auto px-4 max-w-2xl">
                <div className="bg-white rounded-xl shadow-xl p-8 text-center">
                    {/* Success Icon */}
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-12 h-12 text-green-600" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                            <path d="M5 13l4 4L19 7"></path>
                        </svg>
                    </div>

                    <h1 className="text-3xl font-bold text-[rgb(var(--foreground))] mb-4">
                        Payment Submitted Successfully!
                    </h1>

                    <div className="bg-green-50 border border-green-100 rounded-xl p-6 mb-8">
                        <p className="text-green-800 font-medium text-lg mb-2">
                            Thank you for choosing Charan Organics!
                        </p>
                        <p className="text-green-700">
                            We are committed to providing you with the purest, authentic Ayurvedic products. Your trust means the world to us.
                        </p>
                    </div>

                    <p className="text-gray-600 mb-8">
                        We have received your payment details. Your order is now waiting for payment verification by our team.
                    </p>

                    {/* Order Details */}
                    {order && (
                        <div className="bg-gray-50 rounded-lg p-6 mb-8">
                            <div className="grid grid-cols-2 gap-4 text-left border-b border-gray-200 pb-4 mb-4">
                                <div>
                                    <p className="text-sm text-gray-600">Order ID</p>
                                    <p className="font-mono font-semibold">{order.order_id}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total Amount</p>
                                    <p className="text-xl font-bold text-[rgb(var(--primary))]">
                                        {'\u20B9'}{order.total_amount.toFixed(2)}
                                    </p>
                                </div>
                            </div>

                            <div className="text-left space-y-4">
                                <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Items Ordered</p>
                                {order.order_items?.map((item: any, index: number) => (
                                    <div
                                        key={`${item.product_id || item.product_title_en || 'item'}-${item.variant_label || 'default'}-${index}`}
                                        className="flex justify-between items-center text-sm"
                                    >
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-900">{item.product_title_en}</p>
                                            {item.variant_label && (
                                                <p className="text-[10px] font-black text-green-600 uppercase">Size: {item.variant_label}</p>
                                            )}
                                            <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                                        </div>
                                        <p className="font-bold text-gray-900 ml-4">{'\u20B9'}{(item.total_price || 0).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Next Steps */}
                    <div className="text-left mb-8">
                        <h2 className="text-xl font-bold mb-4">What&apos;s Next?</h2>
                        <ol className="list-decimal list-inside space-y-2 text-gray-700">
                            <li>We&apos;ll verify your payment within 24 hours</li>
                            <li>You&apos;ll receive an email confirmation once verified</li>
                            <li>Your order will be shipped within 2-3 business days</li>
                            <li>
                                {user
                                    ? 'Track your order status in your account'
                                    : 'Track your order using Order ID, phone number, and pincode'}
                            </li>
                        </ol>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col sm:flex-row gap-4">
                        {user ? (
                            <Link href="/account/orders" className="flex-1">
                                <Button variant="primary" size="lg" fullWidth>
                                    View My Orders
                                </Button>
                            </Link>
                        ) : (
                            <Link href={`/track-order/${encodeURIComponent(orderId.toUpperCase())}`} className="flex-1">
                                <Button variant="primary" size="lg" fullWidth>
                                    Track This Order
                                </Button>
                            </Link>
                        )}
                        <Link href="/shop" className="flex-1">
                            <Button variant="outline" size="lg" fullWidth>
                                Continue Shopping
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </main>
    );
}
