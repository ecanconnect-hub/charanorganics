/**
 * Server-side Session Management
 * 
 * Provides secure session validation and user authentication
 * for server components and API routes.
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export interface SessionData {
    session: any;
    user: {
        id: string;
        email: string;
        role: string;
    };
}

/**
 * Get current server-side session
 * Returns null if no valid session exists
 */
export async function getServerSession(): Promise<SessionData | null> {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set() {
                    // Session reader does not mutate cookies.
                },
                remove() {
                    // Session reader does not mutate cookies.
                },
            },
        }
    );

    // SECURITY: Never trust getSession() on the server as the source of identity.
    // getUser() revalidates the auth cookie with Supabase and avoids accepting
    // a forged or stale local session payload.
    const { data: { user: authUser }, error } = await supabase.auth.getUser();

    if (error || !authUser) {
        return null;
    }

    // Verify session is still valid in database
    const { data: user } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('id', authUser.id)
        .single();

    if (!user) {
        return null;
    }

    return {
        session: {
            user: authUser,
        },
        user,
    };
}

/**
 * Require authentication
 * Throws error if user is not authenticated
 */
export async function requireAuth(): Promise<SessionData> {
    const sessionData = await getServerSession();

    if (!sessionData) {
        throw new Error('Unauthorized: Authentication required');
    }

    return sessionData;
}

/**
 * Require admin role
 * Throws error if user is not an admin
 */
export async function requireAdmin(): Promise<SessionData> {
    const sessionData = await requireAuth();

    if (sessionData.user.role !== 'admin') {
        throw new Error('Forbidden: Admin access required');
    }

    return sessionData;
}

/**
 * Check if user has specific role
 */
export async function hasRole(role: string): Promise<boolean> {
    const sessionData = await getServerSession();

    if (!sessionData) {
        return false;
    }

    return sessionData.user.role === role;
}

/**
 * Get current user ID
 * Returns null if not authenticated
 */
export async function getCurrentUserId(): Promise<string | null> {
    const sessionData = await getServerSession();
    return sessionData?.user.id || null;
}
