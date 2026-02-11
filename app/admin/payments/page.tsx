/**
 * Admin Payment Verification - Premium Design
 * Shows transaction ID and payment screenshots
 */

'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Modal } from '@/components/ui/Modal';
import toast from 'react-hot-toast';

export default function AdminPaymentsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [payments, setPayments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPayment, setSelectedPayment] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);
    const [activeTab, setActiveTab] = useState<'pending' | 'history'>('pending');

    useEffect(() => {
        checkAdmin();
    }, [user, activeTab]);

    const checkAdmin = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if ((profile as any)?.role !== 'admin') {
            router.push('/');
            return;
        }

        fetchPayments();
    };

    const fetchPayments = async () => {
        setLoading(true);
        let query = supabase
            .from('payments')
            .select(`
                *,
                order:orders (
                    order_id,
                    total_amount,
                    profile:profiles (full_name, email)
                )
            `)
            .order('created_at', { ascending: false });

        if (activeTab === 'pending') {
            query = query.eq('status', 'pending');
        } else {
            // Apply filter for history: verified or rejected
            query = query.in('status', ['verified', 'rejected']);
            // Limit history to last 50 to avoid overload
            query = query.limit(50);
        }

        const { data, error } = await query;

        if (error) {
            console.error('Error fetching payments:', error);
            toast.error('Failed to load payments');
        }

        setPayments(data || []);
        setLoading(false);
    };

    const handleVerify = async (paymentId: string, orderId: string) => {
        if (!user) return;

        const { error: paymentError } = await supabase
            .from('payments')
            .update({
                status: 'verified',
                verified_at: new Date().toISOString(),
                // verified_by: user.id // Uncomment if column exists, safe to omit if unsure
            })
            .eq('id', paymentId);

        if (paymentError) {
            console.error('Verify error:', paymentError);
            toast.error(`Failed to verify payment: ${(paymentError as any).message || 'Unknown error'}`);
            return;
        }

        const { error: orderError } = await supabase
            .from('orders')
            .update({ status: 'confirmed' })
            .eq('id', orderId);

        if (orderError) {
            toast.error('Failed to update order status');
            return;
        }

        toast.success('Payment verified and order confirmed!');
        setShowModal(false);
        fetchPayments();
    };

    const handleReject = async (paymentId: string) => {
        const reason = prompt('Enter rejection reason:');
        if (!reason) return;

        const { error } = await supabase
            .from('payments')
            .update({
                status: 'rejected',
                rejection_reason: reason,
                verified_at: new Date().toISOString()
            })
            .eq('id', paymentId);

        if (error) {
            toast.error('Failed to reject payment');
        } else {
            toast.success('Payment rejected');
            setShowModal(false);
            fetchPayments();
        }
    };

    if (loading && payments.length === 0) {
        return (
            <AdminLayout title="Payment Verification" subtitle="Review and verify customer payments">
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Payment Verification" subtitle="Review and verify customer payments">
            {/* Tabs */}
            <div className="flex flex-wrap gap-3 mb-6 animate-fade-in">
                <button
                    onClick={() => setActiveTab('pending')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${activeTab === 'pending'
                        ? 'bg-gradient-to-r from-yellow-500 to-amber-500 text-white shadow-lg'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-yellow-300'
                        }`}
                >
                    <span>⏳</span>
                    Pending Verification
                </button>
                <button
                    onClick={() => setActiveTab('history')}
                    className={`px-6 py-3 rounded-xl font-semibold transition-all flex items-center gap-2 ${activeTab === 'history'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                        : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300'
                        }`}
                >
                    <span>📜</span>
                    History (Verified/Rejected)
                </button>
            </div>

            {/* Payments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {payments.map((payment, index) => (
                    <div
                        key={payment.id}
                        className={`bg-white rounded-2xl border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden animate-slide-up ${payment.status === 'rejected' ? 'border-red-200' :
                            payment.status === 'verified' ? 'border-green-200' : 'border-gray-200'
                            }`}
                        style={{ animationDelay: `${index * 50}ms` }}
                    >
                        {/* Payment Screenshot */}
                        <div
                            className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 cursor-pointer relative group"
                            onClick={() => {
                                setSelectedPayment(payment);
                                setShowModal(true);
                            }}
                        >
                            {payment.payment_screenshot_url ? (
                                <>
                                    <Image
                                        src={payment.payment_screenshot_url}
                                        alt="Payment Screenshot"
                                        fill
                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                    />
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                        <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-4 py-2 rounded-lg font-semibold">
                                            {activeTab === 'pending' ? 'Review' : 'View Details'}
                                        </span>
                                    </div>
                                    {/* Status Overlay */}
                                    {payment.status !== 'pending' && (
                                        <div className="absolute top-2 right-2">
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold shadow-sm ${payment.status === 'verified' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
                                                }`}>
                                                {payment.status.toUpperCase()}
                                            </span>
                                        </div>
                                    )}
                                </>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <span className="text-gray-400 text-4xl">📷</span>
                                </div>
                            )}
                        </div>

                        {/* Payment Details */}
                        <div className="p-6 space-y-4">
                            {/* Transaction ID */}
                            <div className={`p-4 rounded-xl border ${payment.status === 'rejected' ? 'bg-red-50 border-red-100' :
                                payment.status === 'verified' ? 'bg-green-50 border-green-100' :
                                    'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100'
                                }`}>
                                <p className={`text-xs font-semibold mb-1 ${payment.status === 'rejected' ? 'text-red-600' :
                                    payment.status === 'verified' ? 'text-green-600' :
                                        'text-indigo-600'
                                    }`}>UTR NUMBER</p>
                                <p className={`font-mono font-bold text-sm break-all ${payment.status === 'rejected' ? 'text-red-900' :
                                    payment.status === 'verified' ? 'text-green-900' :
                                        'text-indigo-900'
                                    }`}>
                                    {payment.utr_number || 'N/A'}
                                </p>
                            </div>

                            {/* Order Info */}
                            <div>
                                <p className="text-xs text-gray-500 mb-1">Order / Customer</p>
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="font-mono font-bold text-gray-900 text-sm">{payment.order?.order_id}</p>
                                        <p className="text-xs text-gray-500 truncate max-w-[150px]">{payment.order?.profile?.email}</p>
                                    </div>
                                    <p className="font-bold text-indigo-600">₹{(payment.order?.total_amount || 0).toFixed(2)}</p>
                                </div>
                            </div>

                            {/* Rejection Reason */}
                            {payment.status === 'rejected' && payment.rejection_reason && (
                                <div className="bg-red-50 p-3 rounded-lg border border-red-100 text-xs">
                                    <p className="font-bold text-red-800">Reason:</p>
                                    <p className="text-red-700">{payment.rejection_reason}</p>
                                </div>
                            )}

                            {/* Action Button */}
                            <button
                                onClick={() => {
                                    setSelectedPayment(payment);
                                    setShowModal(true);
                                }}
                                className={`w-full font-bold py-3 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 ${activeTab === 'pending'
                                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                                    : 'bg-white border-2 border-gray-200 text-gray-700 hover:border-indigo-300'
                                    }`}
                            >
                                {activeTab === 'pending' ? 'Review Payment' : 'View Details'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {payments.length === 0 && (
                <div className="text-center py-20 bg-white rounded-2xl border border-gray-200 mt-6">
                    <div className="text-6xl mb-4">
                        {activeTab === 'pending' ? '✅' : '📜'}
                    </div>
                    <p className="text-xl font-bold text-gray-900 mb-2">
                        {activeTab === 'pending' ? 'All Caught Up!' : 'No History Found'}
                    </p>
                    <p className="text-gray-600">
                        {activeTab === 'pending' ? 'No pending payments to verify' : 'No past verification records'}
                    </p>
                </div>
            )}

            {/* Review Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={selectedPayment?.status === 'pending' ? "Verify Payment" : "Payment Details"}
            >
                {selectedPayment && (
                    <div className="space-y-6">
                        {/* Status Banner for History */}
                        {selectedPayment.status !== 'pending' && (
                            <div className={`p-4 rounded-xl text-center border ${selectedPayment.status === 'verified' ? 'bg-green-100 border-green-200 text-green-800' : 'bg-red-100 border-red-200 text-red-800'
                                }`}>
                                <p className="font-bold text-lg uppercase">{selectedPayment.status}</p>
                                {selectedPayment.verified_at && <p className="text-xs mt-1">Processed on {new Date(selectedPayment.verified_at).toLocaleDateString()}</p>}
                                {selectedPayment.rejection_reason && <p className="text-sm mt-2 font-semibold">"{selectedPayment.rejection_reason}"</p>}
                            </div>
                        )}

                        {/* Screenshot */}
                        <div>
                            <p className="text-sm font-semibold text-gray-700 mb-3">Payment Screenshot</p>
                            <div className="w-full bg-gray-100 rounded-xl overflow-hidden border border-gray-200">
                                {selectedPayment.payment_screenshot_url && (
                                    <Image
                                        src={selectedPayment.payment_screenshot_url}
                                        alt="Payment Screenshot"
                                        width={800}
                                        height={600}
                                        className="w-full h-auto"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Transaction ID */}
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border-2 border-indigo-200">
                            <p className="text-sm font-bold text-indigo-600 mb-2">UTR NUMBER</p>
                            <p className="font-mono font-bold text-indigo-900 text-lg break-all">
                                {selectedPayment.utr_number || 'Not Provided'}
                            </p>
                        </div>

                        {/* Details Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <p className="text-xs text-gray-600 mb-1">Order ID</p>
                                <p className="font-mono font-bold text-gray-900">{selectedPayment.order?.order_id}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <p className="text-xs text-gray-600 mb-1">Amount</p>
                                <p className="text-xl font-bold text-indigo-600">₹{(selectedPayment.order?.total_amount || 0).toFixed(2)}</p>
                            </div>
                            <div className="col-span-1 sm:col-span-2 bg-gray-50 p-4 rounded-xl">
                                <p className="text-xs text-gray-600 mb-1">Customer</p>
                                <p className="font-semibold text-gray-900">{selectedPayment.order?.profile?.full_name}</p>
                                <p className="text-sm text-gray-600">{selectedPayment.order?.profile?.email}</p>
                            </div>
                        </div>

                        {/* Action Buttons - Only for Pending */}
                        {selectedPayment.status === 'pending' && (
                            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4">
                                <button
                                    onClick={() => handleVerify(selectedPayment.id, selectedPayment.order_id)}
                                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                                >
                                    ✓ Verify Payment
                                </button>
                                <button
                                    onClick={() => handleReject(selectedPayment.id)}
                                    className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold py-4 rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200"
                                >
                                    ✗ Reject
                                </button>
                            </div>
                        )}

                        {selectedPayment.status !== 'pending' && (
                            <button
                                onClick={() => setShowModal(false)}
                                className="w-full bg-gray-100 text-gray-700 font-bold py-4 rounded-xl hover:bg-gray-200 transition-all duration-200"
                            >
                                Close
                            </button>
                        )}
                    </div>
                )}
            </Modal>

            <style jsx>{`
                @keyframes fade-in {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slide-up {
                    from { 
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to { 
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in {
                    animation: fade-in 0.5s ease-out;
                }
                .animate-slide-up {
                    animation: slide-up 0.6s ease-out;
                }
            `}</style>
        </AdminLayout>
    );
}
