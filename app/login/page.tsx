'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/auth/context';
import { useTranslations } from '@/lib/i18n/context';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function getSafeReturnTo(value: string | null): string {
    if (!value || !value.startsWith('/')) {
        return '/account';
    }

    if (value.startsWith('//') || value.startsWith('/\\')) {
        return '/account';
    }

    return value;
}

function LoginPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { signIn, signInWithGoogle } = useAuth();
    const t = useTranslations('auth');

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const signupEmail = searchParams.get('email') || '';
    const returnTo = getSafeReturnTo(searchParams.get('returnTo'));

    useEffect(() => {
        // Support email pre-fill from URL param (legacy) and sessionStorage (preferred, no URL exposure)
        const storedEmail = (() => {
            try {
                const val = sessionStorage.getItem('prefill_login_email');
                if (val) sessionStorage.removeItem('prefill_login_email');
                return val || '';
            } catch { return ''; }
        })();
        const prefill = signupEmail || storedEmail;
        if (prefill) {
            setEmail(prefill);
        }
    }, [signupEmail]);

    const handleGoogleSignIn = async () => {
        try {
            await signInWithGoogle();
        } catch (err: any) {
            setError(err.message || 'Failed to sign in with Google');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signIn(email, password);
            // Redirect to the original destination
            router.push(returnTo);
        } catch (err: any) {
            setError(err.message || 'Failed to login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 relative overflow-hidden px-4 md:px-0">
            {/* Decorative Background Elements */}
            <div className="absolute top-0 right-0 w-96 h-96 bg-green-100/50 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-100/50 rounded-full blur-3xl -translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

            <div className="max-w-md w-full relative z-10">
                <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-2xl shadow-green-900/10 p-8 md:p-10 border border-white">
                    {/* Logo */}
                    <div className="text-center mb-10">
                        <Link href="/" className="inline-block group">
                            <div className="w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-green-900/10 transition-transform group-hover:scale-105 duration-300 bg-white overflow-hidden border-2 border-green-50/50">
                                <img
                                    src="/favicon.ico"
                                    alt="Charan Organics"
                                    className="w-full h-full object-contain p-2"
                                />
                            </div>
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {t('signInTitle')}
                        </h1>
                        <p className="text-gray-500 text-lg">
                            {t('signInSubtitle')}
                        </p>
                    </div>

                    {/* Continue with Google */}
                    <div className="mb-6">
                        <Button
                            type="button"
                            variant="outline"
                            size="lg"
                            fullWidth
                            onClick={handleGoogleSignIn}
                            className="h-12 border-gray-200 hover:bg-gray-50 text-gray-700 font-semibold transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-3"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </Button>
                    </div>

                    {/* Divider */}
                    <div className="mb-6 relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-100"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white/80 backdrop-blur text-gray-400 font-medium">
                                Or continue with email
                            </span>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 animate-fade-in">
                            <svg className="w-5 h-5 text-red-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <p className="text-red-600 text-sm font-medium">{error}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Input
                                type="email"
                                label={t('emailAddress')}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                disabled={loading}
                                placeholder="name@example.com"
                                className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                            />
                        </div>

                        <div className="space-y-4">
                            <Input
                                type="password"
                                label={t('password')}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                disabled={loading}
                                placeholder="Enter your password"
                                className="h-12 bg-gray-50 border-gray-200 focus:bg-white transition-all"
                            />
                        </div>

                        <div className="space-y-4 pt-2">
                            <Button
                                type="submit"
                                variant="primary"
                                size="lg"
                                fullWidth
                                isLoading={loading}
                                className="h-12 text-lg font-semibold shadow-lg shadow-green-500/20 hover:shadow-green-500/30 transition-all active:scale-[0.98]"
                            >
                                {t('login')}
                            </Button>

                            <div className="text-center">
                                <Link
                                    href="/forgot-password"
                                    className="text-sm text-gray-500 hover:text-green-600 font-medium transition-colors"
                                >
                                    {t('forgotPassword')}
                                </Link>
                            </div>
                        </div>
                    </form>

                    {/* Divider */}
                    <div className="mt-8 mb-6 relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-100"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-white/80 backdrop-blur text-gray-400 font-medium">
                                {t('newToCompany')}
                            </span>
                        </div>
                    </div>

                    {/* Sign Up Link */}
                    <div>
                        <Link href="/signup">
                            <Button
                                variant="outline"
                                size="lg"
                                fullWidth
                                className="h-12 border-gray-200 hover:!bg-green-600 hover:border-green-600 text-gray-700 hover:!text-white font-semibold transition-all shadow-sm hover:shadow-md"
                            >
                                {t('createAccount')}
                            </Button>
                        </Link>
                    </div>

                    {/* Back to Home */}
                    <div className="mt-8 text-center">
                        <Link
                            href="/"
                            className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                            {t('backToHome')}
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function LoginPage() {
    return (
        <Suspense fallback={null}>
            <LoginPageContent />
        </Suspense>
    );
}
