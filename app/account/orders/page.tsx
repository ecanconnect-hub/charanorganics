/**
 * My Account - Order History
 * 
 * View all user orders
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';

export default function MyOrdersPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!authLoading && !user) {
            router.push('/login');
        } else if (user) {
            fetchOrders();
        }
    }, [user, authLoading, router]);

    const fetchOrders = async () => {
        if (!user) return;

        setLoading(true);
        const { data } = await supabase
            .from('orders' as any)
            .select(`
        *,
        order_items (
          quantity,
          unit_price,
          product_title_en,
          variant_label,
          product:products (image_url)
        )
      `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        setOrders(data || []);
        setLoading(false);
    };

    if (authLoading || loading) {
        return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
    }

    return (
        <main className="section-padding">
            {/* Safe top spacing to avoid header overlap */}
            <div className="h-24 md:h-28"></div>

            <div className="container mx-auto px-4 max-w-6xl">
                <div className="mb-8 flex items-center gap-4">
                    <Link href="/account">
                        <button className="p-2 hover:bg-white rounded-full transition-colors group">
                            <svg className="w-6 h-6 text-gray-400 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">My Orders</h1>
                        <p className="text-gray-500">View order history & track status</p>
                    </div>
                </div>

                {orders.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-20 bg-white rounded-3xl shadow-xl shadow-gray-200/50 border border-gray-100 max-w-2xl mx-auto"
                    >
                        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300">
                            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">No orders found</h2>
                        <p className="text-gray-500 mb-8 max-w-xs mx-auto">You haven't placed any orders yet. Start exploring our organic collection!</p>
                        <Link href="/shop">
                            <Button variant="primary" size="lg" className="rounded-full px-12 shadow-xl shadow-green-100 font-bold">
                                Start Shopping
                            </Button>
                        </Link>
                    </motion.div>
                ) : (
                    <div className="space-y-8">
                        {orders.map((order, idx) => (
                            <motion.div
                                key={order.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-white rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 overflow-hidden group hover:border-green-200 transition-all duration-500"
                            >
                                {/* Order Header */}
                                <div className="bg-gray-50/50 px-8 py-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="bg-white p-3 rounded-2xl shadow-sm ring-1 ring-gray-100">
                                            <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-0.5">Order ID</p>
                                            <p className="font-mono font-bold text-gray-900 leading-none">#{order.order_id}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-0.5">Placed On</p>
                                            <p className="font-bold text-gray-700 leading-none">
                                                {new Date(order.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 ml-auto">
                                        <div className="text-right">
                                            <p className="text-[10px] uppercase font-black text-gray-400 tracking-wider mb-0.5">Total Amount</p>
                                            <p className="text-2xl font-black text-green-600 leading-none">
                                                ₹{order.total_amount.toFixed(2)}
                                            </p>
                                        </div>
                                        <div className={`px-5 py-2 rounded-2xl text-xs font-black uppercase tracking-widest ring-1 ${order.status === 'delivered' ? 'bg-green-100 text-green-700 ring-green-200' :
                                            order.status === 'shipped' ? 'bg-blue-100 text-blue-700 ring-blue-200' :
                                                order.status === 'cancelled' ? 'bg-red-100 text-red-700 ring-red-200' :
                                                    'bg-yellow-100 text-yellow-700 ring-yellow-200'
                                            }`}>
                                            {order.status.replace('_', ' ')}
                                        </div>
                                    </div>
                                </div>

                                {/* Order Items */}
                                <div className="p-8">
                                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                                        <div className="lg:col-span-8 space-y-6">
                                            {order.order_items?.map((item: any, index: number) => (
                                                <div key={index} className="flex items-center gap-6 group/item">
                                                    <div className="w-20 h-20 bg-gray-50 rounded-2xl overflow-hidden flex-shrink-0 shadow-inner group-hover/item:scale-105 transition-transform duration-300">
                                                        {item.product?.image_url ? (
                                                            <img
                                                                src={item.product.image_url}
                                                                alt={item.product_title_en}
                                                                className="w-full h-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-gray-200">
                                                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M21 19V5a2 2 0 00-2-2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z" /></svg>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <h4 className="font-bold text-lg text-gray-900 truncate mb-0.5">{item.product_title_en}</h4>
                                                        <div className="flex items-center gap-3">
                                                            {item.variant_label && (
                                                                <span className="text-[10px] font-black text-green-600 uppercase bg-green-50 px-2 py-0.5 rounded-lg ring-1 ring-green-200">
                                                                    {item.variant_label}
                                                                </span>
                                                            )}
                                                            <p className="text-sm text-gray-500 font-medium">
                                                                {item.quantity} Unit{item.quantity > 1 ? 's' : ''} × ₹{item.unit_price}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <p className="font-bold text-gray-900 text-lg">
                                                        ₹{(item.quantity * item.unit_price).toFixed(2)}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Tracking & Actions */}
                                        <div className="lg:col-span-4 bg-gray-50/50 rounded-3xl p-6 flex flex-col justify-center gap-4">
                                            <Link href={`/track-order/${order.order_id}`} className="w-full">
                                                <Button variant="primary" fullWidth className="rounded-xl shadow-lg shadow-green-100 font-bold group/btn">
                                                    Track Status
                                                    <svg className="w-4 h-4 ml-2 transform group-hover/btn:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4 4H3" /></svg>
                                                </Button>
                                            </Link>
                                            <div className="grid grid-cols-2 gap-3">
                                                <Button variant="outline" size="sm" className="rounded-xl font-bold border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 shadow-sm">
                                                    Invoice
                                                </Button>
                                                <a href="https://wa.me/918247838125" target="_blank" rel="noopener noreferrer" className="block w-full">
                                                    <Button variant="outline" size="sm" fullWidth className="rounded-xl font-bold border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900 shadow-sm">
                                                        Help
                                                    </Button>
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
