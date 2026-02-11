/**
 * Track Order Page
 * 
 * Track order status and shipping
 */

'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase/client';

export default function TrackOrderPage() {
    const params = useParams();
    const orderId = params.orderId as string;
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (orderId) {
            fetchOrder();
        }
    }, [orderId]);

    const fetchOrder = async () => {
        setLoading(true);

        const searchParams = new URLSearchParams(window.location.search);
        const phone = searchParams.get('phone') || '';

        try {
            const { data, error } = await (supabase as any).rpc('get_order_tracking', {
                p_order_id: orderId,
                p_phone: phone
            });

            if (error || !data) {
                setOrder(null);
            } else {
                setOrder({
                    ...(data as any).order,
                    order_items: (data as any).items
                });
            }
        } catch (err) {
            setOrder(null);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    if (!order) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <p className="text-xl text-gray-600 mb-4">Order not found</p>
                    <Link href="/account/orders">
                        <Button variant="primary">View My Orders</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const steps = [
        { name: 'Order Placed', status: 'pending_payment', icon: '📦' },
        { name: 'Payment Verification', status: 'payment_verification', icon: '⏳' },
        { name: 'Confirmed', status: 'confirmed', icon: '✓' },
        { name: 'Shipped', status: 'shipped', icon: '🚚' },
        { name: 'Delivered', status: 'delivered', icon: '🎉' },
    ];

    // Helper to determine step status
    const getStepStatus = (stepStatus: string) => {
        const statusOrder = ['pending_payment', 'payment_verification', 'confirmed', 'shipped', 'delivered', 'cancelled'];
        const currentIdx = statusOrder.indexOf(order.status);
        const stepIdx = statusOrder.indexOf(stepStatus);

        if (order.status === 'cancelled') return 'cancelled';
        return stepIdx <= currentIdx ? 'completed' : 'pending';
    };

    const currentStepIndex = steps.findIndex(step => step.status === order.status);

    return (
        <main className="bg-gray-50/50 min-h-screen">
            {/* Safe top spacing to avoid header overlap */}
            <div className="h-24 md:h-28"></div>
            <div className="section-padding">
                <div className="container mx-auto px-4 max-w-4xl">
                    <div className="mb-8 flex items-center gap-4">
                        <Link href="/account/orders">
                            <button className="p-2 hover:bg-white rounded-full transition-colors group">
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

                    {/* Order Summary Header */}
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 p-8 mb-8">
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                            <div>
                                <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-1">Order Number</p>
                                <p className="font-mono font-bold text-gray-900 text-lg">#{order.order_id}</p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-1">Estimated Delivery</p>
                                <p className="font-bold text-gray-900 text-lg">
                                    {new Date(new Date(order.created_at).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                                </p>
                            </div>
                            <div>
                                <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-1">Total Paid</p>
                                <p className="text-2xl font-black text-green-600">₹{order.total_amount.toFixed(2)}</p>
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

                    {/* Tracking Timeline */}
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 p-10 mb-8 overflow-hidden">
                        <h2 className="text-xl font-bold text-gray-900 mb-12 flex items-center gap-3">
                            <span className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center text-green-600">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </span>
                            Delivery Progress
                        </h2>

                        {order.status === 'cancelled' ? (
                            <div className="text-center py-12">
                                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6 text-red-500">
                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 mb-2">Order Cancelled</h3>
                                <p className="text-gray-500">This order was not processed further.</p>
                            </div>
                        ) : (
                            <div className="relative">
                                {/* Desktop Timeline */}
                                <div className="hidden md:block">
                                    <div className="absolute top-8 left-0 right-0 h-1.5 bg-gray-100 rounded-full">
                                        <div
                                            className="h-full bg-green-500 rounded-full transition-all duration-1000 shadow-[0_0_15px_rgba(34,197,94,0.4)]"
                                            style={{ width: `${(steps.findIndex(s => s.status === order.status) / (steps.length - 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                    <div className="relative flex justify-between">
                                        {steps.map((step, index) => {
                                            const status = getStepStatus(step.status);
                                            const isCompleted = status === 'completed';
                                            const isCurrent = step.status === order.status;

                                            return (
                                                <div key={step.status} className="flex flex-col items-center flex-1">
                                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl mb-4 z-10 transition-all duration-500 ${isCompleted
                                                        ? 'bg-green-600 text-white shadow-xl shadow-green-200 scale-110'
                                                        : 'bg-white text-gray-300 ring-2 ring-gray-100'
                                                        } ${isCurrent ? 'ring-4 ring-green-100' : ''}`}>
                                                        {isCompleted ? (
                                                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                        ) : step.icon}
                                                    </div>
                                                    <p className={`text-xs font-black uppercase tracking-widest text-center max-w-[100px] ${isCompleted ? 'text-gray-900' : 'text-gray-400'
                                                        }`}>
                                                        {step.name}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {/* Mobile Timeline (Vertical) */}
                                <div className="md:hidden space-y-10">
                                    {steps.map((step, index) => {
                                        const status = getStepStatus(step.status);
                                        const isCompleted = status === 'completed';
                                        const isCurrent = step.status === order.status;

                                        return (
                                            <div key={step.status} className="flex gap-6 relative">
                                                {index < steps.length - 1 && (
                                                    <div className={`absolute left-7 top-14 bottom-[-40px] w-0.5 ${isCompleted ? 'bg-green-500' : 'bg-gray-100'}`}></div>
                                                )}
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-xl shrink-0 z-10 ${isCompleted ? 'bg-green-600 text-white shadow-lg' : 'bg-gray-50 text-gray-300'
                                                    }`}>
                                                    {isCompleted ? (
                                                        <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" /></svg>
                                                    ) : step.icon}
                                                </div>
                                                <div className="pt-2">
                                                    <p className={`font-black text-sm uppercase tracking-wider ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                                                        {step.name}
                                                    </p>
                                                    {isCurrent && <p className="text-xs text-green-600 font-bold mt-1 italic">Last Update: Just Now</p>}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Shipping Card */}
                        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 p-8">
                            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                                <span className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center text-blue-600">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                </span>
                                Delivery Address
                            </h3>
                            <div className="text-gray-600 space-y-2 font-medium">
                                <p className="text-gray-900 font-black text-lg">{order.shipping_name}</p>
                                <p className="flex items-center gap-2"><svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>{order.shipping_phone}</p>
                                <p className="leading-relaxed bg-gray-50/50 p-4 rounded-2xl border border-gray-100">
                                    {order.shipping_address}<br />
                                    {order.shipping_city}, {order.shipping_state} - {order.shipping_pincode}
                                </p>
                            </div>
                        </div>

                        {/* Support Card */}
                        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 p-8 flex flex-col justify-between">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-4">Need help with this order?</h3>
                                <p className="text-gray-500 mb-6 font-medium leading-relaxed">If you haven't received your order yet or have questions about the products, our team is here for you.</p>
                            </div>
                            <div className="space-y-3">
                                <Link href="/contact" className="block w-full">
                                    <Button variant="primary" fullWidth className="rounded-xl font-bold py-4">Contact Support</Button>
                                </Link>
                                <button className="w-full py-4 text-sm font-black text-gray-400 uppercase tracking-widest hover:text-red-500 transition-colors">Cancel Order Request</button>
                            </div>
                        </div>
                    </div>

                    {/* Items Card */}
                    <div className="bg-white rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-100 p-8 mt-8">
                        <h2 className="text-xl font-bold text-gray-900 mb-8">Package Contents</h2>
                        <div className="space-y-6">
                            {order.order_items?.map((item: any, index: number) => (
                                <div key={index} className="flex items-center gap-6 pb-6 border-b border-gray-50 last:border-0 last:pb-0">
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
                                        <p className="text-sm font-bold text-gray-400">Qty: <span className="text-green-600">{item.quantity}</span> × ₹{item.unit_price}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-gray-900 text-xl">₹{(item.quantity * item.unit_price).toFixed(2)}</p>
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
