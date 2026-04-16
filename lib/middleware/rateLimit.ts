/**
 * Rate Limiting Middleware
 * 
 * Implements IP-based and user-based rate limiting
 * Protects against abuse and DDoS attacks
 * Follows OWASP best practices
 */

import 'server-only';

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/server-admin';

interface RateLimitConfig {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Maximum requests per window
}

interface RateLimitRow {
    id: string;
    window_start: string;
    request_count: number;
}

interface AtomicRateLimitRow {
    allowed: boolean;
    remaining: number;
    reset_time: string;
}

// Default rate limit configurations
const RATE_LIMITS: Record<string, RateLimitConfig> = {
    '/api/auth/login': { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 minutes
    '/api/auth/signup': { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 signups per hour
    '/api/checkout': { windowMs: 5 * 60 * 1000, maxRequests: 6 }, // 6 checkout attempts per 5 minutes
    '/api/payment/submit': { windowMs: 10 * 60 * 1000, maxRequests: 8 }, // 8 payment submits per 10 minutes
    '/api/payment/details': { windowMs: 5 * 60 * 1000, maxRequests: 20 }, // 20 payment detail lookups per 5 minutes
    '/api/send-order-email': { windowMs: 10 * 60 * 1000, maxRequests: 5 }, // 5 email triggers per 10 minutes
    '/api/track-order': { windowMs: 5 * 60 * 1000, maxRequests: 20 }, // 20 tracking checks per 5 minutes
    '/api/report-issue': { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 issue reports per 15 minutes
    '/api/orders': { windowMs: 60 * 1000, maxRequests: 10 }, // 10 orders per minute
    '/api/cart': { windowMs: 60 * 1000, maxRequests: 30 }, // 30 cart operations per minute
    '/api/shop/products': { windowMs: 60 * 1000, maxRequests: 60 }, // 60 product/search requests per minute
    '/api/shop/filters': { windowMs: 60 * 1000, maxRequests: 30 }, // 30 filter metadata requests per minute
    '/api/products': { windowMs: 60 * 1000, maxRequests: 60 }, // 60 product requests per minute
    default: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute (default)
};

const FAIL_CLOSED_ENDPOINT_PREFIXES = [
    '/api/auth/login',
    '/api/auth/signup',
    '/api/checkout',
    '/api/payment/details',
    '/api/payment/submit',
    '/api/send-order-email',
    '/api/track-order',
    '/api/report-issue',
    '/api/shop/products',
    '/api/shop/filters',
];

/**
 * Get client identifier (IP address or user ID)
 */
const getClientIdentifier = (request: NextRequest): string => {
    // SECURITY: Prefer request.ip (Vercel-injected, cannot be spoofed by end users).
    // Fall back to X-Real-IP then the LAST entry of X-Forwarded-For.
    // Never use the FIRST X-Forwarded-For value as primary — easily spoofed.
    const ipFromRequest = (() => {
        const candidate = (request as { ip?: string }).ip;
        return typeof candidate === 'string' && candidate.trim() ? candidate.trim() : null;
    })();

    const ipFromRealIp = request.headers.get('x-real-ip')?.trim() || null;

    // Use LAST x-forwarded-for entry (hardest for attacker to fake)
    const forwarded = request.headers.get('x-forwarded-for');
    const ipFromForwarded = forwarded
        ? forwarded.split(',').map((s) => s.trim()).filter(Boolean).at(-1) ?? null
        : null;

    const ip = ipFromRequest || ipFromRealIp || ipFromForwarded || 'unknown';
    return ip;
};

/**
 * Get rate limit configuration for endpoint
 */
const getRateLimitConfig = (pathname: string): RateLimitConfig => {
    // Find matching rate limit config
    for (const [path, config] of Object.entries(RATE_LIMITS)) {
        if (pathname.startsWith(path)) {
            return config;
        }
    }

    return RATE_LIMITS.default;
};

const shouldFailClosed = (pathname: string): boolean =>
    FAIL_CLOSED_ENDPOINT_PREFIXES.some((prefix) => pathname.startsWith(prefix));

const failRateLimitCheck = (failClosed: boolean, config: RateLimitConfig, now: Date) => ({
    allowed: !failClosed,
    remaining: failClosed ? 0 : config.maxRequests,
    resetTime: new Date(now.getTime() + config.windowMs),
});

const checkRateLimitLegacy = async ({
    supabase,
    pathname,
    identifier,
    config,
    failClosed,
    now,
}: {
    supabase: ReturnType<typeof getServiceSupabase>;
    pathname: string;
    identifier: string;
    config: RateLimitConfig;
    failClosed: boolean;
    now: Date;
}): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> => {
    const windowStart = new Date(now.getTime() - config.windowMs);

    try {
        const { data: existingData, error: fetchError } = await supabase
            .from('rate_limits')
            .select('*')
            .eq('identifier', identifier)
            .eq('endpoint', pathname)
            .single();
        const existing = existingData as RateLimitRow | null;

        if (fetchError && fetchError.code !== 'PGRST116') {
            console.error('Legacy rate limit check error:', fetchError);
            return failRateLimitCheck(failClosed, config, now);
        }

        if (!existing) {
            await (supabase
                .from('rate_limits') as any)
                .insert({
                    identifier,
                    endpoint: pathname,
                    request_count: 1,
                    window_start: now.toISOString(),
                });

            return {
                allowed: true,
                remaining: config.maxRequests - 1,
                resetTime: new Date(now.getTime() + config.windowMs),
            };
        }

        const recordWindowStart = new Date(existing.window_start);

        if (recordWindowStart < windowStart) {
            await (supabase
                .from('rate_limits') as any)
                .update({
                    request_count: 1,
                    window_start: now.toISOString(),
                })
                .eq('id', existing.id);

            return {
                allowed: true,
                remaining: config.maxRequests - 1,
                resetTime: new Date(now.getTime() + config.windowMs),
            };
        }

        if (existing.request_count >= config.maxRequests) {
            return {
                allowed: false,
                remaining: 0,
                resetTime: new Date(recordWindowStart.getTime() + config.windowMs),
            };
        }

        await (supabase
            .from('rate_limits') as any)
            .update({
                request_count: existing.request_count + 1,
            })
            .eq('id', existing.id);

        return {
            allowed: true,
            remaining: config.maxRequests - existing.request_count - 1,
            resetTime: new Date(recordWindowStart.getTime() + config.windowMs),
        };
    } catch (error) {
        console.error('Legacy rate limit error:', error);
        return failRateLimitCheck(failClosed, config, now);
    }
};

/**
 * Check and update rate limit
 */
export const checkRateLimit = async (
    request: NextRequest
): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> => {
    const pathname = request.nextUrl.pathname;
    const identifier = getClientIdentifier(request);
    const config = getRateLimitConfig(pathname);
    const failClosed = shouldFailClosed(pathname);

    const supabase = getServiceSupabase();
    const now = new Date();
    try {
        const { data, error } = await (supabase.rpc as any)('check_rate_limit_atomic', {
            p_identifier: identifier,
            p_endpoint: pathname,
            p_window_ms: config.windowMs,
            p_max_requests: config.maxRequests,
        });

        if (error) {
            console.error('Atomic rate limit rpc error:', error);
            return await checkRateLimitLegacy({
                supabase,
                pathname,
                identifier,
                config,
                failClosed,
                now,
            });
        }

        const result = (Array.isArray(data) ? data[0] : data) as AtomicRateLimitRow | null;
        if (!result || typeof result.allowed !== 'boolean' || typeof result.reset_time !== 'string') {
            console.error('Atomic rate limit rpc returned invalid payload:', data);
            return await checkRateLimitLegacy({
                supabase,
                pathname,
                identifier,
                config,
                failClosed,
                now,
            });
        }

        return {
            allowed: result.allowed,
            remaining: Math.max(Number(result.remaining || 0), 0),
            resetTime: new Date(result.reset_time),
        };
    } catch (error) {
        console.error('Rate limit error:', error);
        return await checkRateLimitLegacy({
            supabase,
            pathname,
            identifier,
            config,
            failClosed,
            now,
        });
    }
};

/**
 * Rate limit middleware wrapper
 */
export const withRateLimit = (
    handler: (request: NextRequest) => Promise<NextResponse>
) => {
    return async (request: NextRequest): Promise<NextResponse> => {
        const { allowed, remaining, resetTime } = await checkRateLimit(request);

        if (!allowed) {
            return NextResponse.json(
                {
                    error: 'Too many requests',
                    message: 'Rate limit exceeded. Please try again later.',
                    resetTime: resetTime.toISOString(),
                },
                {
                    status: 429,
                    headers: {
                        'X-RateLimit-Limit': getRateLimitConfig(request.nextUrl.pathname).maxRequests.toString(),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Reset': resetTime.toISOString(),
                        'Retry-After': Math.ceil((resetTime.getTime() - Date.now()) / 1000).toString(),
                    },
                }
            );
        }

        const response = await handler(request);

        // Add rate limit headers to response
        response.headers.set('X-RateLimit-Limit', getRateLimitConfig(request.nextUrl.pathname).maxRequests.toString());
        response.headers.set('X-RateLimit-Remaining', remaining.toString());
        response.headers.set('X-RateLimit-Reset', resetTime.toISOString());

        return response;
    };
};
