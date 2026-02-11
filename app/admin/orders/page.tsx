/**
 * Admin Orders Page - Premium Design with Order Details Modal
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

export default function AdminOrdersPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [orders, setOrders] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        checkAdmin();
    }, [user]);

    const checkAdmin = async () => {
        if (!user) {
            router.push('/login');
            return;
        }

        const { data: profile } = await (supabase
            .from('profiles' as any)
            .select('role')
            .eq('id', user.id)
            .single() as any);

        if ((profile as any)?.role !== 'admin') {
            router.push('/');
            return;
        }

        fetchOrders();
    };

    const fetchOrders = async () => {
        setLoading(true);
        const { data } = await (supabase
            .from('orders' as any) as any)
            .select(`
                *,
                profile:profiles (full_name, email, phone),
                payment:payments (utr_number, payment_screenshot_url, status)
            `)
            .order('created_at', { ascending: false });

        setOrders(data || []);
        setLoading(false);
    };

    const updateOrderStatus = async (orderId: string, newStatus: string, currentStatus: string) => {
        // Confirm if reverting to a previous status
        const statusOrder = ['pending', 'confirmed', 'shipped', 'delivered'];
        const currentIndex = statusOrder.indexOf(currentStatus);
        const newIndex = statusOrder.indexOf(newStatus);

        if (newIndex < currentIndex) {
            const confirmed = confirm(`Are you sure you want to revert this order back to "${newStatus.toUpperCase()}"?`);
            if (!confirmed) return;
        }

        const { error } = await (supabase
            .from('orders') as any)
            .update({ status: newStatus })
            .eq('id', orderId);

        if (!error) {
            // SECURITY: Logic to ensure workflow consistency
            // If order is reverted to verification stage, reset payment status to 'pending'
            // so it reappears in the Payment Verification page.
            if (newStatus === 'pending_payment' || newStatus === 'payment_verification') {
                const { error: paymentError } = await (supabase
                    .from('payments') as any)
                    .update({ status: 'pending' })
                    .eq('order_id', orderId);

                if (paymentError) {
                    console.error('Failed to reset payment status:', paymentError);
                    toast.error('Order updated, but failed to reset payment verification status.');
                } else {
                    toast.success('Order reverted & payment marked for re-verification.');
                }
            } else {
                toast.success(`Order status updated to ${newStatus.toUpperCase()}!`);
            }

            fetchOrders();
        } else {
            console.error('Update error:', error);
            toast.error(`Failed to update status: ${error.message}`);
        }
    };

    const viewOrderDetails = async (order: any) => {
        // Fetch full order details including items
        const { data: orderItems } = await (supabase
            .from('order_items' as any) as any)
            .select(`
                *,
                product:products (title_en, image_url)
            `)
            .eq('order_id', order.id);

        // Fetch order history
        const { data: orderHistory } = await (supabase
            .from('order_history' as any) as any)
            .select(`
                *,
                changed_by_profile:profiles!changed_by (full_name, email)
            `)
            .eq('order_id', order.id)
            .order('changed_at', { ascending: true });

        setSelectedOrder({
            ...order,
            items: orderItems || [],
            history: orderHistory || []
        });
        setShowModal(true);
    };

    const filteredOrders = filterStatus === 'all'
        ? orders
        : filterStatus === 'pending'
            ? orders.filter(o => o.status === 'pending_payment' || o.status === 'payment_verification')
            : orders.filter(o => o.status === filterStatus);

    if (loading) {
        return (
            <AdminLayout title="Orders" subtitle="Manage all customer orders">
                <div className="flex items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-600 border-t-transparent"></div>
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Orders" subtitle="Manage all customer orders">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-3 mb-6 animate-fade-in">
                {['all', 'pending', 'confirmed', 'shipped', 'delivered'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilterStatus(status)}
                        className={`px-6 py-3 rounded-xl font-semibold transition-all transform hover:scale-105 ${filterStatus === status
                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg'
                            : 'bg-white text-gray-700 border border-gray-200 hover:border-indigo-300'
                            }`}
                    >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        {status === 'all' && ` (${orders.length})`}
                    </button>
                ))}
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-slide-up">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                            <tr>
                                <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm">Order ID</th>
                                <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm">Customer</th>
                                <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm">Amount</th>
                                <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm">UTR Number</th>
                                <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm">Status</th>
                                <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm">Date</th>
                                <th className="text-left py-4 px-6 font-bold text-gray-700 text-sm">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredOrders.map((order, index) => (
                                <tr
                                    key={order.id}
                                    className="hover:bg-indigo-50/50 transition-colors"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <td className="py-4 px-6">
                                        <span className="font-mono text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg border border-indigo-100">
                                            {order.order_id}
                                        </span>
                                    </td>
                                    <td className="py-4 px-6">
                                        <p className="font-semibold text-gray-900">{order.profile?.full_name}</p>
                                        <p className="text-xs text-gray-500">{order.profile?.email}</p>
                                    </td>
                                    <td className="py-4 px-6">
                                        <span className="font-bold text-gray-900 text-lg">₹{(order.total_amount || 0).toFixed(2)}</span>
                                    </td>
                                    <td className="py-4 px-6">
                                        {order.payment && order.payment.length > 0 ? (
                                            <span className="font-mono text-xs bg-green-50 text-green-800 px-3 py-1 rounded-lg border border-green-200">
                                                {order.payment[0].utr_number || 'N/A'}
                                            </span>
                                        ) : (
                                            <span className="text-xs text-gray-400">No payment</span>
                                        )}
                                    </td>
                                    <td className="py-4 px-6">
                                        <select
                                            value={order.status}
                                            onChange={(e) => updateOrderStatus(order.id, e.target.value, order.status)}
                                            className={`px-4 py-2 rounded-xl text-xs font-bold border-2 cursor-pointer transition-all hover:scale-105 ${order.status === 'delivered' ? 'bg-green-50 text-green-800 border-green-200' :
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
                                    <td className="py-4 px-6 text-sm text-gray-600 font-medium">
                                        {new Date(order.created_at).toLocaleDateString('en-IN', {
                                            day: 'numeric',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </td>
                                    <td className="py-4 px-6">
                                        <button
                                            onClick={() => viewOrderDetails(order)}
                                            className="text-indigo-600 hover:text-indigo-700 font-semibold text-sm hover:underline"
                                        >
                                            View Details →
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredOrders.length === 0 && (
                    <div className="text-center py-16">
                        <div className="text-6xl mb-4">📦</div>
                        <p className="text-gray-500 font-medium">No orders found</p>
                    </div>
                )}
            </div>

            {/* Order Details Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title="Order Details"
            >
                {selectedOrder && (
                    <div className="space-y-6">
                        {/* Order Info */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <p className="text-xs text-gray-600 mb-1">Order ID</p>
                                <p className="font-mono font-bold text-gray-900">{selectedOrder.order_id}</p>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-xl">
                                <p className="text-xs text-gray-600 mb-1">Status</p>
                                <p className="font-bold text-gray-900 uppercase">{selectedOrder.status}</p>
                            </div>
                        </div>

                        {/* Customer Info */}
                        <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
                            <h4 className="font-bold text-gray-900 mb-3">Customer Information</h4>
                            <div className="space-y-2">
                                <p className="text-sm"><span className="font-semibold">Name:</span> {selectedOrder.profile?.full_name}</p>
                                <p className="text-sm"><span className="font-semibold">Email:</span> {selectedOrder.profile?.email}</p>
                                <p className="text-sm"><span className="font-semibold">Phone:</span> {selectedOrder.profile?.phone || selectedOrder.phone}</p>
                                <p className="text-sm"><span className="font-semibold">Address:</span> {selectedOrder.shipping_address}</p>
                                <p className="text-sm"><span className="font-semibold">Pincode:</span> {selectedOrder.pincode}</p>
                            </div>
                        </div>

                        {/* Payment Info */}
                        {selectedOrder.payment && selectedOrder.payment.length > 0 && (
                            <div className="bg-green-50 p-6 rounded-xl border border-green-100">
                                <h4 className="font-bold text-gray-900 mb-3">Payment Information</h4>
                                <div className="space-y-2">
                                    <p className="text-sm"><span className="font-semibold">UTR Number:</span>
                                        <span className="ml-2 font-mono bg-white px-2 py-1 rounded border border-green-200">
                                            {selectedOrder.payment[0].utr_number || 'Not provided'}
                                        </span>
                                    </p>
                                    <p className="text-sm"><span className="font-semibold">Amount:</span> ₹{(selectedOrder.total_amount || 0).toFixed(2)}</p>
                                    <p className="text-sm"><span className="font-semibold">Payment Status:</span>
                                        <span className={`ml-2 px-2 py-1 rounded text-xs font-bold ${selectedOrder.payment[0].status === 'verified' ? 'bg-green-200 text-green-800' : 'bg-yellow-200 text-yellow-800'
                                            }`}>
                                            {selectedOrder.payment[0].status?.toUpperCase()}
                                        </span>
                                    </p>
                                </div>
                                {selectedOrder.payment[0].payment_screenshot_url && (
                                    <div className="mt-4">
                                        <p className="text-sm font-semibold mb-2">Payment Screenshot:</p>
                                        <Image
                                            src={selectedOrder.payment[0].payment_screenshot_url}
                                            alt="Payment proof"
                                            width={400}
                                            height={300}
                                            className="rounded-lg border border-green-200"
                                        />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Order Items */}
                        <div>
                            <h4 className="font-bold text-gray-900 mb-3">Order Items</h4>
                            <div className="space-y-3">
                                {selectedOrder.items?.map((item: any) => (
                                    <div key={item.id} className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl">
                                        {item.product?.image_url && (
                                            <Image
                                                src={item.product.image_url}
                                                alt={item.product.title_en}
                                                width={60}
                                                height={60}
                                                className="rounded-lg"
                                            />
                                        )}
                                        <div className="flex-1">
                                            <p className="font-bold text-gray-900 text-lg">{item.product_title_en}</p>
                                            {item.variant_label && (
                                                <p className="text-sm font-bold text-indigo-600 mb-1">Variant: {item.variant_label}</p>
                                            )}
                                            <p className="text-sm text-gray-600 font-medium">Qty: {item.quantity} × ₹{(item.unit_price || 0).toFixed(2)}</p>
                                        </div>
                                        <p className="font-bold text-gray-900">₹{(item.total_price || 0).toFixed(2)}</p>
                                    </div>
                                ))}
                            </div>
                        </div>


                        {/* Order History Timeline */}
                        {selectedOrder.history && selectedOrder.history.length > 0 && (
                            <div>
                                <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <span className="text-xl">📜</span>
                                    Order History
                                </h4>
                                <div className="relative">
                                    {/* Timeline line */}
                                    <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gray-200"></div>

                                    <div className="space-y-4">
                                        {selectedOrder.history.map((entry: any, index: number) => (
                                            <div key={entry.id} className="relative flex gap-4">
                                                {/* Timeline dot */}
                                                <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${entry.status === 'delivered' ? 'bg-green-500' :
                                                    entry.status === 'shipped' ? 'bg-indigo-500' :
                                                        entry.status === 'confirmed' ? 'bg-blue-500' :
                                                            'bg-yellow-500'
                                                    } shadow-lg`}>
                                                    <span className="text-white text-xl">
                                                        {entry.status === 'delivered' ? '✓' :
                                                            entry.status === 'shipped' ? '🚚' :
                                                                entry.status === 'confirmed' ? '✓' :
                                                                    '⏳'}
                                                    </span>
                                                </div>

                                                {/* Content */}
                                                <div className="flex-1 bg-gray-50 p-4 rounded-xl border border-gray-200">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div>
                                                            <p className={`font-bold text-sm uppercase ${entry.status === 'delivered' ? 'text-green-700' :
                                                                entry.status === 'shipped' ? 'text-indigo-700' :
                                                                    entry.status === 'confirmed' ? 'text-blue-700' :
                                                                        'text-yellow-700'
                                                                }`}>
                                                                {entry.status}
                                                            </p>
                                                            {entry.notes && (
                                                                <p className="text-sm text-gray-600 mt-1">{entry.notes}</p>
                                                            )}
                                                        </div>
                                                        <span className="text-xs text-gray-500 font-mono">
                                                            {new Date(entry.changed_at).toLocaleString('en-IN', {
                                                                day: '2-digit',
                                                                month: 'short',
                                                                year: 'numeric',
                                                                hour: '2-digit',
                                                                minute: '2-digit',
                                                                hour12: true
                                                            })}
                                                        </span>
                                                    </div>
                                                    {entry.changed_by_profile && (
                                                        <p className="text-xs text-gray-500">
                                                            Changed by: {entry.changed_by_profile.full_name || entry.changed_by_profile.email}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Total */}
                        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-6 rounded-xl border-2 border-indigo-200">
                            <div className="flex justify-between items-center">
                                <span className="text-lg font-bold text-gray-900">Total Amount:</span>
                                <span className="text-2xl font-bold text-indigo-600">₹{(selectedOrder.total_amount || 0).toFixed(2)}</span>
                            </div>
                        </div>
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
