/**
 * Authentication Context
 * 
 * Manages user authentication state across the application
 */

'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string, fullName: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signOut: () => Promise<void>;
    resetPassword: (email: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function getErrorMessage(error: unknown): string {
    if (error instanceof Error && error.message) {
        return error.message;
    }

    if (typeof error === 'string') {
        return error;
    }

    if (typeof error === 'object' && error !== null && 'message' in error) {
        const maybeMessage = (error as { message?: unknown }).message;
        if (typeof maybeMessage === 'string') {
            return maybeMessage;
        }
    }

    return 'Unknown error';
}

function isNetworkAuthError(message: string): boolean {
    const normalized = message.toLowerCase();
    return (
        normalized.includes('fetch failed') ||
        normalized.includes('failed to fetch') ||
        normalized.includes('network') ||
        normalized.includes('timeout') ||
        normalized.includes('connect timeout') ||
        normalized.includes('und_err_connect_timeout')
    );
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        let isMounted = true;

        const initializeSession = async () => {
            try {
                const { data, error } = await supabase.auth.getSession();
                if (error) {
                    throw error;
                }

                if (!isMounted) return;
                setSession(data.session);
                setUser(data.session?.user ?? null);
            } catch (error) {
                const message = getErrorMessage(error);
                console.warn('Failed to initialize auth session:', message);

                // When network routing to Supabase fails, stale local auth state can trigger repeated refresh attempts.
                // Clear local session only (no server call) so the app can continue for public browsing.
                if (isNetworkAuthError(message)) {
                    try {
                        await supabase.auth.signOut({ scope: 'local' });
                    } catch (signOutError) {
                        console.warn('Failed to clear local auth session after network error:', signOutError);
                    }
                }

                if (!isMounted) return;
                setSession(null);
                setUser(null);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        void initializeSession();

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!isMounted) return;
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const signIn = async (email: string, password: string) => {
        try {
            // Brute-force check (best effort; continue gracefully if function isn't deployed)
            try {
                const { data: isBlocked } = await supabase.rpc(
                    'check_brute_force' as never,
                    { p_email: email } as never
                );
                if (isBlocked) {
                    toast.error('Too many failed attempts. Account temporarily locked.');
                    throw new Error('__ACCOUNT_BLOCKED__');
                }
            } catch (rateLimitCheckError) {
                if (rateLimitCheckError instanceof Error && rateLimitCheckError.message === '__ACCOUNT_BLOCKED__') {
                    throw new Error('Account temporarily locked');
                }
                console.warn('Brute-force check unavailable:', rateLimitCheckError);
            }

            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                // Log failure for security monitoring (optional)
                try {
                    await supabase
                        .from('login_security_events' as never)
                        .insert({
                            email,
                            event_type: 'failed_login'
                        } as never);
                } catch (logError) {
                    // Silently fail if table doesn't exist yet
                    console.warn('Security event logging failed:', logError);
                }
                throw error;
            }

            toast.success('Welcome back!');
            router.refresh();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error) || 'Failed to sign in');
            throw error;
        }
    };

    const signUp = async (email: string, password: string, fullName: string) => {
        try {
            const { error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                    },
                },
            });

            if (error) {
                // Better error message for existing users
                if (error.message.includes('User already registered') || error.status === 400 && error.message.toLowerCase().includes('already')) {
                    throw new Error('This email is already registered. Please login instead.');
                }
                throw error;
            }

            // Profile is now created automatically via database trigger (handle_new_user)
            // No manual insert needed here anymore

            toast.success('Account created! Please check your email to verify.');
        } catch (error: unknown) {
            toast.error(getErrorMessage(error) || 'Failed to sign up');
            throw error;
        }
    };


    const signInWithGoogle = async () => {
        try {
            // Get the current returnTo from URL or default to /account
            const searchParams = new URLSearchParams(window.location.search);
            const returnTo = searchParams.get('returnTo') || '/account';

            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent',
                    },
                    redirectTo: `${window.location.origin}/auth/callback?returnTo=${returnTo}`,
                },
            });

            if (error) throw error;
        } catch (error: unknown) {
            toast.error(getErrorMessage(error) || 'Failed to sign in with Google');
            throw error;
        }
    };

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            toast.success('Signed out successfully');
            router.push('/');
            router.refresh();
        } catch (error: unknown) {
            toast.error(getErrorMessage(error) || 'Failed to sign out');
            throw error;
        }
    };

    const resetPassword = async (email: string) => {
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
            });

            if (error) throw error;

            toast.success('Password reset email sent! Check your inbox.');
        } catch (error: unknown) {
            toast.error(getErrorMessage(error) || 'Failed to send reset email');
            throw error;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                loading,
                signIn,
                signUp,
                signInWithGoogle,
                signOut,
                resetPassword,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
}
