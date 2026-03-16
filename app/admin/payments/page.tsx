/**
 * Admin Payment Verification
 * Includes direct order context to reduce admin confusion.
 */

'use client';

import { useEffect, useState } from 'react';
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

type OrderWithProfile = Pick<OrderRow, 'id' | 'order_id' | 'total_amount' | 'status' | 'shipping_name' | 'shipping_phone' | 'shipping_address' | 'shipping_city' | 'shipping_state' | 'shipping_pincode'> & {
    profile: Pick<ProfileRow, 'full_name' | 'email'> | null;
};

type PaymentWithOrder = PaymentRow & {
    order: OrderWithProfile | null;
};

type PaymentOrderItem = Pick<OrderItemRow, 'id' | 'order_id' | 'product_title_en' | 'variant_label' | 'quantity' | 'unit_price' | 'total_price'>;

type SelectedPayment = PaymentWithOrder & {
    orderItems: PaymentOrderItem[];
};

const formatCurrency = (value: number) => `Rs. ${(value || 0).toFixed(2)}`;
const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);

export default function AdminPaymentsPage() {
    const router = useRouter();
    const { user } = useAuth();

    const [payments, setPayments] = useState<PaymentWithOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState<SelectedPayment | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');
    const [screenshotUrlsByPaymentId, setScreenshotUrlsByPaymentId] = useState<Record<string, string>>({});

    useEffect(() => {
        void checkAdmin();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user, activeTab]);

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

        await fetchPayments();
    };

    const fetchPayments = async () => {
        setLoading(true);
        setScreenshotUrlsByPaymentId({});

        let query = supabase
            .from('payments')
            .select(`
                *,
                order:orders (
                    id,
                    order_id,
                    total_amount,
                    status,
                    shipping_name,
                    shipping_phone,
                    shipping_address,
                    shipping_city,
                    shipping_state,
                    shipping_pincode,
                    profile:profiles (full_name, email)
                )
            `)
            .order('created_at', { ascending: false });

        if (activeTab === 'pending') {
            query = query.eq('status', 'pending');
        } else {
            query = query.in('status', ['verified', 'rejected']).limit(50);
        }

        const { data, error } = await query;

        if (error) {
            toast.error('Failed to load payments');
            setLoading(false);
            return;
        }

        const typedPayments = (data ?? []) as unknown as PaymentWithOrder[];
        setPayments(typedPayments);

        const resolvedDirectUrls: Record<string, string> = {};
        const signedUrlCandidates = typedPayments.filter((payment) => {
            const ref = payment.payment_screenshot_url;
            if (!ref) return false;
            if (isHttpUrl(ref)) {
                resolvedDirectUrls[payment.id] = ref;
                return false;
            }
            return true;
        });

        if (Object.keys(resolvedDirectUrls).length > 0) {
            setScreenshotUrlsByPaymentId(resolvedDirectUrls);
        }

        if (signedUrlCandidates.length > 0) {
            const entries = await Promise.all(
                signedUrlCandidates.map(async (payment) => {
                    const ref = payment.payment_screenshot_url;
                    if (!ref) return null;

                    const { data: signedData, error: signedError } = await supabase.storage
                        .from('payments')
                        .createSignedUrl(ref, 60 * 60);

                    if (signedError || !signedData?.signedUrl) {
                        return null;
                    }

                    return [payment.id, signedData.signedUrl] as const;
                })
            );

            const resolvedSignedUrls = Object.fromEntries(
                entries.filter((entry): entry is readonly [string, string] => Array.isArray(entry))
            );

            if (Object.keys(resolvedSignedUrls).length > 0) {
                setScreenshotUrlsByPaymentId((prev) => ({ ...prev, ...resolvedSignedUrls }));
            }
        }

        setLoading(false);
    };

    const copyAddress = async (payment: PaymentWithOrder | SelectedPayment) => {
        const order = payment.order;
        const fullAddress = [
            order?.shipping_name,
            order?.shipping_phone,
            order?.shipping_address,
            order?.shipping_city,
            order?.shipping_state,
            order?.shipping_pincode
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

    const openPaymentDetails = async (payment: PaymentWithOrder) => {
        const { data: orderItemsData } = await supabase
            .from('order_items')
            .select('id, order_id, product_title_en, variant_label, quantity, unit_price, total_price')
            .eq('order_id', payment.order_id);

        const orderItems = (orderItemsData ?? []) as PaymentOrderItem[];

        setSelectedPayment({
            ...payment,
            orderItems
        });
        setShowModal(true);
    };

    const handleVerify = async (paymentId: string, orderId: string) => {
        if (!user) return;

        const { error: paymentError } = await supabase
            .from('payments')
            .update({
                status: 'verified',
                verified_at: new Date().toISOString(),
                verified_by: user.id
            } as never)
            .eq('id', paymentId);

        if (paymentError) {
            toast.error(`Failed to verify payment: ${paymentError.message || 'Unknown error'}`);
            return;
        }

        const { error: orderError } = await supabase
            .from('orders')
            .update({ status: 'confirmed' } as never)
            .eq('id', orderId);

        if (orderError) {
            toast.error('Payment updated, but failed to update order status');
            return;
        }

        toast.success('Payment verified and order confirmed');
        setShowModal(false);
        await fetchPayments();
    };

    const handleReject = async (paymentId: string) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        const { error } = await supabase
            .from('payments')
            .update({
                status: 'rejected',
                rejection_reason: reason,
                verified_at: new Date().toISOString(),
                verified_by: user?.id || null
            } as never)
            .eq('id', paymentId);

        if (error) {
            toast.error('Failed to reject payment');
            return;
        }

        toast.success('Payment rejected');
        setShowModal(false);
        await fetchPayments();
    };

    const handleUnverify = async (paymentId: string, orderId: string) => {
        const confirmed = confirm('Move this payment back to verification?');
        if (!confirmed) return;

        const { error: paymentError } = await supabase
            .from('payments')
            .update({
                status: 'pending',
                verified_at: null,
                verified_by: null,
                rejection_reason: null
            } as never)
            .eq('id', paymentId);

        if (paymentError) {
            toast.error(`Failed to move payment back: ${paymentError.message || 'Unknown error'}`);
            return;
        }

        const { error: orderError } = await supabase
            .from('orders')
            .update({ status: 'payment_verification' } as never)
            .eq('id', orderId);

        if (orderError) {
            toast.error('Payment reset, but failed to update order status');
            return;
        }

        toast.success('Payment moved back to verification');
        setShowModal(false);
        await fetchPayments();
    };

    if (loading && payments.length === 0) {
        return (
            <AdminLayout title="Payment Verification" subtitle="Review payments with full order context">
                <div className="flex items-center justify-center py-20">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Payment Verification" subtitle="Review payments with full order context">
            <div className="mb-6 flex flex-wrap gap-3">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`rounded-xl px-6 py-3 font-semibold transition-all ${activeTab === 'pending'
                        ? 'bg-amber-500 text-white shadow-lg'
                        : 'border border-gray-200 bg-white text-gray-700 hover:border-amber-300'
                        }`}
                >
                    Pending Verification
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`rounded-xl px-6 py-3 font-semibold transition-all ${activeTab === 'history'
                        ? 'bg-indigo-600 text-white shadow-lg'
                        : 'border border-gray-200 bg-white text-gray-700 hover:border-indigo-300'
                        }`}
                >
                    History (Verified/Rejected)
                </button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {payments.map((payment) => (
                    <div
                        key={payment.id}
                        className={`overflow-hidden rounded-2xl border bg-white shadow-sm transition-all hover:shadow-lg ${payment.status === 'rejected' ? 'border-red-200' : payment.status === 'verified' ? 'border-green-200' : 'border-gray-200'
                            }`}
                    >
                        <button
                            className="relative block aspect-video w-full bg-gray-100"
                            onClick={() => void openPaymentDetails(payment)}
                        >
                            {payment.payment_screenshot_url && screenshotUrlsByPaymentId[payment.id] ? (
                                <Image src={screenshotUrlsByPaymentId[payment.id]} alt="Payment screenshot" fill unoptimized className="object-cover" />
                            ) : (
                                <div className="flex h-full items-center justify-center text-sm text-gray-400">
                                    {payment.payment_screenshot_url ? 'Screenshot unavailable' : 'No screenshot'}
                                </div>
                            )}
                        </button>

                        <div className="space-y-3 p-5">
                            <div className="rounded-lg border border-indigo-100 bg-indigo-50 p-3">
                                <p className="text-[11px] font-bold uppercase tracking-wide text-indigo-700">UTR</p>
                                <p className="font-mono text-xs font-semibold text-gray-900">{payment.utr_number || 'Not provided'}</p>
                            </div>

                            <div>
                                <p className="text-xs text-gray-500">Order</p>
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <button
                                            type="button"
                                            onClick={() => void openPaymentDetails(payment)}
                                            className="rounded border border-indigo-200 bg-indigo-50 px-2 py-1 font-mono text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                                        >
                                            {payment.order?.order_id || 'Unknown order'}
                                        </button>
                                        <p className="text-xs text-gray-500">{payment.order?.profile?.email || 'No email'}</p>
                                    </div>
                                    <p className="text-sm font-bold text-indigo-700">{formatCurrency(payment.order?.total_amount || 0)}</p>
                                </div>
                            </div>

                            <p className="text-xs uppercase text-gray-500">Payment: {payment.status}</p>

                            {activeTab === 'pending' ? (
                                <button
                                    onClick={() => void openPaymentDetails(payment)}
                                    className="w-full rounded-lg bg-indigo-600 py-2 text-sm font-bold text-white hover:bg-indigo-700"
                                >
                                    Review Payment
                                </button>
                            ) : (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => void openPaymentDetails(payment)}
                                        className="flex-1 rounded-lg border border-gray-300 bg-white py-2 text-sm font-bold text-gray-700 hover:border-indigo-400"
                                    >
                                        View Details
                                    </button>
                                    <button
                                        onClick={() => void handleUnverify(payment.id, payment.order_id)}
                                        className="flex-1 rounded-lg bg-amber-500 py-2 text-sm font-bold text-white hover:bg-amber-600"
                                    >
                                        Move Back
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {payments.length === 0 && (
                <div className="mt-6 rounded-2xl border border-gray-200 bg-white py-20 text-center text-gray-500">
                    {activeTab === 'pending' ? 'No pending payments to verify.' : 'No verification history found.'}
                </div>
            )}

            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={selectedPayment?.status === 'pending' ? 'Verify Payment' : 'Payment Details'}
                size="xl"
            >
                {selectedPayment && (
                    <div className="space-y-5">
                        {selectedPayment.status !== 'pending' && (
                            <div className={`rounded-xl border p-3 text-center ${selectedPayment.status === 'verified'
                                ? 'border-green-200 bg-green-100 text-green-800'
                                : 'border-red-200 bg-red-100 text-red-800'
                                }`}>
                                <p className="text-sm font-bold uppercase">{selectedPayment.status}</p>
                                {selectedPayment.verified_at && (
                                    <p className="text-xs">Processed on {new Date(selectedPayment.verified_at).toLocaleString('en-IN')}</p>
                                )}
                                {selectedPayment.rejection_reason && (
                                    <p className="mt-1 text-xs">Reason: {selectedPayment.rejection_reason}</p>
                                )}
                            </div>
                        )}

                        <div>
                            <p className="mb-2 text-sm font-semibold text-gray-700">Payment Screenshot</p>
                            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                                {selectedPayment.payment_screenshot_url && screenshotUrlsByPaymentId[selectedPayment.id] ? (
                                    <Image
                                        src={screenshotUrlsByPaymentId[selectedPayment.id]}
                                        alt="Payment Screenshot"
                                        width={1000}
                                        height={700}
                                        unoptimized
                                        className="h-auto w-full"
                                    />
                                ) : (
                                    <div className="py-16 text-center text-sm text-gray-500">
                                        {selectedPayment.payment_screenshot_url ? 'Screenshot unavailable' : 'No screenshot uploaded'}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid gap-3 sm:grid-cols-2">
                            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                                <p className="text-xs text-gray-600">Order ID</p>
                                <p className="font-mono text-sm font-bold text-gray-900">{selectedPayment.order?.order_id}</p>
                            </div>
                            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4">
                                <p className="text-xs text-gray-600">Amount</p>
                                <p className="text-sm font-bold text-indigo-700">{formatCurrency(selectedPayment.order?.total_amount || 0)}</p>
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:col-span-2">
                                <p className="text-xs text-gray-600">Customer</p>
                                <p className="text-sm font-semibold text-gray-900">{selectedPayment.order?.profile?.full_name || 'No name'}</p>
                                <p className="text-xs text-gray-600">{selectedPayment.order?.profile?.email || 'No email'}</p>
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 sm:col-span-2">
                                <div className="mb-2 flex items-center justify-between">
                                    <p className="text-xs text-gray-600">Shipping</p>
                                    <button
                                        onClick={() => void copyAddress(selectedPayment)}
                                        className="rounded border border-indigo-300 bg-white px-2 py-1 text-xs font-semibold text-indigo-700"
                                    >
                                        Copy Address
                                    </button>
                                </div>
                                <p className="text-sm text-gray-700">
                                    {[
                                        selectedPayment.order?.shipping_name,
                                        selectedPayment.order?.shipping_phone,
                                        selectedPayment.order?.shipping_address,
                                        selectedPayment.order?.shipping_city,
                                        selectedPayment.order?.shipping_state,
                                        selectedPayment.order?.shipping_pincode
                                    ]
                                        .filter(Boolean)
                                        .join(', ')}
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="mb-2 text-sm font-semibold text-gray-700">Order Items</p>
                            <div className="space-y-2">
                                {selectedPayment.orderItems.map((item) => (
                                    <div key={item.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">{item.product_title_en}</p>
                                            {item.variant_label && <p className="text-xs text-indigo-700">Variant: {item.variant_label}</p>}
                                            <p className="text-xs text-gray-600">Qty {item.quantity} x {formatCurrency(item.unit_price)}</p>
                                        </div>
                                        <p className="text-sm font-bold text-gray-900">{formatCurrency(item.total_price)}</p>
                                    </div>
                                ))}
                                {selectedPayment.orderItems.length === 0 && (
                                    <p className="text-sm text-gray-500">No item data available.</p>
                                )}
                            </div>
                        </div>

                        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                            <p className="text-xs font-bold text-indigo-700">UTR Number</p>
                            <p className="font-mono text-sm font-bold text-gray-900">{selectedPayment.utr_number || 'Not provided'}</p>
                        </div>

                        {selectedPayment.status === 'pending' ? (
                            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                                <button
                                    onClick={() => void handleVerify(selectedPayment.id, selectedPayment.order_id)}
                                    className="flex-1 rounded-xl bg-green-600 py-3 font-bold text-white hover:bg-green-700"
                                >
                                    Verify Payment
                                </button>
                                <button
                                    onClick={() => void handleReject(selectedPayment.id)}
                                    className="flex-1 rounded-xl bg-red-600 py-3 font-bold text-white hover:bg-red-700"
                                >
                                    Reject Payment
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-3 pt-2 sm:flex-row">
                                <button
                                    onClick={() => void handleUnverify(selectedPayment.id, selectedPayment.order_id)}
                                    className="flex-1 rounded-xl bg-amber-500 py-3 font-bold text-white hover:bg-amber-600"
                                >
                                    Move Back To Verification
                                </button>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="flex-1 rounded-xl bg-gray-100 py-3 font-bold text-gray-700 hover:bg-gray-200"
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
}
