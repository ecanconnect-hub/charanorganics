'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/Button';
import { useAuth } from '@/lib/auth/context';
import { supabase } from '@/lib/supabase/client';
import type { Database } from '@/lib/supabase/database.types';
import toast from 'react-hot-toast';

type ProfilePolicyRow = Pick<Database['public']['Tables']['profiles']['Row'], 'privacy_policy_accepted'>;

export default function SecurityPage() {
    const { user, loading } = useAuth();
    const userId = user?.id;
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [updating, setUpdating] = useState(false);
    const [policyAccepted, setPolicyAccepted] = useState(true);
    const [policyLoading, setPolicyLoading] = useState(true);
    const [savingPolicy, setSavingPolicy] = useState(false);

    useEffect(() => {
        const loadPolicyPreference = async () => {
            if (!userId) return;
            try {
                const { data, error } = await supabase
                    .from('profiles')
                    .select('privacy_policy_accepted')
                    .eq('id', userId)
                    .single();
                if (error) throw error;
                const profilePolicy = data as ProfilePolicyRow | null;
                setPolicyAccepted(profilePolicy?.privacy_policy_accepted ?? true);
            } catch (error) {
                console.error('Failed to load policy preference:', error);
            } finally {
                setPolicyLoading(false);
            }
        };
        void loadPolicyPreference();
    }, [userId]);

    const handleUpdatePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setUpdating(true);
        try {
            const { error } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (error) throw error;
            toast.success('Password updated successfully!');
            setNewPassword('');
            setConfirmPassword('');
        } catch (error: unknown) {
            const message = typeof error === 'object' && error !== null && 'message' in error
                ? String((error as { message?: string }).message)
                : 'Failed to update password';
            toast.error(message);
        } finally {
            setUpdating(false);
        }
    };

    if (loading || !user) return null;

    const handleSavePolicyPreference = async () => {
        setSavingPolicy(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ privacy_policy_accepted: policyAccepted } as never)
                .eq('id', user.id);
            if (error) throw error;
            toast.success('Policy preference updated');
        } catch (error: unknown) {
            const message = typeof error === 'object' && error !== null && 'message' in error
                ? String((error as { message?: string }).message)
                : 'Failed to update policy preference';
            toast.error(message);
        } finally {
            setSavingPolicy(false);
        }
    };

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
                        <h1 className="text-3xl font-black text-gray-900">Security</h1>
                        <p className="text-gray-500">Manage your password and account protection</p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Password Change Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-3xl p-8 shadow-xl shadow-gray-200/50 border border-gray-100"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                </svg>
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Change Password</h2>
                        </div>

                        <form onSubmit={handleUpdatePassword} className="space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">New Password</label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wider">Confirm New Password</label>
                                <input
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    required
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all outline-none"
                                />
                            </div>

                            <Button
                                variant="primary"
                                size="lg"
                                fullWidth
                                isLoading={updating}
                                type="submit"
                                className="rounded-xl shadow-lg hover:shadow-green-200 transition-all font-bold"
                            >
                                Update Password
                            </Button>
                        </form>
                    </motion.div>

                    {/* Reset Option Card */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-3xl p-8 shadow-md border border-gray-100 flex flex-col md:flex-row items-center justify-between gap-6"
                    >
                        <div>
                            <h3 className="font-bold text-gray-900 mb-1">Forgot your password?</h3>
                            <p className="text-gray-500 text-sm">We&apos;ll send a password reset link to <span className="font-bold text-gray-700">{user.email}</span></p>
                        </div>
                        <Link href="/forgot-password">
                            <Button variant="outline" className="rounded-full font-bold whitespace-nowrap">
                                Request Reset Link
                            </Button>
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-white rounded-3xl p-8 shadow-md border border-gray-100"
                    >
                        <h3 className="font-bold text-gray-900 mb-2">Policy Acceptance</h3>
                        <p className="text-gray-500 text-sm mb-5">
                            Keep this enabled to continue placing orders. If disabled, checkout will ask you to enable it here.
                        </p>

                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={policyAccepted}
                                onChange={(e) => setPolicyAccepted(e.target.checked)}
                                disabled={policyLoading || savingPolicy}
                                className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                            <span className="text-sm text-gray-700 font-semibold">
                                I accept the store policy and want to continue placing orders
                            </span>
                        </label>

                        <div className="mt-5">
                            <Button
                                variant="primary"
                                onClick={handleSavePolicyPreference}
                                isLoading={savingPolicy}
                                disabled={policyLoading}
                                className="rounded-xl font-bold"
                            >
                                Save Policy Preference
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </main>
    );
}
