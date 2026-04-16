/**
 * Next.js Proxy / Middleware
 *
 * This is the ONLY middleware file. Next.js allows either middleware.ts OR proxy.ts.
 * We use proxy.ts because it was already present for Supabase auth.
 *
 * Execution order per request:
 *
 *  1. Bot detection  (UA classification) — blocked bots get 403 immediately
 *  2. Sliding-window rate limit — per IP, tiered by path — 429 if exceeded
 *  3. Supabase session refresh (cookie sync) — only when auth is needed
 *  4. Admin / Diagnostic / Account auth guards — redirect if not logged in / not admin
 *
 * Trusted bots (Googlebot, Bingbot, etc.) skip rate limiting entirely.
 */

import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { classifyUserAgent } from '@/lib/middleware/botDetection';
import { checkSlidingWindow, getTierForPath } from '@/lib/middleware/slidingWindow';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract the real client IP — prefer Vercel-injected values (cannot be spoofed). */
function getClientIp(req: NextRequest): string {
    const vercelIp = (req as unknown as { ip?: string }).ip;
    if (vercelIp?.trim()) return vercelIp.trim();

    const realIp = req.headers.get('x-real-ip')?.trim();
    if (realIp) return realIp;

    const forwarded = req.headers.get('x-forwarded-for');
    if (forwarded) {
        const parts = forwarded.split(',').map((s) => s.trim()).filter(Boolean);
        if (parts.length > 0) return parts[parts.length - 1];
    }

    return 'unknown';
}

function tooManyRequests(remaining: number, resetTime: number, limit: number): NextResponse {
    const retryAfterSec = Math.max(1, Math.ceil((resetTime - Date.now()) / 1000));
    return NextResponse.json(
        {
            error: 'Too Many Requests',
            message: 'You are sending too many requests. Please slow down and try again later.',
            retryAfter: retryAfterSec,
        },
        {
            status: 429,
            headers: {
                'Retry-After': String(retryAfterSec),
                'X-RateLimit-Limit': String(limit),
                'X-RateLimit-Remaining': String(remaining),
                'X-RateLimit-Reset': new Date(resetTime).toISOString(),
                'Cache-Control': 'no-store',
            },
        }
    );
}

function forbidden(reason: string): NextResponse {
    return NextResponse.json(
        { error: 'Forbidden', message: reason },
        { status: 403, headers: { 'Cache-Control': 'no-store' } }
    );
}

// ---------------------------------------------------------------------------
// Main proxy function
// ---------------------------------------------------------------------------

export async function proxy(req: NextRequest) {
    const isDev = process.env.NODE_ENV !== 'production';
    if (isDev) {
        console.log('Middleware path:', req.nextUrl.pathname);
    }

    const pathname = req.nextUrl.pathname;
    const userAgent = req.headers.get('user-agent');

    // ── Step 1: Bot detection ────────────────────────────────────────────────
    const botVerdict = classifyUserAgent(userAgent);

    if (botVerdict === 'blocked') {
        return forbidden('Automated access is not permitted.');
    }

    // Trusted bots (Googlebot, Bingbot, etc.) bypass rate limiting
    if (botVerdict !== 'trusted') {
        // ── Step 2: Sliding-window rate limiting ─────────────────────────────
        // Suspicious UAs (missing/short UA, curl-like tools) get strict tier
        const tier = botVerdict === 'suspicious' ? 'strict' : getTierForPath(pathname);
        const clientIp = getClientIp(req);
        const result = checkSlidingWindow(clientIp, tier);

        if (!result.allowed) {
            return tooManyRequests(result.remaining, result.resetTime, result.limit);
        }
    }

    // ── Step 3: Supabase session refresh ────────────────────────────────────
    // Only initialize Supabase when the path actually needs auth
    const needsAuth =
        pathname.startsWith('/admin') ||
        pathname.startsWith('/diagnostic') ||
        pathname.startsWith('/account');

    if (!needsAuth) {
        // No auth needed — pass through (with enriched headers for API handlers)
        const forwardHeaders = new Headers(req.headers);
        forwardHeaders.set('x-bot-verdict', botVerdict);
        return NextResponse.next({ request: { headers: forwardHeaders } });
    }

    // Initialize Supabase only for auth-gated paths
    let response = NextResponse.next({
        request: { headers: req.headers },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return req.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => {
                        req.cookies.set(name, value);
                        if (isDev) {
                            console.log('Middleware setting cookie:', { name, options });
                        }
                    });

                    response = NextResponse.next({
                        request: { headers: req.headers },
                    });

                    cookiesToSet.forEach(({ name, value, options }) => {
                        response.cookies.set(name, value, options);
                    });
                },
            },
        }
    );

    const {
        data: { user },
        error,
    } = await supabase.auth.getUser();

    if (pathname.startsWith('/account') && isDev) {
        console.log('Request cookies:', req.cookies.getAll().map((c) => c.name).join(', '));
        console.log('getUser() result:', { userEmail: user?.email, error: error?.message });
    }

    // ── Step 4: Admin / Diagnostic auth guard ────────────────────────────────
    if (pathname.startsWith('/admin') || pathname.startsWith('/diagnostic')) {
        if (!user) {
            const url = req.nextUrl.clone();
            url.pathname = '/login';
            url.searchParams.set('returnTo', pathname);
            return NextResponse.redirect(url);
        }

        const { data: profile, error: roleError } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single();

        if (isDev) {
            console.log('Admin access attempt:', {
                user: user.email,
                role: profile?.role,
                error: roleError?.message,
            });
        }

        if (!profile || profile.role !== 'admin') {
            if (isDev) {
                console.log('Blocked non-admin protected-panel attempt:', user.email, pathname);
            }

            await supabase.rpc('log_security_event', {
                p_user_id: user.id,
                p_action_type: 'unauthorized_access_attempt',
                p_resource_type: pathname.startsWith('/diagnostic') ? 'diagnostic_panel' : 'admin_panel',
                p_request_path: pathname,
                p_success: false,
                p_failure_reason: 'Non-admin role: ' + (profile?.role || 'none'),
            });

            const url = req.nextUrl.clone();
            url.pathname = '/';
            return NextResponse.redirect(url);
        }

        if (isDev) {
            console.log('Admin access granted:', user.email);
        }

        if (pathname === '/admin' || pathname === '/admin/dashboard') {
            await supabase.rpc('log_security_event', {
                p_user_id: user.id,
                p_action_type: 'admin_access',
                p_resource_type: 'admin_panel',
                p_request_path: pathname,
                p_success: true,
            });
        }
    }

    // ── Step 4b: Account auth guard ──────────────────────────────────────────
    // Account pages require login. Checkout is intentionally public for guest orders.
    if (pathname.startsWith('/account')) {
        if (!user) {
            const url = req.nextUrl.clone();
            url.pathname = '/login';
            url.searchParams.set('returnTo', pathname);
            return NextResponse.redirect(url);
        }
    }

    return response;
}

// ---------------------------------------------------------------------------
// Matcher
//
// Covers:
//  • /admin, /diagnostic, /account — auth-gated pages (existing behavior)
//  • /api/*                        — rate limiting + bot blocking
//  • All pages                     — bot blocking only (no rate limit for relaxed tier)
//
// Excludes Next.js internals and static assets to keep latency minimal.
// ---------------------------------------------------------------------------
export const config = {
    matcher: [
        '/admin/:path*',
        '/diagnostic',
        '/diagnostic/:path*',
        '/account/:path*',
        '/api/:path*',
        '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot|css|js|map)).*)',
    ],
};
