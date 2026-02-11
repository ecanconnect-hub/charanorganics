/**
 * Server-Side Admin Verification Helpers
 * 
 * CRITICAL: Always use these functions in API routes and server components
 * to verify admin access. NEVER trust client-side checks!
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * Get server-side Supabase client
 */
export async function getServerSupabase() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                get(name: string) {
                    return cookieStore.get(name)?.value;
                },
                set(name: string, value: string, options: any) {
                    try {
                        cookieStore.set({ name, value, ...options });
                    } catch (error) {
                        // Ignore
                    }
                },
                remove(name: string, options: any) {
                    try {
                        cookieStore.set({ name, value: '', ...options });
                    } catch (error) {
                        // Ignore
                    }
                },
            },
        }
    );
}

/**
 * Verify user is admin - throws error if not
 * Use in API routes
 */
export async function requireAdmin() {
    const supabase = await getServerSupabase();

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
        throw new Error('Unauthorized: Not authenticated');
    }

    // Get user profile and role
    const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profileError || !profile) {
        console.error('❌ Profile fetch error:', {
            error: profileError,
            message: profileError?.message,
            code: profileError?.code,
            hint: profileError?.hint,
            details: profileError?.details,
            userId: user.id,
            userEmail: user.email,
            timestamp: new Date().toISOString()
        });

        // Log specific error types
        if (!profileError?.message) {
            console.error('⚠️ Empty error object - Supabase project may be paused or there is a network issue');
        } else if (profileError?.message?.includes('permission') || profileError?.code === '42501') {
            console.error('⚠️ Permission denied - check RLS policies on profiles table');
        }

        throw new Error('Unauthorized: Profile not found');
    }

    if (profile.role !== 'admin') {
        console.warn('⚠️ Non-admin user attempted admin action:', {
            email: user.email,
            userId: user.id,
            currentRole: profile.role,
            timestamp: new Date().toISOString()
        });
        throw new Error('Forbidden: Admin access required');
    }

    console.log('✅ Admin verified:', {
        email: user.email,
        userId: user.id,
        role: profile.role,
        timestamp: new Date().toISOString()
    });
    return { user, profile };
}

/**
 * Verify user is admin - redirects if not
 * Use in Server Components
 */
export async function requireAdminOrRedirect() {
    try {
        return await requireAdmin();
    } catch (error) {
        redirect('/');
    }
}

/**
 * Check if current user is admin (returns boolean)
 * Use when you need to conditionally show/hide features
 */
export async function isAdmin(): Promise<boolean> {
    try {
        await requireAdmin();
        return true;
    } catch {
        return false;
    }
}

/**
 * Get current user's role
 */
export async function getUserRole(): Promise<string | null> {
    const supabase = await getServerSupabase();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

    return profile?.role || null;
}

/**
 * Example API Route Usage:
 * 
 * // app/api/admin/users/route.ts
 * import { requireAdmin } from '@/lib/auth/admin';
 * 
 * export async function GET() {
 *     try {
 *         // This will throw if user is not admin
 *         await requireAdmin();
 *         
 *         // Admin-only logic here
 *         const users = await fetchAllUsers();
 *         return Response.json(users);
 *     } catch (error) {
 *         return Response.json(
 *             { error: error.message },
 *             { status: 403 }
 *         );
 *     }
 * }
 */

/**
 * Example Server Component Usage:
 * 
 * // app/admin/page.tsx
 * import { requireAdminOrRedirect } from '@/lib/auth/admin';
 * 
 * export default async function AdminPage() {
 *     // This will redirect to / if user is not admin
 *     const { user } = await requireAdminOrRedirect();
 *     
 *     return <div>Welcome, Admin {user.email}</div>;
 * }
 */
