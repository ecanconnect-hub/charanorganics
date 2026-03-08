'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth/context';
import { useCart } from '@/lib/cart-context';
import { supabase } from '@/lib/supabase/client';

export default function AccountPage() {
    const router = useRouter();
    const { user, loading, signOut } = useAuth();
    const { items: cartItems } = useCart();
    const [profile, setProfile] = useState<any>(null);
    const [orderCount, setOrderCount] = useState(0);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        async function fetchDashboardData() {
            if (user) {
                try {
                    // Fetch profile
                    const { data: profileData, error: profileError } = await supabase
                        .from('profiles')
                        .select('*')
                        .eq('id', user.id)
                        .maybeSingle();

                    if (profileError) {
                        console.error('Profile fetch error:', {
                            message: profileError.message,
                            code: profileError.code,
                            hint: profileError.hint,
                            details: profileError.details,
                            userId: user.id,
                            timestamp: new Date().toISOString()
                        });

                        // Log specific error types
                        if (profileError.message?.includes('JWT')) {
                            console.error('⚠️ Authentication error - user session may be invalid');
                        } else if (profileError.message?.includes('permission') || profileError.code === '42501') {
                            console.error('⚠️ Permission denied - check RLS policies on profiles table');
                        } else if (profileError.message?.includes('relation') || profileError.code === '42P01') {
                            console.error('⚠️ Table not found - profiles table may not exist');
                        } else if (!profileError.message) {
                            console.error('⚠️ Empty error object - possible network or CORS issue');
                            console.error('⚠️ This usually means Supabase project is paused or there is a network issue');
                        }
                    }

                    if (profileData) {
                        setProfile(profileData);
                    } else {
                        console.warn('No profile found for user:', user.id);
                    }

                    // Fetch order count
                    const { count } = await (supabase
                        .from('orders') as any)
                        .select('id', { count: 'exact', head: true })
                        .eq('user_id', user.id);

                    setOrderCount(count || 0);
                } catch (error) {
                    console.error('Error fetching dashboard data:', error);
                } finally {
                    setFetching(false);
                }
            }
        }

        if (user) {
            fetchDashboardData();
        }
    }, [user]);

    if (loading || (fetching && user)) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center"
                >
                    <div className="w-16 h-16 border-4 border-green-200 border-t-green-600 rounded-full animate-spin mb-4 shadow-lg"></div>
                    <p className="text-gray-500 font-medium tracking-wide">Syncing your account...</p>
                </motion.div>
            </div>
        );
    }

    if (!user) {
        return (
            <main className="section-padding min-h-[70vh] flex flex-col items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center max-w-md"
                >
                    <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                        <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">Please Login</h1>
                    <p className="text-gray-600 mb-10 leading-relaxed">
                        To access your personalized dashboard, view your orders, and manage your profile details, please sign in to your account.
                    </p>
                    <Link href="/login">
                        <Button variant="primary" size="lg" className="px-16 rounded-full shadow-xl hover:shadow-green-200/50 transition-all font-bold">
                            Sign In Now
                        </Button>
                    </Link>
                </motion.div>
            </main>
        );
    }

    const menus = [
        {
            title: 'My Orders',
            desc: 'Order history & tracking',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            ),
            link: '/account/orders',
            color: 'bg-green-50 text-green-600'
        },
        {
            title: 'Profile Settings',
            desc: 'Edit name & details',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
            ),
            link: '/account/profile',
            color: 'bg-blue-50 text-blue-600'
        },
        {
            title: 'Saved Addresses',
            desc: 'Manage shipping locations',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            link: '/account/addresses',
            color: 'bg-orange-50 text-orange-600'
        },
        {
            title: 'Wishlist',
            desc: 'Your favorite products',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            ),
            link: '/account/wishlist',
            color: 'bg-pink-50 text-pink-600'
        },
        {
            title: 'My Cart',
            desc: 'Review items in cart',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 114 0z" />
                </svg>
            ),
            link: '/cart',
            color: 'bg-indigo-50 text-indigo-600'
        },
        {
            title: 'Security',
            desc: 'Update password & security',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
            ),
            link: '/account/security',
            color: 'bg-purple-50 text-purple-600'
        },
        {
            title: 'Support',
            desc: 'Get help or contact us',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
            ),
            link: '/contact',
            color: 'bg-teal-50 text-teal-600'
        },
    ];

    return (
        <main className="section-padding bg-gray-50/50 min-h-screen">
            {/* Safe top spacing to avoid header overlap */}
            <div className="h-24 md:h-28"></div>

            <div className="container mx-auto px-4 max-w-6xl">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 mb-2 tracking-tight">My Account</h1>
                        <p className="text-gray-500 font-medium">Welcome back! Here&apos;s an overview of your activity.</p>
                    </div>
                    <div className="h-0.5 flex-1 bg-gradient-to-r from-green-100 to-transparent mx-8 hidden md:block self-center"></div>
                </div>

                {/* Mobile: Profile First, Desktop: Stats First */}
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Profile Card - Shows first on mobile, left side on desktop */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="w-full lg:w-1/3 bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100 relative overflow-hidden group order-1 lg:order-1"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110 duration-700 opacity-50"></div>

                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-600 rounded-3xl flex items-center justify-center text-3xl font-bold text-white shadow-lg mb-6 ring-4 ring-white">
                                {profile?.full_name ? profile.full_name[0].toUpperCase() : user.email?.[0].toUpperCase()}
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-1 leading-tight">{profile?.full_name || 'Valued User'}</h2>
                            <p className="text-gray-500 font-medium mb-6 flex items-center gap-1.5 break-all px-2">
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                {user.email}
                            </p>

                            <div className="w-full space-y-3 pt-6 border-t border-gray-100">
                                {profile?.phone && (
                                    <div className="flex items-center justify-between text-sm py-1">
                                        <span className="text-gray-400 font-medium uppercase tracking-wider text-[10px]">Phone</span>
                                        <span className="text-gray-700 font-bold">{profile.phone}</span>
                                    </div>
                                )}
                                <div className="flex items-center justify-between text-sm py-1">
                                    <span className="text-gray-400 font-medium uppercase tracking-wider text-[10px]">Member Since</span>
                                    <span className="text-gray-700 font-bold">
                                        {profile?.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'Feb 2026'}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between text-sm py-1">
                                    <span className="text-gray-400 font-medium uppercase tracking-wider text-[10px]">Verified Status</span>
                                    <span className="flex items-center gap-1 text-green-600 font-bold italic">
                                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.64.304 1.24.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                                        Verified
                                    </span>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats Column - Shows second on mobile, right side on desktop */}
                    <div className="w-full lg:w-2/3 flex flex-col gap-6 order-2 lg:order-2">
                        {/* Stats Row */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <StatCard
                                label="Total Orders"
                                value={orderCount}
                                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>}
                                color="text-green-600"
                                bg="bg-green-100/50"
                            />
                            <StatCard
                                label="Wishlist Items"
                                value={0}
                                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" /></svg>}
                                color="text-pink-600"
                                bg="bg-pink-100/50"
                            />
                            <StatCard
                                label="Cart Summary"
                                value={cartItems.length}
                                icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                                color="text-blue-600"
                                bg="bg-blue-100/50"
                            />
                        </div>

                        {/* Dashboard Grid */}
                        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <AnimatePresence>
                                {menus.map((item, index) => (
                                    <motion.div
                                        key={item.title}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.05 }}
                                    >
                                        <Link href={item.link}>
                                            <div className="bg-white rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 group flex items-start gap-4">
                                                <div className={`${item.color} w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-110 duration-300`}>
                                                    {item.icon}
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-gray-900 group-hover:text-green-600 transition-colors">{item.title}</h3>
                                                    <p className="text-sm text-gray-500 leading-tight">{item.desc}</p>
                                                </div>
                                                <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
                                                </div>
                                            </div>
                                        </Link>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* Sign Out Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: menus.length * 0.05 }}
                                className="md:col-span-2 mt-4"
                            >
                                <button
                                    onClick={() => signOut()}
                                    className="w-full bg-white rounded-2xl p-6 shadow-sm border-2 border-dashed border-gray-200 hover:border-red-200 hover:bg-red-50/30 transition-all group flex items-center justify-center gap-4 text-gray-500 hover:text-red-500 font-bold"
                                >
                                    <svg className="w-6 h-6 transform group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                    Sign Out Safely
                                </button>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}

function StatCard({ label, value, icon, color, bg }: { label: string, value: number, icon: React.ReactNode, color: string, bg: string }) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            className="bg-white rounded-3xl p-6 shadow-lg shadow-gray-200/50 border border-gray-100 flex items-center gap-6"
        >
            <div className={`${bg} ${color} w-16 h-16 rounded-2xl flex items-center justify-center shadow-inner`}>
                {icon}
            </div>
            <div>
                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest leading-none mb-1.5">{label}</p>
                <p className="text-3xl font-black text-gray-900 leading-none">{value}</p>
            </div>
        </motion.div>
    );
}
