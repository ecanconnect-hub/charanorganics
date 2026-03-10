/**
 * Admin Session Security Hook
 * Enforces 24-hour session timeout and activity logging.
 */

'use client';

import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import toast from 'react-hot-toast';

const SESSION_TIMEOUT = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
const SESSION_CHECK_INTERVAL = 60 * 1000; // Check every minute
const WARNING_TIME = 30 * 60 * 1000; // Warn 30 minutes before timeout
const ADMIN_SESSION_START_KEY = 'admin_session_started_at';

type LegacyClient = {
    from: (table: string) => {
        insert: (values: Record<string, unknown>) => Promise<unknown>;
    };
    rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: boolean | null }>;
};

const legacyClient = supabase as unknown as LegacyClient;

export function useAdminSecurity(
    setVerifying?: (verified: boolean) => void,
    setAuthorized?: (allowed: boolean) => void
) {
    const router = useRouter();
    const warningShownRef = useRef(false);

    const handleSessionExpired = useCallback(async () => {
        toast.error('Your admin session expired. Please login again.', {
            duration: 5000,
        });

        try {
            localStorage.removeItem(ADMIN_SESSION_START_KEY);
        } catch {
            // ignore localStorage failures
        }

        await logAdminActivity('session_expired', null, null, {
            reason: 'timeout',
            duration_hours: 24
        });

        await supabase.auth.signOut();
        router.push('/login?reason=session_expired');
    }, [router]);

    useEffect(() => {
        const checkAccess = async () => {
            let isAllowed = await verifyAdminAccess();
            // Retry to avoid transient false negatives on refresh.
            for (let i = 0; i < 2 && !isAllowed; i += 1) {
                await new Promise((resolve) => setTimeout(resolve, 600));
                isAllowed = await verifyAdminAccess();
            }
            setAuthorized?.(isAllowed);

            if (setVerifying) {
                setVerifying(false);
            }

            if (!isAllowed) {
                // Enforce a hard deny at UI layer too, in case middleware/session state is stale.
                router.replace('/');
                return;
            }

            // Intelligent Session Recovery
            // If the user is authenticated (isAllowed === true), we should trust the Supabase session.
            // If the localStorage timer says "expired" but Supabase says "active", it means
            // the user likely logged in again (or just refreshed) and we should reset the timer.
            try {
                const stored = localStorage.getItem(ADMIN_SESSION_START_KEY);
                const parsed = stored ? Number(stored) : NaN;
                const now = Date.now();

                // Reset timer if:
                // 1. Missing or invalid
                // 2. Expired (older than 24h) - Assume this is a fresh login since isAllowed is true
                if (Number.isNaN(parsed) || parsed <= 0 || (now - parsed > SESSION_TIMEOUT)) {
                    localStorage.setItem(ADMIN_SESSION_START_KEY, String(now));
                }
            } catch {
                // ignore localStorage failures
            }
        };
        void checkAccess();

        const checkTimeout = window.setInterval(() => {
            let startedAt = 0;
            try {
                const stored = localStorage.getItem(ADMIN_SESSION_START_KEY);
                const parsed = stored ? Number(stored) : NaN;
                if (!Number.isNaN(parsed) && parsed > 0) {
                    startedAt = parsed;
                }
            } catch {
                // ignore
            }

            if (!startedAt) return;

            const elapsed = Date.now() - startedAt;
            const timeRemaining = SESSION_TIMEOUT - elapsed;

            if (timeRemaining <= WARNING_TIME && timeRemaining > 0 && !warningShownRef.current) {
                warningShownRef.current = true;
                const minutesLeft = Math.ceil(timeRemaining / 60000);
                toast.error(`Your session will expire in ${minutesLeft} minutes. Please save your work!`, {
                    duration: 10000,
                });
            }

            if (elapsed >= SESSION_TIMEOUT) {
                clearInterval(checkTimeout);
                void handleSessionExpired();
            }
        }, SESSION_CHECK_INTERVAL);

        return () => {
            clearInterval(checkTimeout);
        };
    }, [handleSessionExpired, router, setAuthorized, setVerifying]);

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
    details: Record<string, unknown> | null = null
) {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        await legacyClient.from('admin_activity_log').insert({
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

        const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if ((profile as any)?.role !== 'admin') {
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
        await legacyClient.from('login_security_events').insert({
            email,
            event_type: eventType,
            created_at: new Date().toISOString(),
        });

        if (eventType === 'failed_login') {
            const { data: isBlocked } = await legacyClient.rpc('check_brute_force', { p_email: email });
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
