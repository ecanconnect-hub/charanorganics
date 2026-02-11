/**
 * Server-side Session Management
 * 
 * Provides secure session validation and user authentication
 * for server components and API routes.
 */

import { createClient } from '@supabase/supabase-js';
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
    const cookieStore = cookies();

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
            },
        }
    );

    const { data: { session }, error } = await supabase.auth.getSession();

    if (error || !session) {
        return null;
    }

    // Verify session is still valid in database
    const { data: user } = await supabase
        .from('profiles')
        .select('id, email, role')
        .eq('id', session.user.id)
        .single();

    if (!user) {
        return null;
    }

    return {
        session,
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
