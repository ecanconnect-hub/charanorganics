/**
 * Forgot Password Page - Premium Design
 * 
 * Flow for requesting a password reset link
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { motion } from 'framer-motion';

export default function ForgotPasswordPage() {
    const { resetPassword } = useAuth();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            await resetPassword(email);
            setSubmitted(true);
        } catch (err: any) {
            console.error('Reset request failed:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden px-4">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-100/50 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-100/50 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

            <div className="max-w-md w-full relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-green-900/10 p-8 md:p-10 border border-white"
                >
                    <div className="text-center mb-10">
                        <Link href="/" className="inline-block mb-6">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto shadow-xl shadow-green-900/5 transition-transform hover:scale-105 duration-300 bg-white p-4">
                                <img src="/favicon.ico" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                        </Link>
                        <h1 className="text-4xl font-black text-gray-900 mb-3 tracking-tighter">
                            Forgot Password?
                        </h1>
                        <p className="text-gray-500 font-medium">
                            Enter your email and we&apos;ll send you a link to reset your password.
                        </p>
                    </div>

                    {!submitted ? (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Input
                                type="email"
                                label="Email Address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                                placeholder="name@example.com"
                                className="h-14 bg-gray-50 border-gray-200 focus:bg-white transition-all rounded-2xl"
                            />

                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                fullWidth
                                isLoading={loading}
                                className="h-14 text-xs font-black uppercase tracking-[0.2em] shadow-2xl shadow-green-200 rounded-2xl"
                            >
                                Send Reset Link
                            </Button>
                        </form>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-green-50 p-8 rounded-3xl border border-green-100 text-center"
                        >
                            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                                📩
                            </div>
                            <h3 className="text-green-900 font-black text-xl mb-2 italic">Check Your Inbox</h3>
                            <p className="text-green-700/80 text-sm font-medium leading-relaxed">
                                We&apos;ve sent a password reset link to <span className="font-bold text-green-900">{email}</span>. Please check your email and follow the instructions.
                            </p>
                        </motion.div>
                    )}

                    <div className="mt-10 text-center">
                        <Link href="/login" className="text-sm font-black uppercase tracking-widest text-gray-400 hover:text-green-600 transition-colors flex items-center justify-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Back to Login
                        </Link>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
