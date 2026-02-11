'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function AddressesPage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const [addresses, setAddresses] = useState<any[]>([]);
    const [fetching, setFetching] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        address_line: '',
        city: '',
        state: '',
        pincode: '',
        is_default: false
    });

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    const fetchAddresses = async () => {
        if (user) {
            const { data } = await (supabase
                .from('addresses') as any)
                .select('*')
                .eq('user_id', user.id)
                .order('is_default', { ascending: false });

            setAddresses(data || []);
            setFetching(false);
        }
    };

    useEffect(() => {
        fetchAddresses();
    }, [user]);

    const handleAddAddress = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        try {
            // If this is default, unsettle other defaults
            if (formData.is_default) {
                await (supabase.from('addresses') as any).update({ is_default: false }).eq('user_id', user.id);
            }

            const { error } = await (supabase.from('addresses') as any).insert({
                ...formData,
                user_id: user.id
            });

            if (error) throw error;
            toast.success('Address added successfully!');
            setShowAddForm(false);
            setFormData({ name: '', phone: '', address_line: '', city: '', state: '', pincode: '', is_default: false });
            fetchAddresses();
        } catch (error: any) {
            toast.error(error.message || 'Failed to add address');
        }
    };

    const deleteAddress = async (id: string) => {
        if (!confirm('Are you sure you want to delete this address?')) return;

        try {
            const { error } = await (supabase.from('addresses') as any).delete().eq('id', id);
            if (error) throw error;
            toast.success('Address deleted');
            fetchAddresses();
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    if (loading || !user) return null;

    return (
        <main className="section-padding bg-gray-50/50 min-h-screen">
            {/* Safe top spacing to avoid header overlap */}
            <div className="h-24 md:h-28"></div>

            <div className="container mx-auto px-4 max-w-4xl">
                <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <Link href="/account">
                            <button className="p-2 hover:bg-white rounded-full transition-colors group">
                                <svg className="w-6 h-6 text-gray-400 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                                </svg>
                            </button>
                        </Link>
                        <div>
                            <h1 className="text-3xl font-black text-gray-900">Saved Addresses</h1>
                            <p className="text-gray-500">Manage your shipping locations</p>
                        </div>
                    </div>
                    <Button
                        variant="primary"
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="rounded-full shadow-lg font-bold"
                    >
                        {showAddForm ? 'Cancel' : 'Add New Address'}
                    </Button>
                </div>

                <AnimatePresence>
                    {showAddForm && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="overflow-hidden mb-8"
                        >
                            <form onSubmit={handleAddAddress} className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <input
                                        type="text" placeholder="Full Name" required
                                        value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium"
                                    />
                                    <input
                                        type="tel" placeholder="Phone Number" required
                                        value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium"
                                    />
                                </div>
                                <div className="space-y-4">
                                    <input
                                        type="text" placeholder="Address (House No, Building, Street)" required
                                        value={formData.address_line} onChange={e => setFormData({ ...formData, address_line: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium"
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="text" placeholder="City" required
                                            value={formData.city} onChange={e => setFormData({ ...formData, city: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium"
                                        />
                                        <input
                                            type="text" placeholder="State" required
                                            value={formData.state} onChange={e => setFormData({ ...formData, state: e.target.value })}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium"
                                        />
                                    </div>
                                    <input
                                        type="text" placeholder="Pincode" required
                                        value={formData.pincode} onChange={e => setFormData({ ...formData, pincode: e.target.value })}
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-green-500 transition-all font-medium"
                                    />
                                </div>
                                <div className="md:col-span-2 flex items-center gap-2">
                                    <input
                                        type="checkbox" id="default"
                                        checked={formData.is_default} onChange={e => setFormData({ ...formData, is_default: e.target.checked })}
                                        className="w-5 h-5 accent-green-600"
                                    />
                                    <label htmlFor="default" className="text-gray-600 font-medium">Set as default address</label>
                                </div>
                                <div className="md:col-span-2">
                                    <Button variant="primary" size="lg" fullWidth type="submit" className="rounded-xl font-bold shadow-green-100">
                                        Save Address
                                    </Button>
                                </div>
                            </form>
                        </motion.div>
                    )}
                </AnimatePresence>

                {fetching ? (
                    <div className="flex justify-center py-12">
                        <div className="w-10 h-10 border-4 border-green-100 border-t-green-600 rounded-full animate-spin"></div>
                    </div>
                ) : addresses.length === 0 ? (
                    <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-gray-200">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400 font-bold text-2xl">?</div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No addresses found</h3>
                        <p className="text-gray-500 mb-6">You haven't added any shipping addresses yet.</p>
                        <Button variant="outline" onClick={() => setShowAddForm(true)} className="rounded-full font-bold">Add One Now</Button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {addresses.map((address) => (
                            <motion.div
                                key={address.id}
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className={`bg-white rounded-3xl p-6 shadow-lg border-2 transition-all duration-300 ${address.is_default ? 'border-green-500 ring-4 ring-green-50' : 'border-gray-100 hover:border-gray-200'}`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 font-bold">
                                            {address.name[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{address.name}</h3>
                                            {address.is_default && <span className="text-[10px] font-black text-green-600 uppercase tracking-tighter bg-green-50 px-2 py-0.5 rounded-full ring-1 ring-green-200">Default</span>}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => deleteAddress(address.id)}
                                        className="text-gray-300 hover:text-red-500 transition-colors p-1"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                                <div className="text-gray-600 text-sm space-y-1 mb-4 leading-relaxed font-medium">
                                    <p className="flex items-center gap-2"><svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>{address.phone}</p>
                                    <p className="flex items-start gap-2"><svg className="w-4 h-4 text-gray-300 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>{address.address_line}</p>
                                    <p className="pl-6">{address.city}, {address.state} - {address.pincode}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
