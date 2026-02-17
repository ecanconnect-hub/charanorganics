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

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { AdminLayout } from '@/components/admin/AdminLayout';

type ViewType = 'dashboard' | 'orders' | 'products';

export default function AdminDashboard() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [isAdmin, setIsAdmin] = useState(false);
    const [checking, setChecking] = useState(true);
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
    const [recentOrders, setRecentOrders] = useState<any[]>([]);

    useEffect(() => {
        if (!authLoading && user) {
            setChecking(false);
            setIsAdmin(true);
            fetchStats();
            fetchRecentOrders();
            fetchAllOrders();
        }
    }, [user, authLoading]);

    const fetchStats = async () => {
        try {
            const { count: ordersCount } = await (supabase
                .from('orders' as any) as any)
                .select('*', { count: 'exact', head: true });

            const { count: pendingCount } = await (supabase
                .from('orders' as any) as any)
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            const { count: confirmedCount } = await (supabase
                .from('orders' as any) as any)
                .select('*', { count: 'exact', head: true })
                .eq('status', 'confirmed');

            const { count: shippedCount } = await (supabase
                .from('orders' as any) as any)
                .select('*', { count: 'exact', head: true })
                .eq('status', 'shipped');

            const { count: deliveredCount } = await (supabase
                .from('orders' as any) as any)
                .select('*', { count: 'exact', head: true })
                .eq('status', 'delivered');

            const { count: usersCount } = await (supabase
                .from('profiles' as any) as any)
                .select('*', { count: 'exact', head: true });

            const { data: deliveredOrders } = await (supabase
                .from('orders' as any) as any)
                .select('total_amount')
                .eq('status', 'delivered');

            const revenue = deliveredOrders?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0;

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const { count: todayCount } = await (supabase
                .from('orders' as any) as any)
                .select('*', { count: 'exact', head: true })
                .gte('created_at', today.toISOString());

            const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            const { data: monthlyOrders } = await (supabase
                .from('orders' as any) as any)
                .select('total_amount')
                .eq('status', 'delivered')
                .gte('created_at', firstDayOfMonth.toISOString());

            const monthlyRev = monthlyOrders?.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0) || 0;

            setStats({
                totalOrders: ordersCount || 0,
                pendingOrders: pendingCount || 0,
                confirmedOrders: confirmedCount || 0,
                shippedOrders: shippedCount || 0,
                deliveredOrders: deliveredCount || 0,
                totalUsers: usersCount || 0,
                totalRevenue: revenue,
                todayOrders: todayCount || 0,
                monthlyRevenue: monthlyRev,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchRecentOrders = async () => {
        try {
            const { data } = await (supabase
                .from('orders' as any) as any)
                .select(`
          *,
          profile:profiles (full_name, email)
        `)
                .order('created_at', { ascending: false })
                .limit(10);

            setRecentOrders(data || []);
        } catch (error) {
            console.error('Error fetching orders:', error);
        }
    };

    const fetchAllOrders = async () => {
        try {
            const { data } = await (supabase
                .from('orders' as any) as any)
                .select(`
          *,
          profile:profiles (full_name, email)
        `)
                .order('created_at', { ascending: false });

            setOrders(data || []);
        } catch (error) {
            console.error('Error fetching all orders:', error);
        }
    };

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

                fetchStats();
                fetchRecentOrders();
                fetchAllOrders();
            } else {
                console.error('Error updating order:', error);
            }
        } catch (error) {
            console.error('Error updating order:', error);
        }
    };


    if (authLoading || checking) {
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
                    📦 All Orders ({stats.totalOrders})
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
                                        <span className="font-semibold text-gray-900">Pending</span>
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

                    {/* Recent Orders */}
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-lg font-bold text-gray-900">Recent Orders</h3>
                            <button
                                onClick={() => setCurrentView('orders')}
                                className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
                            >
                                View All →
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            {/* Mobile Card View */}
                            <div className="md:hidden space-y-4 p-4">
                                {recentOrders.slice(0, 5).map((order) => (
                                    <div key={order.id} className="bg-gray-50/50 p-4 rounded-xl border border-gray-100 shadow-sm">
                                        <div className="flex justify-between items-start mb-3 border-b border-gray-200 pb-2">
                                            <div>
                                                <span className="text-[10px] text-gray-400 uppercase tracking-widest font-bold block mb-1">Order ID</span>
                                                <span className="font-mono text-sm font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">
                                                    {order.order_id}
                                                </span>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                order.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                                                    order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-yellow-100 text-yellow-800'
                                                }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-500">Customer</span>
                                                <span className="text-sm font-bold text-gray-900">{order.profile?.full_name || 'N/A'}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-500">Amount</span>
                                                <span className="text-sm font-bold text-gray-900">₹{order.total_amount.toFixed(2)}</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-xs text-gray-500">Date</span>
                                                <span className="text-xs font-medium text-gray-600">
                                                    {new Date(order.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Desktop Table View */}
                            <table className="w-full hidden md:table">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="text-left py-3 px-6 font-semibold text-gray-700 text-sm">Order ID</th>
                                        <th className="text-left py-3 px-6 font-semibold text-gray-700 text-sm">Customer</th>
                                        <th className="text-left py-3 px-6 font-semibold text-gray-700 text-sm">Amount</th>
                                        <th className="text-left py-3 px-6 font-semibold text-gray-700 text-sm">Status</th>
                                        <th className="text-left py-3 px-6 font-semibold text-gray-700 text-sm">Date</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {recentOrders.slice(0, 5).map((order) => (
                                        <tr key={order.id} className="hover:bg-gray-50">
                                            <td className="py-4 px-6">
                                                <span className="font-mono text-xs font-semibold text-gray-900 bg-gray-100 px-3 py-1 rounded-lg">
                                                    {order.order_id}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <p className="font-semibold text-gray-900 text-sm">{order.profile?.full_name}</p>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="font-bold text-gray-900">₹{order.total_amount.toFixed(2)}</span>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.status === 'delivered' ? 'bg-green-100 text-green-800' :
                                                    order.status === 'shipped' ? 'bg-indigo-100 text-indigo-800' :
                                                        order.status === 'confirmed' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {order.status.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-sm text-gray-600">
                                                {new Date(order.created_at).toLocaleDateString()}
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
                        <h3 className="text-lg font-bold text-gray-900">All Orders ({orders.length})</h3>
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
