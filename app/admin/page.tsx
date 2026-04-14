/**
 * Admin Dashboard - Redesigned with Inline Views
 * 
 * Features:
 * - Inline order management (no page navigation)
 * - Clean, professional UI
 * - Better color scheme
 * - Mobile responsive
 */

'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';

type ViewType = 'dashboard' | 'orders' | 'products';
type OrderStatus = 'pending_payment' | 'payment_verification' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
type PaymentStatus = 'pending' | 'verified' | 'rejected';
type RecentProofOrder = {
    id: string;
    status: PaymentStatus;
    created_at: string;
    verified_at: string | null;
    utr_number: string | null;
    order: {
        id: string;
        order_id: string;
        total_amount: number | string | null;
        status: OrderStatus;
        created_at: string;
        profile: {
            full_name: string | null;
            email: string | null;
        } | null;
    } | null;
};

const revenueStatuses: OrderStatus[] = ['confirmed', 'processing', 'shipped', 'delivered'];
const pendingStatuses: OrderStatus[] = ['pending_payment', 'payment_verification'];
const adminVisibleOrderStatuses: OrderStatus[] = ['payment_verification', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const getPaymentStatusClasses = (status?: PaymentStatus) => {
    if (status === 'verified') return 'bg-green-100 text-green-800';
    if (status === 'rejected') return 'bg-red-100 text-red-800';
    return 'bg-blue-100 text-blue-800';
};

const getOrderStatusClasses = (status?: OrderStatus) => {
    if (status === 'confirmed' || status === 'processing') return 'bg-blue-100 text-blue-800';
    if (status === 'shipped') return 'bg-indigo-100 text-indigo-800';
    if (status === 'delivered') return 'bg-green-100 text-green-800';
    if (status === 'cancelled') return 'bg-red-100 text-red-800';
    return 'bg-yellow-100 text-yellow-800';
};

export default function AdminDashboard() {
    const { user, loading: authLoading } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [accessChecked, setAccessChecked] = useState(false);
    const [currentView, setCurrentView] = useState<ViewType>('dashboard');
    const [stats, setStats] = useState({
        totalOrders: 0,
        pendingOrders: 0,
        confirmedOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        totalUsers: 0,
        totalRevenue: 0,
        todayOrders: 0,
        monthlyRevenue: 0,
    });
    const [orders, setOrders] = useState<any[]>([]);
    const [recentProofOrders, setRecentProofOrders] = useState<RecentProofOrder[]>([]);

    const fetchStats = useCallback(async () => {
        try {
            const [{ data: ordersData, error: ordersError }, { count: usersCount, error: usersError }] = await Promise.all([
                (supabase.from('orders' as any) as any).select('status,total_amount,created_at'),
                (supabase.from('profiles' as any) as any).select('*', { count: 'exact', head: true }),
            ]);

            if (ordersError) {
                throw ordersError;
            }
            if (usersError) {
                throw usersError;
            }

            const orders = (ordersData ?? []) as Array<{
                status: OrderStatus;
                total_amount: number | string | null;
                created_at: string;
            }>;

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

            const totalOrders = orders.length;
            const pendingOrders = orders.filter((order) => pendingStatuses.includes(order.status)).length;
            const confirmedOrders = orders.filter((order) => order.status === 'confirmed' || order.status === 'processing').length;
            const shippedOrders = orders.filter((order) => order.status === 'shipped').length;
            const deliveredOrders = orders.filter((order) => order.status === 'delivered').length;
            const todayOrders = orders.filter((order) => new Date(order.created_at) >= today).length;

            const totalRevenue = orders
                .filter((order) => revenueStatuses.includes(order.status))
                .reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);

            const monthlyRevenue = orders
                .filter((order) => revenueStatuses.includes(order.status) && new Date(order.created_at) >= firstDayOfMonth)
                .reduce((sum, order) => sum + (Number(order.total_amount) || 0), 0);

            setStats({
                totalOrders,
                pendingOrders,
                confirmedOrders,
                shippedOrders,
                deliveredOrders,
                totalUsers: usersCount || 0,
                totalRevenue,
                todayOrders,
                monthlyRevenue,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    }, []);

    const fetchRecentProofOrders = useCallback(async () => {
        try {
            const { data } = await (supabase
                .from('payments' as any) as any)
                .select(`
          id,
          status,
          created_at,
          verified_at,
          utr_number,
          order:orders (
            id,
            order_id,
            total_amount,
            status,
            created_at,
            profile:profiles (full_name, email)
          )
        `)
                .order('created_at', { ascending: false })
                .limit(10);

            setRecentProofOrders((data || []) as RecentProofOrder[]);
        } catch (error) {
            console.error('Error fetching payment proof orders:', error);
        }
    }, []);

    const fetchAllOrders = useCallback(async () => {
        try {
            const { data } = await (supabase
                .from('orders' as any) as any)
                .select(`
          *,
          profile:profiles (full_name, email)
        `)
                .in('status', adminVisibleOrderStatuses)
                .order('created_at', { ascending: false });

            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching all orders:', error);
        }
    }, []);

    const refreshDashboard = useCallback(async () => {
        await Promise.all([fetchStats(), fetchRecentProofOrders(), fetchAllOrders()]);
    }, [fetchAllOrders, fetchRecentProofOrders, fetchStats]);

    const updateOrderStatus = async (orderId: string, newStatus: string) => {
        try {
            const { error } = await (supabase as any)
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (!error) {
                // SECURITY: Logic to ensure workflow consistency
                // If order is reverted to verification stage, reset payment status to 'pending'
                // so it reappears in the Payment Verification page.
                if (newStatus === 'pending_payment' || newStatus === 'payment_verification') {
                    const { error: paymentError } = await (supabase as any)
                        .from('payments')
                        .update({ status: 'pending' })
                        .eq('order_id', orderId);

                    if (paymentError) {
                        console.error('Failed to reset payment status:', paymentError);
                    }
                }

                void refreshDashboard();
            } else {
                console.error('Error updating order:', error);
            }
        } catch (error) {
            console.error('Error updating order:', error);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const checkAdminRole = async () => {
            if (authLoading) return;

            if (!user) {
                if (!isMounted) return;
                setIsAdmin(false);
                setAccessChecked(true);
                return;
            }

            const { data: profileData, error } = await (supabase
                .from('profiles' as any) as any)
                .select('role')
                .eq('id', user.id)
                .single();

            if (!isMounted) return;

            if (error || profileData?.role !== 'admin') {
                setIsAdmin(false);
                setAccessChecked(true);
                return;
            }

            setIsAdmin(true);
            setAccessChecked(true);
        };

        void checkAdminRole();

        return () => {
            isMounted = false;
        };
    }, [user, authLoading]);

    useEffect(() => {
        if (!authLoading && user && accessChecked && isAdmin) {
            void refreshDashboard();

            const refreshInterval = window.setInterval(() => {
                void refreshDashboard();
            }, 15000);

            const handleVisibilityRefresh = () => {
                if (document.visibilityState === 'visible') {
                    void refreshDashboard();
                }
            };

            window.addEventListener('focus', handleVisibilityRefresh);
            document.addEventListener('visibilitychange', handleVisibilityRefresh);

            const realtimeChannel = supabase
                .channel('admin-dashboard-live')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => {
                    void refreshDashboard();
                })
                .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
                    void fetchStats();
                })
                .subscribe();

            return () => {
                clearInterval(refreshInterval);
                window.removeEventListener('focus', handleVisibilityRefresh);
                document.removeEventListener('visibilitychange', handleVisibilityRefresh);
                void supabase.removeChannel(realtimeChannel);
            };
        }
    }, [user, authLoading, accessChecked, isAdmin, refreshDashboard, fetchStats]);


    if (authLoading || !accessChecked) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-indigo-600 border-t-transparent mb-4"></div>
                    <p className="text-gray-700 font-medium">Checking admin access...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return null;
    }

    return (
        <AdminLayout title="Dashboard" subtitle="Manage your store and orders">
            {/* Quick Action Buttons */}
            <div className="flex flex-wrap gap-3 mb-8">
                <button
                    onClick={() => setCurrentView('dashboard')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${currentView === 'dashboard'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300'
                        }`}
                >
                    📊 Dashboard
                </button>
                <button
                    onClick={() => setCurrentView('orders')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all ${currentView === 'orders'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300'
                        }`}
                >
                    📦 Orders ({orders.length})
                </button>
            </div>

            {/* Dashboard View */}
            {currentView === 'dashboard' && (
                <div className="space-y-8">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-2xl">
                                    📅
                                </div>
                                <span className="text-blue-600 text-sm font-semibold">Today</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.todayOrders}</p>
                            <p className="text-gray-600 text-sm">Orders Today</p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl">
                                    📦
                                </div>
                                <span className="text-green-600 text-sm font-semibold">All Time</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900 mb-1">{stats.totalOrders}</p>
                            <p className="text-gray-600 text-sm">Total Orders</p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-2xl">
                                    💰
                                </div>
                                <span className="text-purple-600 text-sm font-semibold">Total</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900 mb-1">₹{stats.totalRevenue.toFixed(0)}</p>
                            <p className="text-gray-600 text-sm">Total Revenue</p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                            <div className="flex items-center justify-between mb-4">
                                <div className="w-12 h-12 bg-pink-100 rounded-xl flex items-center justify-center text-2xl">
                                    📈
                                </div>
                                <span className="text-pink-600 text-sm font-semibold">This Month</span>
                            </div>
                            <p className="text-3xl font-bold text-gray-900 mb-1">₹{stats.monthlyRevenue.toFixed(0)}</p>
                            <p className="text-gray-600 text-sm">Monthly Revenue</p>
                        </div>
                    </div>

                    {/* Order Status */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">Order Status</h3>
                            <div className="space-y-4">
                                <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl border border-yellow-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-yellow-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                            {stats.pendingOrders}
                                        </div>
                                        <span className="font-semibold text-gray-900">Payment Queue</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                            {stats.confirmedOrders}
                                        </div>
                                        <span className="font-semibold text-gray-900">Confirmed</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-indigo-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                            {stats.shippedOrders}
                                        </div>
                                        <span className="font-semibold text-gray-900">Shipped</span>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                            {stats.deliveredOrders}
                                        </div>
                                        <span className="font-semibold text-gray-900">Delivered</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">User Statistics</h3>
                            <div className="text-center p-8 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100">
                                <p className="text-5xl font-bold text-indigo-600 mb-2">{stats.totalUsers}</p>
                                <p className="text-gray-700 font-semibold">Total Users</p>
                            </div>
                        </div>
                    </div>

                    {/* Quick Payment Review */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">Quick Payment Review</h3>
                                <p className="text-sm text-gray-500">Shows every order with submitted payment proof, plus payment and current order status.</p>
                            </div>
                            <Link
                                href="/admin/payments"
                                className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
                            >
                                Open Payments →
                            </Link>
                        </div>
                        <div className="overflow-x-auto">
                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-4 p-4">
                                {recentProofOrders.length === 0 && (
                                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">
                                        No payment proof orders yet.
                                    </div>
                                )}
                                {recentProofOrders.slice(0, 5).map((payment) => (
                                    <div key={payment.id} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 shadow-sm">
                                        <div className="flex justify-between items-start mb-3 border-b border-gray-200 pb-2">
                                            <div>
                                                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1">Order ID</span>
                                                {payment.order?.id ? (
                                                    <Link
                                                        href={`/admin/orders?order=${payment.order.id}`}
                                                        className="inline-flex whitespace-nowrap rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1 font-mono text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                                                    >
                                                        {payment.order.order_id}
                                                    </Link>
                                                ) : (
                                                    <span className="inline-flex whitespace-nowrap rounded-md border border-gray-200 bg-gray-100 px-3 py-1 font-mono text-xs font-bold text-gray-600">
                                                        Unknown
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${getPaymentStatusClasses(payment.status)}`}>
                                                Payment: {payment.status}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-500">Customer</span>
                                                <span className="text-sm font-bold text-gray-900">{payment.order?.profile?.full_name || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-500">Amount</span>
                                                <span className="text-sm font-bold text-gray-900">Rs. {Number(payment.order?.total_amount || 0).toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-500">Proof Date</span>
                                                <span className="text-xs font-medium text-gray-600">
                                                    {new Date(payment.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-500">Order Status</span>
                                                <span className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${getOrderStatusClasses(payment.order?.status)}`}>
                                                    {payment.order?.status || 'unknown'}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-500">UTR</span>
                                                <span className="font-mono text-xs font-semibold text-gray-700">{payment.utr_number || 'Not provided'}</span>
                                            </div>
                                            <div className="pt-2">
                                                <Link
                                                    href={payment.status === 'pending' ? '/admin/payments' : '/admin/orders'}
                                                    className={`block w-full rounded-lg px-3 py-2 text-center text-xs font-bold ${payment.status === 'pending'
                                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                                        : 'bg-white text-indigo-700 border border-indigo-200 hover:bg-indigo-50'
                                                        }`}
                                                >
                                                    {payment.status === 'pending' ? 'Verify Payment' : 'View Order Status'}
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View */}
                            <table className="hidden w-full min-w-[980px] md:table">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left py-3 px-6 font-semibold text-gray-700 text-sm">Order ID</th>
                                        <th className="text-left py-3 px-6 font-semibold text-gray-700 text-sm">Customer</th>
                                        <th className="text-left py-3 px-6 font-semibold text-gray-700 text-sm">Amount</th>
                                        <th className="text-left py-3 px-6 font-semibold text-gray-700 text-sm">Payment</th>
                                        <th className="text-left py-3 px-6 font-semibold text-gray-700 text-sm">Order</th>
                                        <th className="text-left py-3 px-6 font-semibold text-gray-700 text-sm">Proof Date</th>
                                        <th className="text-left py-3 px-6 font-semibold text-gray-700 text-sm">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {recentProofOrders.length === 0 && (
                                        <tr>
                                            <td colSpan={7} className="px-6 py-8 text-center text-sm text-gray-500">
                                                No payment proof orders yet.
                                            </td>
                                        </tr>
                                    )}
                                    {recentProofOrders.slice(0, 5).map((payment) => (
                                        <tr key={payment.id} className="hover:bg-gray-50">
                                            <td className="py-4 px-6">
                                                {payment.order?.id ? (
                                                    <Link
                                                        href={`/admin/orders?order=${payment.order.id}`}
                                                        className="inline-flex whitespace-nowrap rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1 font-mono text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                                                    >
                                                        {payment.order.order_id}
                                                    </Link>
                                                ) : (
                                                    <span className="inline-flex whitespace-nowrap rounded-md border border-gray-200 bg-gray-100 px-3 py-1 font-mono text-xs font-bold text-gray-600">
                                                        Unknown
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="font-semibold text-gray-900 text-sm">{payment.order?.profile?.full_name || 'N/A'}</p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="font-bold text-gray-900">Rs. {Number(payment.order?.total_amount || 0).toFixed(2)}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getPaymentStatusClasses(payment.status)}`}>
                                                    {payment.status}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${getOrderStatusClasses(payment.order?.status)}`}>
                                                    {payment.order?.status || 'unknown'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-gray-600">
                                                {new Date(payment.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="py-4 px-6">
                                                <Link
                                                    href={payment.status === 'pending' ? '/admin/payments' : '/admin/orders'}
                                                    className={`inline-flex rounded-lg px-3 py-2 text-xs font-bold ${payment.status === 'pending'
                                                        ? 'bg-green-600 text-white hover:bg-green-700'
                                                        : 'border border-indigo-200 bg-white text-indigo-700 hover:bg-indigo-50'
                                                        }`}
                                                >
                                                    {payment.status === 'pending' ? 'Verify Payment' : 'View Order Status'}
                                                </Link>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* Orders View */}
            {currentView === 'orders' && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900">Orders With Payment Proof ({orders.length})</h3>
                        <p className="mt-1 text-sm text-gray-500">
                            New checkout records stay hidden here until the customer submits UTR or a payment screenshot.
                        </p>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left py-3 px-6 font-semibold text-gray-700 text-sm">Order ID</th>
                                    <th className="text-left py-3 px-6 font-semibold text-gray-700 text-sm">Customer</th>
                                    <th className="text-left py-3 px-6 font-semibold text-gray-700 text-sm">Amount</th>
                                    <th className="text-left py-3 px-6 font-semibold text-gray-700 text-sm">Status</th>
                                    <th className="text-left py-3 px-6 font-semibold text-gray-700 text-sm">Date</th>
                                    <th className="text-left py-3 px-6 font-semibold text-gray-700 text-sm">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {orders.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">
                                            No proof-submitted orders yet.
                                        </td>
                                    </tr>
                                )}
                                {orders.map((order) => (
                                    <tr key={order.id} className="hover:bg-gray-50">
                                        <td className="py-4 px-6">
                                            <span className="font-mono text-xs font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                                                {order.order_id}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <p className="font-semibold text-gray-900 text-sm">{order.profile?.full_name}</p>
                                            <p className="text-xs text-gray-500">{order.profile?.email}</p>
                                        </td>
                                        <td className="py-4 px-6">
                                            <span className="font-bold text-gray-900">₹{order.total_amount.toFixed(2)}</span>
                                        </td>
                                        <td className="py-4 px-6">
                                            <select
                                                value={order.status}
                                                onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                                                className={`px-3 py-1 rounded-lg text-xs font-bold border-2 ${order.status === 'delivered' ? 'bg-green-50 text-green-800 border-green-200' :
                                                    order.status === 'shipped' ? 'bg-indigo-50 text-indigo-800 border-indigo-200' :
                                                        order.status === 'confirmed' ? 'bg-blue-50 text-blue-800 border-blue-200' :
                                                            'bg-yellow-50 text-yellow-800 border-yellow-200'
                                                    }`}
                                            >
                                                <option value="pending_payment">PENDING PAYMENT</option>
                                                <option value="payment_verification">PAYMENT VERIFICATION</option>
                                                <option value="confirmed">CONFIRMED</option>
                                                <option value="shipped">SHIPPED</option>
                                                <option value="delivered">DELIVERED</option>
                                                <option value="cancelled">CANCELLED</option>
                                            </select>
                                        </td>
                                        <td className="py-4 px-6 text-sm text-gray-600">
                                            {new Date(order.created_at).toLocaleDateString()}
                                        </td>
                                        <td className="py-4 px-6">
                                            <Link href="/admin/orders">
                                                <button className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm">
                                                    View Details (Go to Orders) →
                                                </button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
}
