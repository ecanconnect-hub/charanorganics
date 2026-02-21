/**
 * Track Order Page
 * 
 * Allow users to track their order status
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion } from 'framer-motion';

export default function TrackOrderPage() {
    const router = useRouter();
    const [orderId, setOrderId] = useState('');
    const [phone, setPhone] = useState('');
    const [loading, setLoading] = useState(false);

    const handleTrack = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!orderId.trim() || !phone.trim()) return;

        setLoading(true);
        // Navigate to the order tracking page with phone as query param for verification
        const searchParams = new URLSearchParams();
        searchParams.set('phone', phone.trim());
        router.push(`/track-order/${orderId.trim()}?${searchParams.toString()}`);
    };

    return (
        <main className="min-h-[70vh]">
            {/* Safe top spacing to avoid header overlap */}
            <div className="h-24 md:h-28"></div>
            <div className="section-padding flex items-center">
                <div className="container mx-auto px-4">
                    <div className="max-w-2xl mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center mb-12"
                        >
                            <span className="inline-block text-green-600 font-black uppercase tracking-[0.4em] text-[10px] md:text-xs mb-6 px-4 py-2 bg-green-50 rounded-full border border-green-100">
                                Order Tracking
                            </span>
                            <h1 className="text-4xl md:text-6xl font-black text-gray-900 mb-6 tracking-tighter leading-tight">
                                Track Your Order
                            </h1>
                            <p className="text-lg text-gray-600 font-medium leading-relaxed">
                                Enter your order ID to check the current status of your delivery
                            </p>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.2 }}
                            className="bg-white rounded-[3rem] shadow-2xl p-8 md:p-12 border border-gray-100"
                        >
                            <form onSubmit={handleTrack} className="space-y-8">
                                <div>
                                    <label className="block text-sm font-black uppercase tracking-widest text-gray-400 mb-4">
                                        Order ID
                                    </label>
                                    <Input
                                        value={orderId}
                                        onChange={(e) => setOrderId(e.target.value)}
                                        placeholder="ORD-YYYYMMDD-XXX"
                                        required
                                        className="h-16 text-lg rounded-2xl"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-black uppercase tracking-widest text-gray-400 mb-4">
                                        Phone Number (for verification)
                                    </label>
                                    <Input
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="Enter phone used during checkout"
                                        required
                                        type="tel"
                                        className="h-16 text-lg rounded-2xl"
                                    />
                                    <p className="text-xs text-gray-400 mt-3 font-medium">
                                        For your privacy, we require your phone number to show order details
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    variant="primary"
                                    size="lg"
                                    fullWidth
                                    isLoading={loading}
                                    className="h-16 text-sm font-black uppercase tracking-widest rounded-2xl shadow-2xl shadow-green-200"
                                >
                                    Track Order
                                </Button>
                            </form>

                            <div className="mt-12 pt-8 border-t border-gray-100">
                                <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-6">
                                    Need Help?
                                </h3>
                                <div className="grid sm:grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl">
                                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
                                            📧
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-wide text-gray-900 mb-1">Email Us</p>
                                            <p className="text-xs text-gray-600 font-medium">ecanconnect@gmail.com</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-2xl">
                                        <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0 text-xl">
                                            📞
                                        </div>
                                        <div>
                                            <p className="text-xs font-black uppercase tracking-wide text-gray-900 mb-1">Call Us</p>
                                            <p className="text-xs text-gray-600 font-medium">+91 824 783 8125</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </main>
    );
}

