'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type OrderRow = Database['public']['Tables']['orders']['Row'];
type OrderItemRow = Database['public']['Tables']['order_items']['Row'];
type PaymentRow = Database['public']['Tables']['payments']['Row'];

type UserOrderSummary = Pick<OrderRow, 'id' | 'order_id' | 'total_amount' | 'status' | 'created_at'>;
type UserOrderItem = Pick<OrderItemRow, 'id' | 'order_id' | 'product_title_en' | 'variant_label' | 'quantity' | 'unit_price' | 'total_price'>;
type UserPayment = Pick<PaymentRow, 'id' | 'order_id' | 'utr_number' | 'status' | 'payment_screenshot_url' | 'verified_at' | 'rejection_reason' | 'created_at'>;

type ProfileWithMetrics = ProfileRow & {
    ordersCount: number;
    totalSpent: number;
    lastOrder: UserOrderSummary | null;
};

type UserOrderDetail = OrderRow & {
    items: UserOrderItem[];
    payment: UserPayment[];
};

const formatCurrency = (value: number) => `Rs. ${(value || 0).toFixed(2)}`;

export default function AdminUsersPage() {
    const router = useRouter();
    const { user } = useAuth();

    const [profiles, setProfiles] = useState<ProfileWithMetrics[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    const [selectedUser, setSelectedUser] = useState<ProfileWithMetrics | null>(null);
    const [showOrdersModal, setShowOrdersModal] = useState(false);
    const [userOrders, setUserOrders] = useState<UserOrderDetail[]>([]);
    const [loadingUserOrders, setLoadingUserOrders] = useState(false);
    const [expandedOrderIds, setExpandedOrderIds] = useState<string[]>([]);

    useEffect(() => {
        void checkAdmin();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const checkAdmin = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        const { data: profileData } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profileData?.role !== 'admin') {
            router.push('/');
            return;
        }

        await fetchProfiles();
    };

    const fetchProfiles = async () => {
        setLoading(true);

        const [{ data: profileRowsData, error: profilesError }, { data: orderRowsData, error: ordersError }] = await Promise.all([
            supabase.from('profiles').select('*').order('created_at', { ascending: false }),
            supabase.from('orders').select('id, user_id, order_id, total_amount, status, created_at')
        ]);

        if (profilesError || ordersError) {
            toast.error('Failed to fetch users');
            setLoading(false);
            return;
        }

        const profileRows = (profileRowsData ?? []) as ProfileRow[];
        const orderRows = (orderRowsData ?? []) as Array<UserOrderSummary & Pick<OrderRow, 'user_id'>>;

        const ordersByUser: Record<string, UserOrderSummary[]> = {};
        for (const order of orderRows) {
            if (!ordersByUser[order.user_id]) {
                ordersByUser[order.user_id] = [];
            }
            ordersByUser[order.user_id].push(order);
        }

        const hydratedProfiles: ProfileWithMetrics[] = profileRows.map((profile) => {
            const profileOrders = ordersByUser[profile.id] ?? [];
            const totalSpent = profileOrders.reduce((sum, order) => sum + (order.total_amount || 0), 0);
            const lastOrder = profileOrders[0] ?? null;

            return {
                ...profile,
                ordersCount: profileOrders.length,
                totalSpent,
                lastOrder
            };
        });

        setProfiles(hydratedProfiles);
        setLoading(false);
    };

    const toggleRole = async (profileId: string, currentRole: ProfileRow['role']) => {
        const newRole: ProfileRow['role'] = currentRole === 'admin' ? 'customer' : 'admin';

        if (profileId === user?.id && currentRole === 'admin') {
            toast.error('You cannot remove your own admin access.');
            return;
        }

        const confirmed = confirm(`Change this user's role to ${newRole.toUpperCase()}?`);
        if (!confirmed) return;

        const { error } = await supabase
            .from('profiles')
            .update({ role: newRole })
            .eq('id', profileId);

        if (error) {
            toast.error('Failed to update role. Check security SQL scripts if needed.');
            return;
        }

        toast.success(`User role updated to ${newRole}`);
        await fetchProfiles();
    };

    const copyAddress = async (order: Pick<OrderRow, 'shipping_name' | 'shipping_phone' | 'shipping_address' | 'shipping_city' | 'shipping_state' | 'shipping_pincode'>) => {
        const fullAddress = [
            order.shipping_name,
            order.shipping_phone,
            order.shipping_address,
            order.shipping_city,
            order.shipping_state,
            order.shipping_pincode
        ]
            .filter(Boolean)
            .join(', ');

        try {
            await navigator.clipboard.writeText(fullAddress);
            toast.success('Address copied');
        } catch {
            toast.error('Could not copy address');
        }
    };

    const openUserOrders = async (profile: ProfileWithMetrics) => {
        setSelectedUser(profile);
        setShowOrdersModal(true);
        setExpandedOrderIds([]);
        setLoadingUserOrders(true);

        const { data: ordersRowsData, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .eq('user_id', profile.id)
            .order('created_at', { ascending: false });

        if (ordersError) {
            toast.error('Failed to load user orders');
            setLoadingUserOrders(false);
            return;
        }

        const ordersRows = (ordersRowsData ?? []) as OrderRow[];
        const internalOrderIds = ordersRows.map((row) => row.id);

        if (internalOrderIds.length === 0) {
            setUserOrders([]);
            setLoadingUserOrders(false);
            return;
        }

        const [{ data: itemRowsData }, { data: paymentRowsData }] = await Promise.all([
            supabase
                .from('order_items')
                .select('id, order_id, product_title_en, variant_label, quantity, unit_price, total_price')
                .in('order_id', internalOrderIds),
            supabase
                .from('payments')
                .select('id, order_id, utr_number, status, payment_screenshot_url, verified_at, rejection_reason, created_at')
                .in('order_id', internalOrderIds)
        ]);

        const itemRows = (itemRowsData ?? []) as UserOrderItem[];
        const paymentRows = (paymentRowsData ?? []) as UserPayment[];

        const itemsByOrder: Record<string, UserOrderItem[]> = {};
        for (const item of itemRows) {
            if (!itemsByOrder[item.order_id]) {
                itemsByOrder[item.order_id] = [];
            }
            itemsByOrder[item.order_id].push(item);
        }

        const paymentsByOrder: Record<string, UserPayment[]> = {};
        for (const payment of paymentRows) {
            if (!paymentsByOrder[payment.order_id]) {
                paymentsByOrder[payment.order_id] = [];
            }
            paymentsByOrder[payment.order_id].push(payment);
        }

        setUserOrders(
            ordersRows.map((order) => ({
                ...order,
                items: itemsByOrder[order.id] ?? [],
                payment: paymentsByOrder[order.id] ?? []
            }))
        );

        setLoadingUserOrders(false);
    };

    const toggleExpandedOrder = (orderId: string) => {
        setExpandedOrderIds((prev) => {
            if (prev.includes(orderId)) {
                return prev.filter((id) => id !== orderId);
            }
            return [...prev, orderId];
        });
    };

    const filteredProfiles = useMemo(
        () =>
            profiles.filter(
                (profile) =>
                    profile.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    profile.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
            ),
        [profiles, searchQuery]
    );

    if (loading && profiles.length === 0) {
        return (
            <AdminLayout title="User Management" subtitle="Manage roles and review customer order history">
                <div className="flex items-center justify-center py-20">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="User Management" subtitle="Manage roles and review customer order history">
            <div className="mb-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
                <div className="relative w-full sm:w-96">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">Search</span>
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                        className="w-full rounded-xl border border-gray-200 py-3 pl-20 pr-4 outline-none transition-all focus:ring-2 focus:ring-indigo-500"
                    />
                </div>
                <div className="text-sm font-medium text-gray-500">Total Users: {profiles.length}</div>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="space-y-3 p-3 md:hidden">
                    {filteredProfiles.map((profile) => (
                        <div key={profile.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{profile.full_name || 'No Name'}</p>
                                    <p className="text-xs text-gray-500">{profile.email}</p>
                                </div>
                                <span className={`rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${profile.role === 'admin'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-gray-100 text-gray-600'
                                    }`}>
                                    {profile.role}
                                </span>
                            </div>
                            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                                <div className="rounded-lg bg-white p-2">
                                    <p className="text-gray-500">Orders</p>
                                    <p className="font-bold text-gray-900">{profile.ordersCount}</p>
                                </div>
                                <div className="rounded-lg bg-white p-2">
                                    <p className="text-gray-500">Spend</p>
                                    <p className="font-bold text-gray-900">{formatCurrency(profile.totalSpent)}</p>
                                </div>
                            </div>
                            <p className="mt-2 text-xs text-gray-600">
                                {profile.lastOrder ? `Last: ${profile.lastOrder.order_id} (${profile.lastOrder.status})` : 'No orders yet'}
                            </p>
                            <div className="mt-3 flex flex-wrap gap-3">
                                <button
                                    onClick={() => void openUserOrders(profile)}
                                    className="text-xs font-bold text-indigo-700"
                                >
                                    View Orders
                                </button>
                                <button
                                    onClick={() => void toggleRole(profile.id, profile.role)}
                                    className={`text-xs font-bold ${profile.role === 'admin' ? 'text-red-600' : 'text-teal-600'
                                        }`}
                                >
                                    {profile.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[1100px] text-left">
                    <thead className="border-b border-gray-200 bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-gray-600">User</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-gray-600">Role</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-gray-600">Orders</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-gray-600">Total Spend</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-gray-600">Last Order</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-gray-600">Joined</th>
                            <th className="px-6 py-4 text-xs font-bold uppercase tracking-wide text-gray-600">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredProfiles.map((profile) => (
                            <tr key={profile.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4">
                                    <div className="font-bold text-gray-900">{profile.full_name || 'No Name'}</div>
                                    <div className="text-xs text-gray-500">{profile.email}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${profile.role === 'admin'
                                        ? 'bg-purple-100 text-purple-700'
                                        : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {profile.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-sm font-semibold text-gray-800">{profile.ordersCount || 0}</td>
                                <td className="px-6 py-4 text-sm font-semibold text-gray-800">{formatCurrency(profile.totalSpent || 0)}</td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {profile.lastOrder ? `${profile.lastOrder.order_id} (${profile.lastOrder.status})` : 'No orders'}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-500">{new Date(profile.created_at).toLocaleDateString()}</td>
                                <td className="px-6 py-4">
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => void openUserOrders(profile)}
                                            className="text-sm font-bold text-indigo-600 transition-colors hover:text-indigo-700"
                                        >
                                            View Orders
                                        </button>
                                        <button
                                            onClick={() => void toggleRole(profile.id, profile.role)}
                                            className={`text-sm font-bold transition-colors ${profile.role === 'admin'
                                                ? 'text-red-600 hover:text-red-700'
                                                : 'text-teal-600 hover:text-teal-700'
                                                }`}
                                        >
                                            {profile.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                </div>

                {filteredProfiles.length === 0 && (
                    <div className="py-20 text-center text-gray-500">No users found matching your search.</div>
                )}
            </div>

            <Modal
                isOpen={showOrdersModal}
                onClose={() => setShowOrdersModal(false)}
                title={selectedUser ? `${selectedUser.full_name || selectedUser.email} - Orders` : 'User Orders'}
                size="xl"
            >
                {loadingUserOrders ? (
                    <div className="py-10 text-center text-gray-500">Loading orders...</div>
                ) : userOrders.length === 0 ? (
                    <div className="py-10 text-center text-gray-500">This user has no orders.</div>
                ) : (
                    <div className="space-y-4">
                        {userOrders.map((order) => {
                            const isOpen = expandedOrderIds.includes(order.id);
                            const totalUnits = order.items.reduce((sum, item) => sum + (item.quantity || 0), 0);

                            return (
                                <div key={order.id} className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                                    <button
                                        onClick={() => toggleExpandedOrder(order.id)}
                                        className="flex w-full items-center justify-between gap-3 border-b border-gray-100 bg-gray-50 px-4 py-3 text-left"
                                    >
                                        <div>
                                            <p className="font-mono text-xs font-bold text-indigo-700">{order.order_id}</p>
                                            <p className="text-xs text-gray-500">
                                                {new Date(order.created_at).toLocaleString('en-IN')} | {order.status.toUpperCase()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-bold text-gray-900">{formatCurrency(order.total_amount)}</p>
                                            <p className="text-xs text-gray-500">{totalUnits} units</p>
                                        </div>
                                    </button>

                                    {isOpen && (
                                        <div className="space-y-4 p-4">
                                            <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3">
                                                <div className="mb-2 flex items-center justify-between">
                                                    <p className="text-xs font-bold text-gray-800">Shipping Details</p>
                                                    <button
                                                        onClick={() => void copyAddress(order)}
                                                        className="rounded border border-indigo-300 bg-white px-2 py-1 text-xs font-semibold text-indigo-700"
                                                    >
                                                        Copy Address
                                                    </button>
                                                </div>
                                                <p className="text-sm text-gray-700">
                                                    {[order.shipping_name, order.shipping_phone, order.shipping_address, order.shipping_city, order.shipping_state, order.shipping_pincode]
                                                        .filter(Boolean)
                                                        .join(', ')}
                                                </p>
                                            </div>

                                            <div className="rounded-lg border border-green-100 bg-green-50 p-3">
                                                <p className="mb-2 text-xs font-bold text-gray-800">Payment</p>
                                                {order.payment.length ? (
                                                    <div className="space-y-1 text-sm text-gray-700">
                                                        <p><span className="font-semibold">UTR:</span> {order.payment[0].utr_number || 'Not provided'}</p>
                                                        <p><span className="font-semibold">Status:</span> {order.payment[0].status}</p>
                                                        {order.payment[0].verified_at && (
                                                            <p><span className="font-semibold">Verified:</span> {new Date(order.payment[0].verified_at).toLocaleString('en-IN')}</p>
                                                        )}
                                                        {order.payment[0].rejection_reason && (
                                                            <p className="text-red-700"><span className="font-semibold">Reason:</span> {order.payment[0].rejection_reason}</p>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <p className="text-sm text-gray-600">No payment submitted.</p>
                                                )}
                                            </div>

                                            <div>
                                                <p className="mb-2 text-xs font-bold text-gray-800">Items</p>
                                                <div className="space-y-2">
                                                    {order.items.map((item) => (
                                                        <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-3 py-2">
                                                            <div>
                                                                <p className="text-sm font-semibold text-gray-900">{item.product_title_en}</p>
                                                                {item.variant_label && <p className="text-xs text-indigo-700">Variant: {item.variant_label}</p>}
                                                                <p className="text-xs text-gray-500">Qty {item.quantity} x {formatCurrency(item.unit_price)}</p>
                                                            </div>
                                                            <p className="text-sm font-bold text-gray-900">{formatCurrency(item.total_price)}</p>
                                                        </div>
                                                    ))}
                                                    {order.items.length === 0 && (
                                                        <p className="text-sm text-gray-500">No item details found.</p>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
}
