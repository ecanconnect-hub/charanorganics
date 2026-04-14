/**
 * Admin Orders Page
 * Focused on quick scanning + complete order/payment drill-down.
 */

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type ProfileRoleRow = Pick<ProfileRow, 'role'>;
type OrderRow = Database['public']['Tables']['orders']['Row'];
type OrderItemRow = Database['public']['Tables']['order_items']['Row'];
type PaymentRow = Database['public']['Tables']['payments']['Row'];
type ProductRow = Database['public']['Tables']['products']['Row'];
type OrderHistoryRow = Database['public']['Tables']['order_history']['Row'];

type OrderStatus = OrderRow['status'];
type FilterStatus = 'all' | 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
type SortOption =
    | 'newest'
    | 'oldest'
    | 'amount_high'
    | 'amount_low'
    | 'units_high'
    | 'units_low'
    | 'order_id_asc'
    | 'customer_asc'
    | 'status_priority';

type ProfileMini = Pick<ProfileRow, 'full_name' | 'email' | 'phone'>;
type PaymentMini = Pick<PaymentRow, 'id' | 'order_id' | 'utr_number' | 'payment_screenshot_url' | 'status' | 'verified_at' | 'rejection_reason' | 'created_at'>;
type OrderItemSummaryRow = Pick<OrderItemRow, 'order_id' | 'product_title_en' | 'quantity'>;
type ProductMini = Pick<ProductRow, 'title_en' | 'image_url'>;
type HistoryProfile = Pick<ProfileRow, 'full_name' | 'email'>;

type ItemSummary = { itemCount: number; totalUnits: number; preview: string[]; itemNames: string[] };

type OrderListRecord = OrderRow & {
    profile: ProfileMini | null;
    payment: PaymentMini[];
    itemsSummary: ItemSummary;
};

type OrderItemWithProduct = OrderItemRow & { product: ProductMini | null };
type OrderHistoryWithProfile = OrderHistoryRow & { changed_by_profile: HistoryProfile | null };

type SelectedOrder = OrderListRecord & {
    items: OrderItemWithProduct[];
    history: OrderHistoryWithProfile[];
};

const ADMIN_ORDER_VISIBLE_STATUSES: OrderStatus[] = [
    'payment_verification',
    'confirmed',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
];
const ORDER_STATUSES: FilterStatus[] = ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
const ORDER_FILTER_LABELS: Record<FilterStatus, string> = {
    all: 'All',
    pending: 'Payment Review',
    confirmed: 'Confirmed',
    shipped: 'Shipped',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
};

const formatCurrency = (value: number) => `Rs. ${(value || 0).toFixed(2)}`;
const formatDate = (value: string | null, includeTime = false) => {
    if (!value) return 'N/A';
    const options: Intl.DateTimeFormatOptions = includeTime
        ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
        : { day: '2-digit', month: 'short', year: 'numeric' };
    return new Date(value).toLocaleString('en-IN', options);
};
const formatStatusLabel = (status: string) => status.replace(/_/g, ' ').toUpperCase();
const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);

