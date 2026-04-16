/**
 * Composable API Route Protection
 *
 * Wraps any Next.js Route Handler with:
 *  1. Supabase-backed per-endpoint rate limiting (withRateLimit from rateLimit.ts)
 *  2. Search query abuse prevention (length + char-set guards)
 *  3. Rate-limit response headers on every successful response
 *
 * Usage:
 *
 *   // Basic protection (rate limit only)
 *   export const GET = withApiProtection(myHandler);
 *
 *   // With search abuse guards
 *   export const GET = withApiProtection(myHandler, { searchParam: 'q', maxQueryLength: 80 });
 */

import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { withRateLimit } from '@/lib/middleware/rateLimit';

// ---------------------------------------------------------------------------
// Search param abuse guard
// ---------------------------------------------------------------------------

const SAFE_QUERY_RE = /^[\p{L}\p{N}\s\-.,'"()&]+$/u;

export interface SearchGuardOptions {
    /** URL search parameter name that holds the user query (e.g. 'q'). */
    searchParam: string;
    /** Maximum allowed character length. Default: 80. */
    maxQueryLength?: number;
    /** Whether to enforce the safe-character allowlist. Default: true. */
    enforceAllowlist?: boolean;
}

function validateSearchParam(
    request: NextRequest,
    options: SearchGuardOptions
): NextResponse | null {
    const { searchParam, maxQueryLength = 80, enforceAllowlist = true } = options;
    const raw = request.nextUrl.searchParams.get(searchParam);

    if (!raw) return null; // No query → nothing to validate

    if (raw.length > maxQueryLength) {
        return NextResponse.json(
            {
                error: 'Query too long',
                message: `The "${searchParam}" parameter must not exceed ${maxQueryLength} characters.`,
            },
            { status: 400, headers: { 'Cache-Control': 'no-store' } }
        );
    }

    if (enforceAllowlist && !SAFE_QUERY_RE.test(raw)) {
        return NextResponse.json(
            {
                error: 'Invalid query',
                message: `The "${searchParam}" parameter contains disallowed characters.`,
            },
            { status: 400, headers: { 'Cache-Control': 'no-store' } }
        );
    }

    return null;
}

// ---------------------------------------------------------------------------
// Main wrapper
// ---------------------------------------------------------------------------

export interface ApiProtectionOptions {
    /** If provided, validates search query parameter before calling the handler. */
    searchGuard?: SearchGuardOptions;
}

type RouteHandler = (request: NextRequest, context?: unknown) => Promise<NextResponse>;

/**
 * Wrap a route handler with rate limiting and optional search abuse guards.
 *
 * Applies Supabase-backed rate limiting (rateLimit.ts) on top of the
 * in-memory sliding-window already applied in middleware.ts.
 *
 * This double layer ensures:
 *  - Middleware catches broad bursts early (low latency, no DB hit)
 *  - Handler-level limiter enforces precise per-endpoint quotas with persistence
 */
export function withApiProtection(
    handler: RouteHandler,
    options: ApiProtectionOptions = {}
): RouteHandler {
    const { searchGuard } = options;

    // Wrap with Supabase-backed rate limiter
    const rateLimitedHandler = withRateLimit(handler as Parameters<typeof withRateLimit>[0]);

    return async (request: NextRequest, context?: unknown): Promise<NextResponse> => {
        // ── Search abuse guard ─────────────────────────────────────────────
        if (searchGuard) {
            const guardError = validateSearchParam(request, searchGuard);
            if (guardError) return guardError;
        }

        // ── Rate-limited execution ─────────────────────────────────────────
        return rateLimitedHandler(request);
    };
}
