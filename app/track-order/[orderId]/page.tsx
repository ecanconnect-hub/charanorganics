/**
 * Track Order Page
 *
 * Track order status and shipping
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import toast from 'react-hot-toast';

type TrackedOrderItem = {
    product_title_en: string;
    variant_label: string | null;
    quantity: number;
    unit_price: number;
    product?: {
        image_url: string | null;
    };
};

type TrackedOrder = {
    order_id: string;
    created_at: string;
    total_amount: number;
    status: string;
    shipping_name: string;
    shipping_phone: string;
    shipping_address: string;
    shipping_city: string;
    shipping_state: string;
    shipping_pincode: string;
    order_items: TrackedOrderItem[];
};

const STEP_ORDER = ['pending_payment', 'payment_verification', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;

const steps = [
    { name: 'Order Placed', status: 'pending_payment' },
    { name: 'Payment Verification', status: 'payment_verification' },
    { name: 'Confirmed', status: 'confirmed' },
    { name: 'Shipped', status: 'shipped' },
    { name: 'Delivered', status: 'delivered' },
] as const;

export default function TrackOrderPage() {
    const params = useParams();
    const orderId = params.orderId as string;

    const [order, setOrder] = useState<TrackedOrder | null>(null);
    const [loading, setLoading] = useState(true);
    const [phoneInput, setPhoneInput] = useState('');
    const [verificationLoading, setVerificationLoading] = useState(false);
    const [attemptedWithPhone, setAttemptedWithPhone] = useState(false);

    const fetchOrder = useCallback(async (phoneOverride?: string): Promise<boolean> => {
        setLoading(true);

        const phoneFromSession =
            sessionStorage.getItem(`guest_track_phone:${orderId}`) ||
            sessionStorage.getItem(`guest_track_phone:${orderId.toUpperCase()}`) ||
            '';

        const phone = phoneOverride || phoneFromSession || '';

        try {
            const response = await fetch('/api/track-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    orderId,
                    phone: phone || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data?.order) {
                setOrder(null);
                if (phoneOverride) {
                    setAttemptedWithPhone(true);
                }
                return false;
            }

            if (phone) {
                sessionStorage.setItem(`guest_track_phone:${orderId}`, phone);
                sessionStorage.setItem(`guest_track_phone:${orderId.toUpperCase()}`, phone);
            }

            setAttemptedWithPhone(false);
            setOrder({
                ...data.order,
                order_items: data.items || [],
            } as TrackedOrder);
            return true;
        } catch {
            setOrder(null);
            return false;
        } finally {
            setLoading(false);
        }
    }, [orderId]);

    useEffect(() => {
        if (!orderId) return;
        void fetchOrder();
    }, [orderId, fetchOrder]);

    const handlePhoneVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        const normalizedPhone = phoneInput.trim();

        if (!normalizedPhone) {
            toast.error('Please enter the phone number used in your order.');
            return;
        }

        setVerificationLoading(true);
        try {
            const success = await fetchOrder(normalizedPhone);
            if (!success) {
                toast.error('Order not found with this phone number.');
            }
        } finally {
            setVerificationLoading(false);
        }
    };

    const stepProgress = useMemo(() => {
        if (!order) return 0;
        const currentIdx = STEP_ORDER.indexOf(order.status as (typeof STEP_ORDER)[number]);
        if (currentIdx <= 0) return 0;
        return Math.max(0, Math.min(100, (currentIdx / (steps.length - 1)) * 100));
    }, [order]);

    const getStepStatus = (stepStatus: string) => {
        if (!order) return 'pending';
        const currentIdx = STEP_ORDER.indexOf(order.status as (typeof STEP_ORDER)[number]);
        const stepIdx = STEP_ORDER.indexOf(stepStatus as (typeof STEP_ORDER)[number]);

        if (order.status === 'cancelled') return 'cancelled';
        return stepIdx <= currentIdx ? 'completed' : 'pending';
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4">
                <div className="text-center max-w-md w-full bg-white border border-gray-100 rounded-2xl p-8 shadow-sm">
                    <p className="text-xl text-gray-700 mb-2">Order not found</p>
                    <p className="text-sm text-gray-500 mb-5">
                        If you are a guest, verify with the phone number used during checkout.
                    </p>
                    <form onSubmit={handlePhoneVerify} className="space-y-3 mb-4">
                        <Input
                            type="tel"
                            value={phoneInput}
                            onChange={(e) => setPhoneInput(e.target.value)}
                            placeholder="Enter phone number"
                            className="h-12 rounded-xl"
                        />
                        <Button
                            type="submit"
                            variant="primary"
                            fullWidth
                            isLoading={verificationLoading}
                            className="h-12 rounded-xl"
                        >
                            Verify and Track
                        </Button>
                    </form>
                    {attemptedWithPhone ? (
                        <p className="text-xs text-red-600 mb-4">Could not verify this order with that phone number.</p>
                    ) : null}
                    <Link href="/track-order">
                        <Button variant="outline">Back to Track Order</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <main className="bg-gray-50/50 min-h-screen">
            <div className="h-24 md:h-28"></div>
            <div className="section-padding">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="mb-8 flex items-center gap-4">
                        <Link href="/track-order">
                            <button className="p-2 hover:bg-white rounded-full transition-colors group" aria-label="Back to track order">
                                <svg className="w-6 h-6 text-gray-400 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900">Track Order</h1>
                            <p className="text-gray-500">Real-time status of your purchase</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 mb-8">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                            <div>
                                <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-1">Order Number</p>
                                <p className="font-mono font-bold text-gray-900 text-lg">#{order.order_id}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-1">Estimated Delivery</p>
                                <p className="font-bold text-gray-900 text-lg">
                                    {new Date(new Date(order.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, {
                                        day: 'numeric',
                                        month: 'short',
                                    })}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-1">Total Paid</p>
                                <p className="text-2xl font-black text-green-600">Rs {Number(order.total_amount).toFixed(2)}</p>
                            </div>
                            <div className="flex flex-col items-start lg:items-end">
                                <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-1">Status</p>
                                <div className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ring-1 ${order.status === 'delivered' ? 'bg-green-100 text-green-700 ring-green-200' :
                                    order.status === 'shipped' ? 'bg-blue-100 text-blue-700 ring-blue-200' :
                                        order.status === 'cancelled' ? 'bg-red-100 text-red-700 ring-red-200' :
                                            'bg-yellow-100 text-yellow-700 ring-yellow-200'
                                    }`}>
                                    {order.status.replace('_', ' ')}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-10 mb-8 overflow-hidden">
                        <h2 className="text-xl font-bold text-gray-900 mb-12">Delivery Progress</h2>

                        {order.status === 'cancelled' ? (
                            <div className="text-center py-12">
                                <h3 className="text-2xl font-black text-gray-900 mb-2">Order Cancelled</h3>
                                <p className="text-gray-500">This order was not processed further.</p>
                            </div>
                        ) : (
                            <div className="relative">
                                <div className="hidden md:block">
                                    <div className="absolute top-8 left-0 right-0 h-1.5 bg-gray-100 rounded-full">
                                        <div
                                            className="h-full bg-green-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${stepProgress}%` }}
                                        ></div>
                                    </div>
                                    <div className="relative flex justify-between">
                                        {steps.map((step) => {
                                            const status = getStepStatus(step.status);
                                            const isCompleted = status === 'completed';

                                            return (
                                                <div key={step.status} className="flex flex-col items-center flex-1">
                                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-[11px] mb-4 z-10 transition-all duration-500 font-black ${isCompleted
                                                        ? 'bg-green-600 text-white shadow-xl shadow-green-200'
                                                        : 'bg-white text-gray-300 ring-2 ring-gray-100'
                                                        }`}>
                                                        {isCompleted ? 'OK' : step.status.slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <p className={`text-xs font-black uppercase tracking-widest text-center max-w-[100px] ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                                                        {step.name}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                <div className="md:hidden space-y-10">
                                    {steps.map((step, index) => {
                                        const status = getStepStatus(step.status);
                                        const isCompleted = status === 'completed';

                                        return (
                                            <div key={step.status} className="flex gap-6 relative">
                                                {index < steps.length - 1 ? (
                                                    <div className={`absolute left-7 top-14 bottom-[-40px] w-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-100'}`}></div>
                                                ) : null}
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-[11px] shrink-0 z-10 font-black ${isCompleted ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-50 text-gray-300'}`}>
                                                    {isCompleted ? 'OK' : step.status.slice(0, 2).toUpperCase()}
                                                </div>
                                                <div className="pt-2">
                                                    <p className={`font-black text-sm uppercase tracking-wider ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                                                        {step.name}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Delivery Address</h3>
                            <div className="text-gray-600 space-y-2 font-medium">
                                <p className="text-gray-900 font-black text-lg">{order.shipping_name}</p>
                                <p>{order.shipping_phone}</p>
                                <p className="leading-relaxed bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                    {order.shipping_address}<br />
                                    {order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 flex flex-col justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Need help with this order?</h3>
                                <p className="text-gray-500 mb-6 font-medium leading-relaxed">If you have not received your order yet or have questions about the products, our team is here for you.</p>
                            </div>
                            <div className="space-y-3">
                                <Link href="/contact" className="block w-full">
                                    <Button variant="primary" fullWidth className="rounded-xl font-bold py-4">Contact Support</Button>
                                </Link>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 p-8 mt-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-8">Package Contents</h2>
                        <div className="space-y-6">
                            {order.order_items?.map((item, index) => (
                                <div key={`order-item-${index}`} className="flex items-center gap-6 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
                                    <div className="w-24 h-24 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 shadow-inner">
                                        {item.product?.image_url ? (
                                            <img src={item.product.image_url} alt={item.product_title_en} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-gray-200">
                                                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" /></svg>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-black text-gray-900 text-lg truncate mb-1">{item.product_title_en}</p>
                                        <p className="text-sm font-bold text-gray-400">Qty: <span className="text-green-600">{item.quantity}</span> x Rs {Number(item.unit_price).toFixed(2)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-gray-900 text-xl">Rs {(item.quantity * Number(item.unit_price)).toFixed(2)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
