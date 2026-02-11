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

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        try {
            // Brute-force check (best effort; continue gracefully if function isn't deployed)
            try {
                const { data: isBlocked } = await (supabase as any).rpc('check_brute_force', { p_email: email });
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

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                // Log failure for security monitoring (optional)
                try {
                    await (supabase.from('login_security_events') as any).insert({
                        email,
                        event_type: 'failed_login'
                    });
                } catch (logError) {
                    // Silently fail if table doesn't exist yet
                    console.warn('Security event logging failed:', logError);
                }
                throw error;
            }

            toast.success('Welcome back!');
            router.refresh();
        } catch (error: any) {
            toast.error(error.message || 'Failed to sign in');
            throw error;
        }
    };

    const signUp = async (email: string, password: string, fullName: string) => {
        try {
            const { data, error } = await supabase.auth.signUp({
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
        } catch (error: any) {
            toast.error(error.message || 'Failed to sign up');
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
        } catch (error: any) {
            toast.error(error.message || 'Failed to sign in with Google');
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
        } catch (error: any) {
            toast.error(error.message || 'Failed to sign out');
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
        } catch (error: any) {
            toast.error(error.message || 'Failed to send reset email');
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
