/**
 * Reset Password Page - Premium Design
 * 
 * Users land here from the link in their email to set a new password.
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';

export default function ResetPasswordPage() {
    const router = useRouter();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(true);

    useEffect(() => {
        // Supabase handles the recovery session automatically when the link is clicked
        // We just need to check if we have a session or if it's a recovery flow
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                // If no session, they might have landed here manually or link expired
                // toast.error('Session expired or invalid link.');
                // router.push('/login');
            }
            setVerifying(false);
        };
        checkSession();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            toast.success('Password updated successfully!');
            router.push('/login');
        } catch (err: any) {
            toast.error(err.message || 'Failed to update password');
        } finally {
            setLoading(false);
        }
    };

    if (verifying) return null;

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden px-4">
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-100/50 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-100/50 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2"></div>

            <div className="max-w-md w-full relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-xl rounded-[4rem] shadow-2xl shadow-green-900/10 p-8 md:p-12 border border-white"
                >
                    <div className="text-center mb-10">
                        <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tighter italic">
                            New Password
                        </h1>
                        <p className="text-gray-500 font-medium">
                            Set your new account password below.
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <Input
                            type="password"
                            label="New Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            disabled={loading}
                            placeholder="••••••••"
                            className="h-14 bg-gray-50 border-gray-200 focus:bg-white transition-all rounded-3xl"
                        />

                        <Input
                            type="password"
                            label="Confirm New Password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            disabled={loading}
                            placeholder="••••••••"
                            className="h-14 bg-gray-50 border-gray-200 focus:bg-white transition-all rounded-3xl"
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            size="lg"
                            fullWidth
                            isLoading={loading}
                            className="h-14 text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-green-200 rounded-2xl"
                        >
                            Update Password
                        </Button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}
