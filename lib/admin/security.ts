/**
 * Admin Session Security Hook
 * Enforces 3-hour session timeout and activity logging
 */

'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

const SESSION_TIMEOUT = 3 * 60 * 60 * 1000; // 3 hours in milliseconds
const ACTIVITY_CHECK_INTERVAL = 60 * 1000; // Check every minute
const WARNING_TIME = 5 * 60 * 1000; // Warn 5 minutes before timeout

export function useAdminSecurity(setVerifying?: (verified: boolean) => void) {
    const router = useRouter();
    const lastActivityRef = useRef<number>(Date.now());
    const warningShownRef = useRef<boolean>(false);

    useEffect(() => {
        // 1. Immediate Admin Verification
        const checkAccess = async () => {
            const isAllowed = await verifyAdminAccess();
            if (!isAllowed) {
                router.push('/');
                return;
            }
            if (setVerifying) {
                setVerifying(false);
            }
        };
        // Only run check on mount
        checkAccess();

        // 2. Update last activity on user interaction
        const updateActivity = () => {
            lastActivityRef.current = Date.now();
            warningShownRef.current = false;
        };

        // Listen to user activity
        const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];
        events.forEach(event => {
            window.addEventListener(event, updateActivity);
        });

        // Check session timeout periodically
        const checkTimeout = setInterval(() => {
            const timeSinceActivity = Date.now() - lastActivityRef.current;
            const timeRemaining = SESSION_TIMEOUT - timeSinceActivity;

            // Show warning 5 minutes before timeout
            if (timeRemaining <= WARNING_TIME && timeRemaining > 0 && !warningShownRef.current) {
                warningShownRef.current = true;
                const minutesLeft = Math.ceil(timeRemaining / 60000);
                toast.error(`Your session will expire in ${minutesLeft} minutes. Please save your work!`, {
                    duration: 10000,
                });
            }

            // Session expired - force logout
            if (timeSinceActivity >= SESSION_TIMEOUT) {
                // Remove listener before logout
                clearInterval(checkTimeout);
                handleSessionExpired();
            }
        }, ACTIVITY_CHECK_INTERVAL);

        return () => {
            events.forEach(event => {
                window.removeEventListener(event, updateActivity);
            });
            clearInterval(checkTimeout);
        };
    }, []);

    const handleSessionExpired = async () => {
        toast.error('Your session has expired for security reasons. Please login again.', {
            duration: 5000,
        });

        // Log the session expiry
        await logAdminActivity('session_expired', null, null, {
            reason: 'timeout',
            duration_hours: 3
        });

        // Sign out
        await supabase.auth.signOut();
        router.push('/login?reason=session_expired');
    };

    return {
        logActivity: logAdminActivity,
    };
}

/**
 * Log admin activity for audit trail
 */
export async function logAdminActivity(
    action: string,
    resourceType: string | null = null,
    resourceId: string | null = null,
    details: Record<string, any> | null = null
) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await (supabase.from('admin_activity_log') as any).insert({
            admin_id: user.id,
            action,
            resource_type: resourceType,
            resource_id: resourceId,
            details: details ? JSON.stringify(details) : null,
        });
    } catch (error) {
        console.error('Failed to log admin activity:', error);
    }
}

/**
 * Check if user is admin with valid session
 */
export async function verifyAdminAccess(): Promise<boolean> {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return false;

        const { data: profile } = await (supabase as any)
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (profile?.role !== 'admin') {
            await logAdminActivity('unauthorized_access_attempt', 'admin_panel', null, {
                user_id: user.id,
                email: user.email
            });
            return false;
        }

        // Log successful admin access
        await logAdminActivity('admin_panel_accessed', 'admin_panel', null, null);
        return true;
    } catch (error) {
        console.error('Error verifying admin access:', error);
        return false;
    }
}

/**
 * Track login security events (brute force protection)
 */
export async function trackSecurityEvent(email: string, eventType: 'failed_login' | 'blocked') {
    try {
        await (supabase.from('login_security_events') as any).insert({
            email,
            event_type: eventType,
            created_at: new Date().toISOString(),
        });

        if (eventType === 'failed_login') {
            const { data: isBlocked } = await (supabase as any).rpc('check_brute_force', { p_email: email });
            if (isBlocked) {
                toast.error('Too many failed attempts. Access restricted for 15 minutes.');
                return true;
            }
        }
    } catch (error) {
        console.error('Security tracking failed:', error);
    }
    return false;
}

/**
 * Track failed login attempts
 */
export async function trackFailedLogin(email: string) {
    return trackSecurityEvent(email, 'failed_login');
}

/**
 * Security headers and best practices
 */
export const SECURITY_HEADERS = {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
};
