/**
 * Next.js Middleware — Bot Protection & Rate Limiting
 *
 * Execution order on every request:
 *
 *  1. Extract client IP (Vercel-injected > x-real-ip > last x-forwarded-for)
 *  2. Classify User-Agent (trusted bot → pass, blocked bot → 403, suspicious → strict tier)
 *  3. Apply in-memory sliding-window rate limit per (IP, tier)
 *  4. If limit exceeded → 429 with Retry-After header
 *  5. Forward request with enriching headers for downstream handlers
 *
 * What this does NOT do:
 *  - Auth (handled by Supabase SSR in individual routes)
 *  - Per-endpoint fine-grained counting (handled by rateLimit.ts in route handlers)
 *
 * @module middleware
 */

import { NextRequest, NextResponse } from 'next/server';
import { classifyUserAgent } from '@/lib/middleware/botDetection';
import { checkSlidingWindow, getTierForPath, type RateTier } from '@/lib/middleware/slidingWindow';

// ---------------------------------------------------------------------------
// Routes that the middleware actively guards.
// Adjust the matcher at the bottom to control WHICH requests run middleware.
// ---------------------------------------------------------------------------

/** Extract the real client IP from Vercel-enriched headers. */
function getClientIp(request: NextRequest): string {
    // 1. request.ip — set by Vercel infrastructure, cannot be spoofed by users
    const vercelIp = (request as unknown as { ip?: string }).ip;
    if (vercelIp && vercelIp.trim()) return vercelIp.trim();

    // 2. x-real-ip — set by Vercel edge network
    const realIp = request.headers.get('x-real-ip')?.trim();
    if (realIp) return realIp;

    // 3. LAST x-forwarded-for entry — nearest trusted proxy
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        const parts = forwarded.split(',').map((s) => s.trim()).filter(Boolean);
        if (parts.length > 0) return parts[parts.length - 1];
    }

    return 'unknown';
}

/** Build a 429 Too Many Requests response. */
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

/** Build a 403 Forbidden response for blocked bots. */
function forbidden(reason: string): NextResponse {
    return NextResponse.json(
        { error: 'Forbidden', message: reason },
        {
            status: 403,
            headers: { 'Cache-Control': 'no-store' },
        }
    );
}

export function middleware(request: NextRequest): NextResponse {
    const pathname = request.nextUrl.pathname;
    const userAgent = request.headers.get('user-agent');
    const botVerdict = classifyUserAgent(userAgent);

    // ── 1. Hard-block known aggressive scrapers ──────────────────────────
    if (botVerdict === 'blocked') {
        return forbidden('Automated access is not permitted.');
    }

    // ── 2. Trusted search-engine bots → no rate limiting ─────────────────
    //    They are well-behaved and we want them to index the site.
    if (botVerdict === 'trusted') {
        // Still forward — let them through without counting against limits.
        return NextResponse.next();
    }

    // ── 3. Determine rate tier ────────────────────────────────────────────
    // Suspicious UAs get the strict (tightest) tier regardless of path.
    let tier: RateTier = getTierForPath(pathname);
    if (botVerdict === 'suspicious') {
        tier = 'strict';
    }

    // ── 4. Sliding-window check ───────────────────────────────────────────
    const clientIp = getClientIp(request);
    const result = checkSlidingWindow(clientIp, tier);

    if (!result.allowed) {
        return tooManyRequests(result.remaining, result.resetTime, result.limit);
    }

    // ── 5. Pass request — inject enriching headers for route handlers ──────
    const requestHeaders = new Headers(request.headers);

    // Downstream route handlers can read these without redoing IP extraction.
    requestHeaders.set('x-client-ip', clientIp);
    requestHeaders.set('x-bot-verdict', botVerdict);
    requestHeaders.set('x-rate-tier', tier);

    // Propagate rate-limit state so API handlers can add headers to responses.
    requestHeaders.set('x-ratelimit-remaining', String(result.remaining));
    requestHeaders.set('x-ratelimit-limit', String(result.limit));
    requestHeaders.set('x-ratelimit-reset', new Date(result.resetTime).toISOString());

    return NextResponse.next({ request: { headers: requestHeaders } });
}

// ---------------------------------------------------------------------------
// Matcher — which paths invoke this middleware.
//
// Excludes:
//   • _next/static / _next/image  → Next.js build assets (no need to rate-limit)
//   • favicon.ico                 → trivial, single file
//   • public files with extensions (images, fonts, etc.)
//
// Includes everything else: all pages and all /api/* routes.
// ---------------------------------------------------------------------------
export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff2?|ttf|eot|css|js|map)).*)',
    ],
};
