'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

export default function ProfilePage() {
    const router = useRouter();
    const { user, loading } = useAuth();
    const userId = user?.id;
    const [profile, setProfile] = useState<any>(null);
    const [fullName, setFullName] = useState('');
    const [phone, setPhone] = useState('');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login');
        }
    }, [user, loading, router]);

    useEffect(() => {
        async function fetchProfile() {
            if (userId) {
                const { data } = await (supabase
                    .from('profiles') as any)
                    .select('*')
                    .eq('id', userId)
                    .maybeSingle();

                if (data) {
                    setProfile(data);
                    setFullName(data.full_name || '');
                    setPhone(data.phone || '');
                }
            }
        }
        fetchProfile();
    }, [userId]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSaving(true);
        try {
            const { error } = await (supabase
                .from('profiles') as any)
                .update({
                    full_name: fullName,
                    phone: phone,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (error) throw error;
            toast.success('Profile updated successfully!');
        } catch (error: any) {
            toast.error(error.message || 'Failed to update profile');
        } finally {
            setSaving(false);
        }
    };

    if (loading || !user) return null;

    return (
        <main className="section-padding bg-gray-50/50 min-h-screen">
            {/* Safe top spacing to avoid header overlap */}
            <div className="h-24 md:h-28"></div>

            <div className="container mx-auto px-4 max-w-2xl">
                <div className="mb-8 flex items-center gap-4">
                    <Link href="/account">
                        <button className="p-2 hover:bg-white rounded-full transition-colors group">
                            <svg className="w-6 h-6 text-gray-400 group-hover:text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900">Profile Settings</h1>
                        <p className="text-gray-500">Update your personal information</p>
                    </div>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100"
                >
                    <form onSubmit={handleSave} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Email Address</label>
                            <input
                                type="email"
                                value={user.email}
                                disabled
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-500 cursor-not-allowed"
                            />
                            <p className="mt-1 text-xs text-gray-400 font-medium italic">Email cannot be changed</p>
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Full Name</label>
                            <input
                                type="text"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                placeholder="Enter your full name"
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Phone Number</label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="Enter your phone number"
                                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                            />
                        </div>

                        <div className="pt-4">
                            <Button
                                variant="primary"
                                size="lg"
                                fullWidth
                                isLoading={saving}
                                type="submit"
                                className="rounded-xl shadow-lg hover:shadow-green-200 transition-all font-bold"
                            >
                                Save Changes
                            </Button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </main>
    );
}