export default function AdminOrdersPage() {
    const router = useRouter();
    const { user } = useAuth();

    const [orders, setOrders] = useState<OrderListRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<FilterStatus>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortOption>('newest');
    const [selectedOrder, setSelectedOrder] = useState<SelectedOrder | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [resolvedPaymentScreenshotUrl, setResolvedPaymentScreenshotUrl] = useState<string | null>(null);
    const [orderQuery, setOrderQuery] = useState<string | null>(null);
    const [handledOrderQuery, setHandledOrderQuery] = useState<string | null>(null);

    useEffect(() => {
        const syncOrderQuery = () => {
            const nextOrderQuery = new URLSearchParams(window.location.search).get('order');
            setOrderQuery(nextOrderQuery);
        };

        syncOrderQuery();
        window.addEventListener('popstate', syncOrderQuery);

        return () => {
            window.removeEventListener('popstate', syncOrderQuery);
        };
    }, []);

    useEffect(() => {
        void checkAdmin();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const checkAdmin = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        const profileData = data as ProfileRoleRow | null;

        if (profileData?.role !== 'admin') {
            router.push('/');
            return;
        }

        await fetchOrders();
    };

    const fetchOrders = async () => {
        setLoading(true);

        const { data: ordersData, error: ordersError } = await supabase
            .from('orders')
            .select(`
                *,
                profile:profiles (full_name, email, phone),
                payment:payments (id, order_id, utr_number, payment_screenshot_url, status, verified_at, rejection_reason, created_at)
            `)
            .in('status', ADMIN_ORDER_VISIBLE_STATUSES)
            .order('created_at', { ascending: false });

        if (ordersError) {
            toast.error('Failed to load orders');
            setLoading(false);
            return;
        }

        const rawOrders = ((ordersData ?? []) as unknown as Array<OrderRow & {
            profile: ProfileMini | null;
            payment: PaymentMini[] | null;
        }>);

        const orderIds = rawOrders.map((order) => order.id);
        const summaryMap: Record<string, ItemSummary> = {};

        if (orderIds.length > 0) {
            const { data: itemRowsData } = await supabase
                .from('order_items')
                .select('order_id, product_title_en, quantity')
                .in('order_id', orderIds);

            const itemRows = (itemRowsData ?? []) as unknown as OrderItemSummaryRow[];

            for (const row of itemRows) {
                if (!summaryMap[row.order_id]) {
                    summaryMap[row.order_id] = { itemCount: 0, totalUnits: 0, preview: [], itemNames: [] };
                }
                const current = summaryMap[row.order_id];
                current.itemCount += 1;
                current.totalUnits += row.quantity || 0;
                if (current.preview.length < 2) {
                    current.preview.push(row.product_title_en);
                }
                current.itemNames.push(row.product_title_en.toLowerCase());
            }
        }

        setOrders(
            rawOrders.map((order) => ({
                ...order,
                payment: order.payment ?? [],
                itemsSummary: summaryMap[order.id] ?? { itemCount: 0, totalUnits: 0, preview: [], itemNames: [] }
            }))
        );

        setLoading(false);
    };

    const updateOrderStatus = async (orderId: string, newStatus: OrderStatus, currentStatus: OrderStatus) => {
        const statusOrder: OrderStatus[] = ['pending_payment', 'payment_verification', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
        const currentIndex = statusOrder.indexOf(currentStatus);
        const newIndex = statusOrder.indexOf(newStatus);

        if (currentIndex >= 0 && newIndex >= 0 && newIndex < currentIndex) {
            const confirmed = confirm(`Revert this order back to "${newStatus.toUpperCase()}"?`);
            if (!confirmed) return;
        }

        const { error } = await supabase
            .from('orders')
            .update({ status: newStatus } as never)
            .eq('id', orderId);

        if (error) {
            toast.error(`Failed to update status: ${error.message}`);
            return;
        }

        if (newStatus === 'pending_payment' || newStatus === 'payment_verification') {
            const { error: paymentError } = await supabase
                .from('payments')
                .update({ status: 'pending' } as never)
                .eq('order_id', orderId);

            if (paymentError) {
                toast.error('Order updated, but payment reset failed');
            } else {
                toast.success('Order reverted and payment marked pending');
            }
        } else {
            toast.success(`Order status updated to ${newStatus.toUpperCase()}`);
        }

        await fetchOrders();
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

    const viewOrderDetails = useCallback(async (order: OrderListRecord) => {
        setResolvedPaymentScreenshotUrl(null);

        const { data: orderItemsData } = await supabase
            .from('order_items')
            .select(`
                *,
                product:products (title_en, image_url)
            `)
            .eq('order_id', order.id);

        const { data: orderHistoryData } = await supabase
            .from('order_history')
            .select(`
                *,
                changed_by_profile:profiles!changed_by (full_name, email)
            `)
            .eq('order_id', order.id)
            .order('changed_at', { ascending: true });

        const { data: paymentRowsData } = await supabase
            .from('payments')
            .select('id, order_id, utr_number, payment_screenshot_url, status, verified_at, rejection_reason, created_at')
            .eq('order_id', order.id)
            .order('created_at', { ascending: false });

        const orderItems = (orderItemsData ?? []) as unknown as OrderItemWithProduct[];
        const orderHistory = (orderHistoryData ?? []) as unknown as OrderHistoryWithProfile[];
        const paymentRows = (paymentRowsData ?? []) as PaymentMini[];

        const screenshotRef = paymentRows[0]?.payment_screenshot_url || '';
        if (screenshotRef) {
            if (isHttpUrl(screenshotRef)) {
                setResolvedPaymentScreenshotUrl(screenshotRef);
            } else {
                const { data: signedData, error: signedError } = await supabase.storage
                    .from('payments')
                    .createSignedUrl(screenshotRef, 60 * 60);
                if (!signedError && signedData?.signedUrl) {
                    setResolvedPaymentScreenshotUrl(signedData.signedUrl);
                }
            }
        }

        setSelectedOrder({
            ...order,
            items: orderItems,
            history: orderHistory,
            payment: paymentRows
        });

        setShowModal(true);
    }, []);

    const closeOrderModal = useCallback(() => {
        setShowModal(false);
        setResolvedPaymentScreenshotUrl(null);

        if (!orderQuery) {
            return;
        }
        setOrderQuery(null);
        setHandledOrderQuery(null);
        router.replace('/admin/orders', { scroll: false });
    }, [orderQuery, router]);

    useEffect(() => {
        if (!orderQuery) {
            if (handledOrderQuery !== null) {
                setHandledOrderQuery(null);
            }
            return;
        }

        if (orders.length === 0 || handledOrderQuery === orderQuery) {
            return;
        }

        const matchedOrder = orders.find((order) => order.id === orderQuery || order.order_id === orderQuery);
        if (!matchedOrder) {
            return;
        }

        setHandledOrderQuery(orderQuery);
        void viewOrderDetails(matchedOrder);
    }, [handledOrderQuery, orderQuery, orders, viewOrderDetails]);

    const downloadOrderDetailsPdf = async (order: SelectedOrder) => {
        setIsExportingPdf(true);

        try {
            const { jsPDF } = await import('jspdf');
            const doc = new jsPDF({ unit: 'pt', format: 'a4' });
            const margin = 40;
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const contentWidth = pageWidth - margin * 2;
            let y = margin;

            const ensureSpace = (requiredHeight = 16) => {
                if (y + requiredHeight > pageHeight - margin) {
                    doc.addPage();
                    y = margin;
                }
            };

            const addWrappedLine = (
                text: string,
                options?: { bold?: boolean; fontSize?: number; indent?: number; gap?: number }
            ) => {
                const fontSize = options?.fontSize ?? 10;
                const gap = options?.gap ?? 14;
                const indent = options?.indent ?? 0;
                const printableWidth = contentWidth - indent;
                const lines = doc.splitTextToSize(text, printableWidth) as string[];

                doc.setFont('helvetica', options?.bold ? 'bold' : 'normal');
                doc.setFontSize(fontSize);

                for (const line of lines) {
                    ensureSpace(gap);
                    doc.text(line, margin + indent, y);
                    y += gap;
                }
            };

            const addSectionTitle = (title: string) => {
                ensureSpace(22);
                y += 4;
                addWrappedLine(title, { bold: true, fontSize: 12, gap: 16 });
            };

            const addLabelLine = (label: string, value: string) => {
                addWrappedLine(`${label}: ${value || 'N/A'}`);
            };

            addWrappedLine('Charan Organics - Order Full Details', { bold: true, fontSize: 16, gap: 20 });
            addWrappedLine(`Generated on: ${formatDate(new Date().toISOString(), true)}`, { fontSize: 9, gap: 12 });

            addSectionTitle('Order Summary');
            addLabelLine('Order ID', order.order_id);
            addLabelLine('Status', formatStatusLabel(order.status));
            addLabelLine('Created', formatDate(order.created_at, true));
            addLabelLine('Last Updated', formatDate(order.updated_at, true));
            addLabelLine('Subtotal', formatCurrency(order.subtotal));
            addLabelLine('Shipping', formatCurrency(order.shipping_total));
            addLabelLine('Total Amount', formatCurrency(order.total_amount));

            addSectionTitle('Customer and Shipping');
            addLabelLine('Name', order.shipping_name || order.profile?.full_name || 'N/A');
            addLabelLine('Phone', order.shipping_phone || order.profile?.phone || 'N/A');
            addLabelLine('Email', order.profile?.email || 'N/A');
            addLabelLine(
                'Address',
                [order.shipping_address, order.shipping_city, order.shipping_state, order.shipping_pincode].filter(Boolean).join(', ') || 'N/A'
            );

            addSectionTitle('Payment Details');
            if (order.payment.length === 0) {
                addWrappedLine('No payment records available.');
            } else {
                order.payment.forEach((payment, index) => {
                    addWrappedLine(`Payment ${index + 1}`, { bold: true });
                    addLabelLine('Status', formatStatusLabel(payment.status));
                    addLabelLine('UTR Number', payment.utr_number || 'Not provided');
                    addLabelLine('Submitted At', formatDate(payment.created_at, true));
                    addLabelLine('Verified At', formatDate(payment.verified_at, true));
                    if (payment.rejection_reason) {
                        addLabelLine('Rejection Reason', payment.rejection_reason);
                    }
                    if (payment.payment_screenshot_url) {
                        addLabelLine('Screenshot URL', payment.payment_screenshot_url);
                    }
                    y += 4;
                });
            }

            addSectionTitle(`Order Items (${order.items.length})`);
            if (order.items.length === 0) {
                addWrappedLine('No order items found.');
            } else {
                order.items.forEach((item, index) => {
                    addWrappedLine(`${index + 1}. ${item.product_title_en}`, { bold: true });
                    if (item.variant_label) {
                        addLabelLine('Variant', item.variant_label);
                    }
                    addLabelLine('Quantity', String(item.quantity || 0));
                    addLabelLine('Unit Price', formatCurrency(item.unit_price || 0));
                    addLabelLine('Line Total', formatCurrency(item.total_price || 0));
                    y += 4;
                });
            }

            addSectionTitle(`Order Timeline (${order.history.length})`);
            if (order.history.length === 0) {
                addWrappedLine('No history entries available.');
            } else {
                order.history.forEach((entry, index) => {
                    addWrappedLine(`${index + 1}. ${formatStatusLabel(entry.status)}`, { bold: true });
                    addLabelLine('Changed At', formatDate(entry.changed_at, true));
                    addLabelLine('Changed By', entry.changed_by_profile?.full_name || entry.changed_by_profile?.email || 'System');
                    if (entry.notes) {
                        addLabelLine('Notes', entry.notes);
                    }
                    y += 4;
                });
            }

            const safeOrderId = order.order_id.replace(/[^a-zA-Z0-9_-]+/g, '-');
            doc.save(`order-${safeOrderId}.pdf`);
            toast.success('Order PDF downloaded');
        } catch (error) {
            console.error('PDF export failed', error);
            toast.error('Could not generate PDF');
        } finally {
            setIsExportingPdf(false);
        }
    };

    const filteredOrders = useMemo(() => {
        let result = orders;

        if (filterStatus !== 'all') {
            if (filterStatus === 'pending') {
                result = result.filter((order) => order.status === 'payment_verification');
            } else {
                result = result.filter((order) => order.status === filterStatus);
            }
        }

        const query = searchQuery.trim().toLowerCase();
        if (query) {
            result = result.filter((order) => {
                const matchesOrderId = order.order_id.toLowerCase().includes(query);
                const matchesItem = order.itemsSummary.itemNames.some((name) => name.includes(query));
                return matchesOrderId || matchesItem;
            });
        }

        const statusPriority: Record<OrderStatus, number> = {
            pending_payment: 0,
            payment_verification: 1,
            confirmed: 2,
            processing: 3,
            shipped: 4,
            delivered: 5,
            cancelled: 6
        };

        return [...result].sort((a, b) => {
            switch (sortBy) {
                case 'oldest':
                    return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
                case 'amount_high':
                    return b.total_amount - a.total_amount;
                case 'amount_low':
                    return a.total_amount - b.total_amount;
                case 'units_high':
                    return b.itemsSummary.totalUnits - a.itemsSummary.totalUnits;
                case 'units_low':
                    return a.itemsSummary.totalUnits - b.itemsSummary.totalUnits;
                case 'order_id_asc':
                    return a.order_id.localeCompare(b.order_id);
                case 'customer_asc':
                    return (a.profile?.full_name || a.shipping_name || '').localeCompare(b.profile?.full_name || b.shipping_name || '');
                case 'status_priority':
                    return statusPriority[a.status] - statusPriority[b.status];
                case 'newest':
                default:
                    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
        });
    }, [orders, filterStatus, searchQuery, sortBy]);

    if (loading) {
        return (
            <AdminLayout title="Orders" subtitle="Orders appear here after customers submit payment proof">
                <div className="flex items-center justify-center py-20">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Orders" subtitle="Only proof-submitted orders show here; new checkouts stay in the payment queue">
            <div className="mb-5 rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 shadow-sm">
                <div className="grid gap-3 lg:grid-cols-[1fr_260px]">
                    <div>
                        <label htmlFor="order-search" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">
                            Search Orders
                        </label>
                        <input
                            id="order-search"
                            type="text"
                            value={searchQuery}
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search by Order ID or Item Name..."
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none ring-indigo-500/20 transition placeholder:text-slate-400 focus:border-indigo-500 focus:ring-4"
                        />
                    </div>
                    <div>
                        <label htmlFor="order-sort" className="mb-1 block text-xs font-bold uppercase tracking-wide text-slate-600">
                            Sort By
                        </label>
                        <select
                            id="order-sort"
                            value={sortBy}
                            onChange={(event) => setSortBy(event.target.value as SortOption)}
                            className="w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 outline-none ring-indigo-500/20 transition focus:border-indigo-500 focus:ring-4"
                        >
                            <option value="newest">Newest First</option>
                            <option value="oldest">Oldest First</option>
                            <option value="amount_high">Amount: High to Low</option>
                            <option value="amount_low">Amount: Low to High</option>
                            <option value="units_high">Units: High to Low</option>
                            <option value="units_low">Units: Low to High</option>
                            <option value="order_id_asc">Order ID: A to Z</option>
                            <option value="customer_asc">Customer: A to Z</option>
                            <option value="status_priority">Status Priority</option>
                        </select>
                    </div>
                </div>
                <p className="mt-2 text-xs text-slate-500">
                    Showing {filteredOrders.length} of {orders.length} proof-submitted orders
                </p>
                <p className="mt-1 text-xs text-slate-500">
                    Orders move here only after the customer submits UTR or a payment screenshot from the payment page.
                </p>
            </div>

            <div className="mb-6 flex flex-wrap gap-3">
                {ORDER_STATUSES.map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`rounded-xl border px-5 py-2 text-sm font-semibold transition ${filterStatus === status
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-300'
                            }`}
                    >
                        {ORDER_FILTER_LABELS[status]}
                        {status === 'all' ? ` (${orders.length})` : ''}
                    </button>
                ))}
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="space-y-3 p-3 md:hidden">
                    {filteredOrders.map((order) => (
                        <div key={order.id} className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                            <div className="mb-2 flex items-start justify-between gap-3">
                                <button
                                    onClick={() => void viewOrderDetails(order)}
                                    className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1.5 font-mono text-xs font-bold text-indigo-700"
                                >
                                    {order.order_id}
                                </button>
                                <p className="text-sm font-bold text-gray-900">{formatCurrency(order.total_amount)}</p>
                            </div>
                            <p className="text-sm font-semibold text-gray-900">{order.profile?.full_name || order.shipping_name}</p>
                            <p className="text-xs text-gray-500">{order.profile?.email || 'No email'}</p>
                            <p className="mt-2 text-xs text-gray-600">
                                {order.itemsSummary.totalUnits} units
                                {order.itemsSummary.preview.length > 0 ? ` • ${order.itemsSummary.preview.join(', ')}` : ''}
                            </p>
                            <div className="mt-3 flex items-center justify-between gap-3">
                                <p className="text-xs uppercase text-gray-500">
                                    {order.payment[0] ? `Payment: ${order.payment[0].status}` : 'No payment'}
                                </p>
                                <p className="text-xs text-gray-500">
                                    {new Date(order.created_at).toLocaleDateString('en-IN', {
                                        day: '2-digit',
                                        month: 'short',
                                        year: 'numeric'
                                    })}
                                </p>
                            </div>
                            <div className="mt-3">
                                <select
                                    value={order.status}
                                    onChange={(event) => void updateOrderStatus(order.id, event.target.value as OrderStatus, order.status)}
                                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold uppercase text-gray-700"
                                >
                                    <option value="pending_payment">PENDING PAYMENT</option>
                                    <option value="payment_verification">PAYMENT VERIFICATION</option>
                                    <option value="confirmed">CONFIRMED</option>
                                    <option value="processing">PROCESSING</option>
                                    <option value="shipped">SHIPPED</option>
                                    <option value="delivered">DELIVERED</option>
                                    <option value="cancelled">CANCELLED</option>
                                </select>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="hidden overflow-x-auto md:block">
                    <table className="w-full min-w-[980px]">
                        <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">Order</th>
                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">Customer</th>
                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">Items</th>
                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">Amount</th>
                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">Payment</th>
                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">Status</th>
                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">Created</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredOrders.map((order) => (
                                <tr key={order.id} className="hover:bg-gray-50">
                                    <td className="px-5 py-4">
                                        <button
                                            onClick={() => void viewOrderDetails(order)}
                                            className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1 font-mono text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                                        >
                                            {order.order_id}
                                        </button>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="text-sm font-semibold text-gray-900">{order.profile?.full_name || order.shipping_name}</p>
                                        <p className="text-xs text-gray-500">{order.profile?.email || 'No email'}</p>
                                    </td>
                                    <td className="px-5 py-4">
                                        <p className="text-sm font-semibold text-gray-900">{order.itemsSummary.totalUnits} units</p>
                                        <p className="text-xs text-gray-500">
                                            {order.itemsSummary.preview.length > 0 ? order.itemsSummary.preview.join(', ') : 'No item data'}
                                        </p>
                                    </td>
                                    <td className="px-5 py-4 text-sm font-bold text-gray-900">{formatCurrency(order.total_amount)}</td>
                                    <td className="px-5 py-4">
                                        {order.payment[0] ? (
                                            <div>
                                                <p className="font-mono text-xs text-gray-800">{order.payment[0].utr_number || 'UTR missing'}</p>
                                                <p className="text-xs uppercase text-gray-500">{order.payment[0].status}</p>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">No payment</span>
                                        )}
                                    </td>
                                    <td className="px-5 py-4">
                                        <select
                                            value={order.status}
                                            onChange={(event) => void updateOrderStatus(order.id, event.target.value as OrderStatus, order.status)}
                                            className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold uppercase text-gray-700"
                                        >
                                            <option value="pending_payment">PENDING PAYMENT</option>
                                            <option value="payment_verification">PAYMENT VERIFICATION</option>
                                            <option value="confirmed">CONFIRMED</option>
                                            <option value="processing">PROCESSING</option>
                                            <option value="shipped">SHIPPED</option>
                                            <option value="delivered">DELIVERED</option>
                                            <option value="cancelled">CANCELLED</option>
                                        </select>
                                    </td>
                                    <td className="px-5 py-4 text-sm text-gray-600">
                                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredOrders.length === 0 && (
                    <div className="py-14 text-center text-gray-500">
                        No proof-submitted orders found for this filter.
                    </div>
                )}
            </div>

            <Modal
                isOpen={showModal}
                onClose={closeOrderModal}
                title="Order Full Details"
                size="xl"
            >
                {selectedOrder && (
                    <div className="space-y-6">
                        <div className="flex justify-end">
                            <button
                                onClick={() => void downloadOrderDetailsPdf(selectedOrder)}
                                disabled={isExportingPdf}
                                className="rounded-lg border border-indigo-300 bg-indigo-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-70"
                            >
                                {isExportingPdf ? 'Preparing PDF...' : 'Download PDF'}
                            </button>
                        </div>
                        <div className="grid gap-4 sm:grid-cols-3">
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                <p className="text-xs text-gray-500">Order ID</p>
                                <p className="font-mono text-sm font-bold text-gray-900">{selectedOrder.order_id}</p>
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                <p className="text-xs text-gray-500">Order Status</p>
                                <p className="text-sm font-bold uppercase text-gray-900">{selectedOrder.status}</p>
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                <p className="text-xs text-gray-500">Total</p>
                                <p className="text-sm font-bold text-gray-900">{formatCurrency(selectedOrder.total_amount)}</p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-5">
                            <div className="mb-3 flex items-center justify-between">
                                <h4 className="text-sm font-bold text-gray-900">Customer + Shipping</h4>
                                <button
                                    onClick={() => void copyAddress(selectedOrder)}
                                    className="rounded-lg border border-indigo-300 bg-white px-3 py-1 text-xs font-semibold text-indigo-700 hover:bg-indigo-100"
                                >
                                    Copy Address
                                </button>
                            </div>
                            <div className="space-y-1 text-sm text-gray-700">
                                <p><span className="font-semibold">Name:</span> {selectedOrder.shipping_name || selectedOrder.profile?.full_name}</p>
                                <p><span className="font-semibold">Phone:</span> {selectedOrder.shipping_phone || selectedOrder.profile?.phone || 'N/A'}</p>
                                <p><span className="font-semibold">Email:</span> {selectedOrder.profile?.email || 'N/A'}</p>
                                <p>
                                    <span className="font-semibold">Address:</span>{' '}
                                    {[selectedOrder.shipping_address, selectedOrder.shipping_city, selectedOrder.shipping_state, selectedOrder.shipping_pincode]
                                        .filter(Boolean)
                                        .join(', ')}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-green-100 bg-green-50 p-5">
                            <h4 className="mb-3 text-sm font-bold text-gray-900">Payment Details</h4>
                            {selectedOrder.payment.length ? (
                                <div className="space-y-4">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className="rounded-lg border border-green-200 bg-white p-3">
                                            <p className="text-xs text-gray-500">UTR Number</p>
                                            <p className="font-mono text-sm font-semibold text-gray-900">{selectedOrder.payment[0].utr_number || 'Not provided'}</p>
                                        </div>
                                        <div className="rounded-lg border border-green-200 bg-white p-3">
                                            <p className="text-xs text-gray-500">Payment Status</p>
                                            <p className="text-sm font-semibold uppercase text-gray-900">{selectedOrder.payment[0].status}</p>
                                        </div>
                                    </div>
                                    {selectedOrder.payment[0].verified_at && (
                                        <p className="text-xs text-gray-600">
                                            Verified at: {new Date(selectedOrder.payment[0].verified_at).toLocaleString('en-IN')}
                                        </p>
                                    )}
                                    {selectedOrder.payment[0].rejection_reason && (
                                        <p className="text-xs text-red-700">Rejection reason: {selectedOrder.payment[0].rejection_reason}</p>
                                    )}
                                    {selectedOrder.payment[0].payment_screenshot_url && resolvedPaymentScreenshotUrl ? (
                                        <Image
                                            src={resolvedPaymentScreenshotUrl}
                                            alt="Payment proof"
                                            width={900}
                                            height={500}
                                            unoptimized
                                            className="h-auto w-full rounded-lg border border-green-200"
                                        />
                                    ) : selectedOrder.payment[0].payment_screenshot_url ? (
                                        <p className="text-xs text-gray-600">Screenshot unavailable</p>
                                    ) : null}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-600">No payment submitted yet.</p>
                            )}
                        </div>

                        <div>
                            <h4 className="mb-3 text-sm font-bold text-gray-900">Order Items</h4>
                            <div className="space-y-3">
                                {selectedOrder.items.map((item) => (
                                    <div key={item.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
                                        {item.product?.image_url ? (
                                            <Image
                                                src={item.product.image_url}
                                                alt={item.product_title_en}
                                                width={56}
                                                height={56}
                                                className="rounded-lg object-cover"
                                            />
                                        ) : (
                                            <div className="h-14 w-14 rounded-lg bg-gray-200" />
                                        )}
                                        <div className="flex-1">
                                            <p className="text-sm font-semibold text-gray-900">{item.product_title_en}</p>
                                            {item.variant_label && <p className="text-xs text-indigo-700">Variant: {item.variant_label}</p>}
                                            <p className="text-xs text-gray-600">
                                                Qty {item.quantity} x {formatCurrency(item.unit_price || 0)}
                                            </p>
                                        </div>
                                        <p className="text-sm font-bold text-gray-900">{formatCurrency(item.total_price || 0)}</p>
                                    </div>
                                ))}
                                {selectedOrder.items.length === 0 && (
                                    <p className="text-sm text-gray-500">No items found for this order.</p>
                                )}
                            </div>
                        </div>

                        {selectedOrder.history.length > 0 && (
                            <div>
                                <h4 className="mb-3 text-sm font-bold text-gray-900">Order Timeline</h4>
                                <div className="space-y-2">
                                    {selectedOrder.history.map((entry) => (
                                        <div key={entry.id} className="rounded-lg border border-gray-200 bg-white p-3">
                                            <div className="flex items-center justify-between">
                                                <p className="text-xs font-bold uppercase text-gray-800">{entry.status}</p>
                                                <p className="text-xs text-gray-500">{new Date(entry.changed_at).toLocaleString('en-IN')}</p>
                                            </div>
                                            {entry.notes && <p className="mt-1 text-xs text-gray-600">{entry.notes}</p>}
                                            {entry.changed_by_profile && (
                                                <p className="mt-1 text-xs text-gray-500">
                                                    By {entry.changed_by_profile.full_name || entry.changed_by_profile.email}
                                                </p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
}
