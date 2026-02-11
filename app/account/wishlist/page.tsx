'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth/context';
import { useLocale } from '@/lib/i18n/context';
import toast from 'react-hot-toast';

export default function WishlistPage() {
    const { user, loading: authLoading } = useAuth();
    const locale = useLocale();
    const [wishlistItems, setWishlistItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchWishlist = async () => {
        if (!user) return;

        try {
            setLoading(true);
            const { data, error } = await (supabase
                .from('wishlist') as any)
                .select(`
                    id,
                    product_id,
                    products (*)
                `)
                .eq('user_id', user.id);

            if (error) throw error;
            setWishlistItems(data || []);
        } catch (error) {
            console.error('Error fetching wishlist:', error);
            toast.error('Failed to load wishlist');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!authLoading) {
            if (user) {
                fetchWishlist();
            } else {
                setLoading(false);
            }
        }
    }, [user, authLoading]);

    const removeFromWishlist = async (id: string, productId: string) => {
        try {
            const { error } = await (supabase
                .from('wishlist') as any)
                .delete()
                .eq('id', id);

            if (error) throw error;

            setWishlistItems(prev => prev.filter(item => item.id !== id));
            toast.success('Removed from wishlist');
        } catch (error) {
            toast.error('Failed to remove item');
        }
    };

    if (loading || authLoading) {
        return (
            <main className="section-padding bg-gray-50/50 min-h-screen">
                {/* Safe top spacing to avoid header overlap */}
                <div className="h-24 md:h-28"></div>

                <div className="container mx-auto px-4 max-w-4xl text-center">
                    <div className="animate-spin w-10 h-10 border-4 border-green-600 border-t-transparent rounded-full mx-auto"></div>
                    <p className="mt-4 text-gray-400 font-black uppercase tracking-widest text-xs">Connecting to Soul...</p>
                </div>
            </main>
        );
    }

    if (!user) {
        return (
            <main className="section-padding bg-gray-50/50 min-h-screen">
                {/* Safe top spacing to avoid header overlap */}
                <div className="h-24 md:h-28"></div>

                <div className="container mx-auto px-4 max-w-4xl text-center">
                    <h1 className="text-3xl font-black text-gray-900 mb-4">Please Log In</h1>
                    <p className="text-gray-500 mb-10">You need to be logged in to view your wishlist.</p>
                    <Link href="/login">
                        <Button variant="primary" className="px-12 rounded-full font-bold">Log In Now</Button>
                    </Link>
                </div>
            </main>
        );
    }

    return (
        <main className="section-padding bg-gray-50/50 min-h-screen">
            {/* Safe top spacing to avoid header overlap */}
            <div className="h-24 md:h-28"></div>

            <div className="container mx-auto px-4 max-w-5xl">
                <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-4 mb-4">
                            <Link href="/account">
                                <button className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm hover:text-green-600 transition-all border border-gray-100">
                                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg>
                                </button>
                            </Link>
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-green-600">My Collection</span>
                        </div>
                        <h1 className="text-5xl font-black text-gray-900 tracking-tighter">Wishlist</h1>
                    </div>
                    <div className="text-right">
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest">{wishlistItems.length} Saved Essentials</p>
                    </div>
                </div>

                <AnimatePresence mode="wait">
                    {wishlistItems.length > 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-1 md:grid-cols-2 gap-6"
                        >
                            {wishlistItems.map((item) => {
                                const product = item.products;
                                if (!product) return null;

                                const title = locale === 'en' ? product.title_en : product.title_te;

                                return (
                                    <motion.div
                                        key={item.id}
                                        layout
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        className="bg-white rounded-[2rem] p-6 flex gap-6 shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-gray-200/50 transition-all group"
                                    >
                                        <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                                            <Image
                                                src={product.image_url}
                                                alt={title}
                                                fill
                                                className="object-cover group-hover:scale-110 transition-transform duration-500"
                                            />
                                        </div>
                                        <div className="flex-1 flex flex-col justify-between py-1">
                                            <div>
                                                <div className="flex justify-between items-start">
                                                    <h3 className="text-lg font-black text-gray-900 line-clamp-1 italic tracking-tight mb-1">{title}</h3>
                                                    <button
                                                        onClick={() => removeFromWishlist(item.id, item.product_id)}
                                                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                                        title="Remove"
                                                    >
                                                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" /></svg>
                                                    </button>
                                                </div>
                                                <p className="text-xs font-black text-green-600 uppercase tracking-widest">₹{product.current_price}</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <Link href={`/product/${product.product_id}`} className="flex-1">
                                                    <Button variant="primary" size="sm" className="w-full rounded-xl text-[10px] font-black tracking-widest uppercase py-4">
                                                        View Product
                                                    </Button>
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-[3rem] p-20 text-center shadow-xl shadow-gray-200/50 border border-gray-100"
                        >
                            <div className="w-24 h-24 bg-pink-50 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner ring-8 ring-white transform -rotate-6">
                                <svg className="w-12 h-12 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                </svg>
                            </div>
                            <h2 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter italic">Your collection is empty</h2>
                            <p className="text-gray-500 mb-10 max-w-sm mx-auto leading-relaxed font-medium">
                                Start saving items you love to your personal collection so you can easily find them later.
                            </p>
                            <Link href="/shop">
                                <Button variant="primary" size="lg" className="px-12 rounded-2xl shadow-2xl shadow-green-100 font-black uppercase tracking-widest text-xs h-16">
                                    Explore Discoveries
                                </Button>
                            </Link>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </main>
    );
}
