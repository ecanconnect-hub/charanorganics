'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import toast from 'react-hot-toast';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Modal } from '@/components/ui/Modal';

type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type OrderRow = Database['public']['Tables']['orders']['Row'];
type PaymentRow = Database['public']['Tables']['payments']['Row'];

type ProfileRoleRow = Pick<ProfileRow, 'role'>;
type OrderWithProfile = Pick<
    OrderRow,
    'id' | 'order_id' | 'total_amount' | 'status' | 'shipping_name' | 'shipping_phone' | 'shipping_address' | 'shipping_city' | 'shipping_state' | 'shipping_pincode'
> & {
    profile: Pick<ProfileRow, 'full_name' | 'email'> | null;
};

type PaymentWithOrder = PaymentRow & {
    order: OrderWithProfile | null;
};

const formatCurrency = (value: number | string | null | undefined) => `Rs. ${Number(value || 0).toFixed(2)}`;
const isHttpUrl = (value: string) => /^https?:\/\//i.test(value);
const normalizeUtr = (value: string | null | undefined) => (value || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

export default function AdminUtrPage() {
    const router = useRouter();
    const { user } = useAuth();

    const [records, setRecords] = useState<PaymentWithOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedRecord, setSelectedRecord] = useState<PaymentWithOrder | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [utrDraft, setUtrDraft] = useState('');
    const [savingUtr, setSavingUtr] = useState(false);
    const [screenshotUrlsByPaymentId, setScreenshotUrlsByPaymentId] = useState<Record<string, string>>({});

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

        await fetchRecords();
    };

    const fetchRecords = async () => {
        setLoading(true);
        setScreenshotUrlsByPaymentId({});

        const { data, error } = await supabase
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

        if (error) {
            toast.error('Failed to load UTR records');
            setLoading(false);
            return;
        }

        const typedRecords = (data ?? []) as unknown as PaymentWithOrder[];
        setRecords(typedRecords);

        const directUrls: Record<string, string> = {};
        const signedUrlCandidates = typedRecords.filter((record) => {
            const ref = record.payment_screenshot_url;
            if (!ref) return false;
            if (isHttpUrl(ref)) {
                directUrls[record.id] = ref;
                return false;
            }
            return true;
        });

        if (Object.keys(directUrls).length > 0) {
            setScreenshotUrlsByPaymentId(directUrls);
        }

        if (signedUrlCandidates.length > 0) {
            const entries = await Promise.all(
                signedUrlCandidates.map(async (record) => {
                    const ref = record.payment_screenshot_url;
                    if (!ref) return null;

                    const { data: signedData, error: signedError } = await supabase.storage
                        .from('payments')
                        .createSignedUrl(ref, 60 * 60);

                    if (signedError || !signedData?.signedUrl) {
                        return null;
                    }

                    return [record.id, signedData.signedUrl] as const;
                })
            );

            const signedUrls = Object.fromEntries(
                entries.filter((entry): entry is readonly [string, string] => Array.isArray(entry))
            );

            if (Object.keys(signedUrls).length > 0) {
                setScreenshotUrlsByPaymentId((prev) => ({ ...prev, ...signedUrls }));
            }
        }

        setLoading(false);
    };

    const duplicateCounts = useMemo(() => {
        const counts = new Map<string, number>();

        for (const record of records) {
            const normalized = normalizeUtr(record.utr_number);
            if (!normalized) continue;
            counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
        }

        return counts;
    }, [records]);

    const filteredRecords = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) {
            return records;
        }

        return records.filter((record) => {
            return [
                record.order?.order_id,
                record.order?.profile?.full_name,
                record.order?.profile?.email,
                record.utr_number,
                record.status,
            ]
                .filter(Boolean)
                .some((value) => String(value).toLowerCase().includes(query));
        });
    }, [records, searchQuery]);

    const selectedRecordDuplicateMatches = useMemo(() => {
        if (!selectedRecord) return [];
        const normalized = normalizeUtr(utrDraft || selectedRecord.utr_number);
        if (!normalized) return [];

        return records.filter((record) => record.id !== selectedRecord.id && normalizeUtr(record.utr_number) === normalized);
    }, [records, selectedRecord, utrDraft]);

    const duplicateRowCount = useMemo(() => {
        return records.filter((record) => {
            const normalized = normalizeUtr(record.utr_number);
            return normalized && (duplicateCounts.get(normalized) ?? 0) > 1;
        }).length;
    }, [duplicateCounts, records]);

    const missingUtrCount = useMemo(() => records.filter((record) => !normalizeUtr(record.utr_number)).length, [records]);

    const openRecord = (record: PaymentWithOrder) => {
        setSelectedRecord(record);
        setUtrDraft(record.utr_number || '');
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedRecord(null);
        setUtrDraft('');
        setSavingUtr(false);
    };

    const updateRecordUtrState = (paymentId: string, nextUtr: string) => {
        setRecords((prev) =>
            prev.map((record) =>
                record.id === paymentId
                    ? { ...record, utr_number: nextUtr || null }
                    : record
            )
        );

        setSelectedRecord((prev) =>
            prev && prev.id === paymentId
                ? { ...prev, utr_number: nextUtr || null }
                : prev
        );
    };

    const saveUtr = async () => {
        if (!selectedRecord) return;

        const trimmedUtr = utrDraft.trim();
        if (!trimmedUtr) {
            toast.error('Please enter a UTR number');
            return;
        }

        setSavingUtr(true);
        const { error } = await supabase
            .from('payments')
            .update({ utr_number: trimmedUtr } as never)
            .eq('id', selectedRecord.id);
        setSavingUtr(false);

        if (error) {
            toast.error(`Failed to save UTR: ${error.message || 'Unknown error'}`);
            return;
        }

        updateRecordUtrState(selectedRecord.id, trimmedUtr);
        toast.success('UTR saved');
    };

    const copyAddress = async (record: PaymentWithOrder) => {
        const fullAddress = [
            record.order?.shipping_name,
            record.order?.shipping_phone,
            record.order?.shipping_address,
            record.order?.shipping_city,
            record.order?.shipping_state,
            record.order?.shipping_pincode,
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

    if (loading && records.length === 0) {
        return (
            <AdminLayout title="UTR Desk" subtitle="Review UTRs, duplicates, and screenshot-based payment proofs">
                <div className="flex items-center justify-center py-20">
                    <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-600 border-t-transparent" />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="UTR Desk" subtitle="Show user-entered UTRs, add missing UTRs, and catch duplicate bank references">
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">Total Payment Records</p>
                    <p className="mt-2 text-3xl font-bold text-gray-900">{records.length}</p>
                </div>
                <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">Missing UTR</p>
                    <p className="mt-2 text-3xl font-bold text-amber-900">{missingUtrCount}</p>
                </div>
                <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
                    <p className="text-xs font-semibold uppercase tracking-wide text-red-700">Duplicate UTR Rows</p>
                    <p className="mt-2 text-3xl font-bold text-red-900">{duplicateRowCount}</p>
                </div>
            </div>

            <div className="mt-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
                <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search by order ID, customer, email, status, or UTR"
                    className="w-full rounded-xl border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                />
            </div>

            <div className="mt-6 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[1100px]">
                        <thead className="border-b border-gray-200 bg-gray-50">
                            <tr>
                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">Order ID</th>
                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">Customer</th>
                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">Amount</th>
                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">UTR</th>
                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">Screenshot</th>
                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">Payment Status</th>
                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">Created</th>
                                <th className="px-5 py-4 text-left text-xs font-bold uppercase tracking-wide text-gray-600">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredRecords.map((record) => {
                                const normalized = normalizeUtr(record.utr_number);
                                const isDuplicate = Boolean(normalized) && (duplicateCounts.get(normalized) ?? 0) > 1;

                                return (
                                    <tr key={record.id} className="hover:bg-gray-50">
                                        <td className="px-5 py-4">
                                            <button
                                                onClick={() => openRecord(record)}
                                                className="rounded-md border border-indigo-200 bg-indigo-50 px-3 py-1 font-mono text-xs font-bold text-indigo-700 hover:bg-indigo-100"
                                            >
                                                {record.order?.order_id || 'Unknown order'}
                                            </button>
                                        </td>
                                        <td className="px-5 py-4">
                                            <p className="text-sm font-semibold text-gray-900">
                                                {record.order?.profile?.full_name || record.order?.shipping_name || 'No name'}
                                            </p>
                                            <p className="text-xs text-gray-500">{record.order?.profile?.email || 'No email'}</p>
                                        </td>
                                        <td className="px-5 py-4 text-sm font-bold text-gray-900">
                                            {formatCurrency(record.order?.total_amount)}
                                        </td>
                                        <td className="px-5 py-4">
                                            <div className={`rounded-xl border px-3 py-2 ${isDuplicate
                                                ? 'border-red-300 bg-red-50'
                                                : normalized
                                                    ? 'border-indigo-200 bg-indigo-50'
                                                    : 'border-amber-200 bg-amber-50'
                                                }`}>
                                                <p className={`font-mono text-xs font-semibold ${isDuplicate
                                                    ? 'text-red-800'
                                                    : normalized
                                                        ? 'text-gray-900'
                                                        : 'text-amber-800'
                                                    }`}>
                                                    {record.utr_number || 'No UTR entered'}
                                                </p>
                                                {isDuplicate && (
                                                    <p className="mt-1 text-[11px] font-bold uppercase tracking-wide text-red-700">
                                                        Duplicate UTR
                                                    </p>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${record.payment_screenshot_url
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-500'
                                                }`}>
                                                {record.payment_screenshot_url ? 'Available' : 'Not uploaded'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4">
                                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase ${record.status === 'verified'
                                                ? 'bg-green-100 text-green-800'
                                                : record.status === 'rejected'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-blue-100 text-blue-800'
                                                }`}>
                                                {record.status}
                                            </span>
                                        </td>
                                        <td className="px-5 py-4 text-sm text-gray-600">
                                            {new Date(record.created_at).toLocaleDateString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </td>
                                        <td className="px-5 py-4">
                                            <button
                                                onClick={() => openRecord(record)}
                                                className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-bold text-gray-700 hover:border-indigo-400 hover:bg-indigo-50"
                                            >
                                                Add / View UTR
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredRecords.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500">
                                        No matching UTR records found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <Modal
                isOpen={showModal}
                onClose={closeModal}
                title="Order Payment Details"
                size="xl"
            >
                {selectedRecord && (
                    <div className="space-y-5">
                        <div className="grid gap-3 sm:grid-cols-3">
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                <p className="text-xs text-gray-500">Order ID</p>
                                <p className="font-mono text-sm font-bold text-gray-900">{selectedRecord.order?.order_id || 'Unknown order'}</p>
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                <p className="text-xs text-gray-500">Amount</p>
                                <p className="text-sm font-bold text-gray-900">{formatCurrency(selectedRecord.order?.total_amount)}</p>
                            </div>
                            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                <p className="text-xs text-gray-500">Payment Status</p>
                                <p className="text-sm font-bold uppercase text-gray-900">{selectedRecord.status}</p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <div className="mb-3 flex items-center justify-between gap-3">
                                <div>
                                    <p className="text-sm font-semibold text-gray-900">Customer + Shipping</p>
                                    <p className="mt-1 text-xs text-gray-600">
                                        Open the order, check the payment proof, and add the correct UTR here if the customer only uploaded a screenshot.
                                    </p>
                                </div>
                                <button
                                    onClick={() => void copyAddress(selectedRecord)}
                                    className="rounded-lg border border-indigo-300 bg-white px-3 py-2 text-xs font-semibold text-indigo-700 hover:bg-indigo-50"
                                >
                                    Copy Address
                                </button>
                            </div>
                            <div className="space-y-1 text-sm text-gray-700">
                                <p><span className="font-semibold">Name:</span> {selectedRecord.order?.profile?.full_name || selectedRecord.order?.shipping_name || 'No name'}</p>
                                <p><span className="font-semibold">Email:</span> {selectedRecord.order?.profile?.email || 'No email'}</p>
                                <p><span className="font-semibold">Phone:</span> {selectedRecord.order?.shipping_phone || 'No phone'}</p>
                                <p>
                                    <span className="font-semibold">Address:</span>{' '}
                                    {[
                                        selectedRecord.order?.shipping_address,
                                        selectedRecord.order?.shipping_city,
                                        selectedRecord.order?.shipping_state,
                                        selectedRecord.order?.shipping_pincode,
                                    ]
                                        .filter(Boolean)
                                        .join(', ') || 'No address'}
                                </p>
                            </div>
                        </div>

                        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
                            <p className="text-xs font-bold text-indigo-700">User Entered / Current UTR</p>
                            <p className="mt-1 font-mono text-sm font-bold text-gray-900">{selectedRecord.utr_number || 'No UTR entered yet'}</p>
                        </div>

                        <div className="rounded-xl border border-gray-200 bg-white p-4">
                            <p className="text-sm font-semibold text-gray-900">Add or Update UTR</p>
                            <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                                <input
                                    type="text"
                                    value={utrDraft}
                                    onChange={(event) => setUtrDraft(event.target.value)}
                                    placeholder="Enter correct UTR number"
                                    className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                                />
                                <button
                                    onClick={() => void saveUtr()}
                                    disabled={savingUtr}
                                    className={`rounded-xl px-4 py-3 text-sm font-bold text-white ${savingUtr
                                        ? 'cursor-not-allowed bg-gray-400'
                                        : 'bg-indigo-600 hover:bg-indigo-700'
                                        }`}
                                >
                                    {savingUtr ? 'Saving...' : 'Save UTR'}
                                </button>
                            </div>
                            {selectedRecordDuplicateMatches.length > 0 && (
                                <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-4">
                                    <p className="text-sm font-semibold text-red-900">Duplicate UTR found</p>
                                    <p className="mt-1 text-xs text-red-800">
                                        This UTR is already used on another payment. Please review before processing this order.
                                    </p>
                                    <div className="mt-3 space-y-2">
                                        {selectedRecordDuplicateMatches.map((match) => (
                                            <div key={match.id} className="rounded-lg border border-red-200 bg-white p-3">
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div>
                                                        <p className="font-mono text-xs font-semibold text-red-800">{match.order?.order_id || 'Unknown order'}</p>
                                                        <p className="text-sm font-semibold text-gray-900">{match.order?.profile?.full_name || 'No name'}</p>
                                                        <p className="text-xs text-gray-600">{match.order?.profile?.email || 'No email'}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-gray-900">{formatCurrency(match.order?.total_amount)}</p>
                                                        <p className="text-xs uppercase text-red-700">Payment {match.status}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        <div>
                            <p className="mb-2 text-sm font-semibold text-gray-700">Payment Screenshot</p>
                            <div className="overflow-hidden rounded-xl border border-gray-200 bg-gray-100">
                                {selectedRecord.payment_screenshot_url && screenshotUrlsByPaymentId[selectedRecord.id] ? (
                                    <Image
                                        src={screenshotUrlsByPaymentId[selectedRecord.id]}
                                        alt="Payment screenshot"
                                        width={1000}
                                        height={700}
                                        unoptimized
                                        className="h-auto w-full"
                                    />
                                ) : (
                                    <div className="py-16 text-center text-sm text-gray-500">
                                        {selectedRecord.payment_screenshot_url ? 'Screenshot unavailable' : 'No screenshot uploaded'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </AdminLayout>
    );
}
