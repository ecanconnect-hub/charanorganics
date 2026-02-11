/**
 * Rate Limiting Middleware
 * 
 * Implements IP-based and user-based rate limiting
 * Protects against abuse and DDoS attacks
 * Follows OWASP best practices
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase/client';

interface RateLimitConfig {
    windowMs: number; // Time window in milliseconds
    maxRequests: number; // Maximum requests per window
}

interface RateLimitRow {
    id: string;
    window_start: string;
    request_count: number;
}

// Default rate limit configurations
const RATE_LIMITS: Record<string, RateLimitConfig> = {
    '/api/auth/login': { windowMs: 15 * 60 * 1000, maxRequests: 5 }, // 5 attempts per 15 minutes
    '/api/auth/signup': { windowMs: 60 * 60 * 1000, maxRequests: 3 }, // 3 signups per hour
    '/api/orders': { windowMs: 60 * 1000, maxRequests: 10 }, // 10 orders per minute
    '/api/cart': { windowMs: 60 * 1000, maxRequests: 30 }, // 30 cart operations per minute
    '/api/products': { windowMs: 60 * 1000, maxRequests: 60 }, // 60 product requests per minute
    default: { windowMs: 60 * 1000, maxRequests: 100 }, // 100 requests per minute (default)
};

/**
 * Get client identifier (IP address or user ID)
 */
const getClientIdentifier = (request: NextRequest): string => {
    // Try to get user ID from auth header
    const authHeader = request.headers.get('authorization');
    if (authHeader) {
        // Extract user ID from JWT if available
        // For now, we'll use IP address
    }

    // Get IP address
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';

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

/**
 * Check and update rate limit
 */
export const checkRateLimit = async (
    request: NextRequest
): Promise<{ allowed: boolean; remaining: number; resetTime: Date }> => {
    const pathname = request.nextUrl.pathname;
    const identifier = getClientIdentifier(request);
    const config = getRateLimitConfig(pathname);

    const supabase = getServiceSupabase();
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);

    try {
        // Get or create rate limit record
        const { data: existingData, error: fetchError } = await supabase
            .from('rate_limits')
            .select('*')
            .eq('identifier', identifier)
            .eq('endpoint', pathname)
            .single();
        const existing = existingData as RateLimitRow | null;

        if (fetchError && fetchError.code !== 'PGRST116') {
            // Error other than "not found"
            console.error('Rate limit check error:', fetchError);
            // Allow request on error (fail open)
            return { allowed: true, remaining: config.maxRequests, resetTime: new Date(now.getTime() + config.windowMs) };
        }

        if (!existing) {
            // Create new rate limit record
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

        // Check if window has expired
        if (recordWindowStart < windowStart) {
            // Reset window
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

        // Window is still active
        if (existing.request_count >= config.maxRequests) {
            // Rate limit exceeded
            return {
                allowed: false,
                remaining: 0,
                resetTime: new Date(recordWindowStart.getTime() + config.windowMs),
            };
        }

        // Increment request count
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
        console.error('Rate limit error:', error);
        // Allow request on error (fail open)
        return { allowed: true, remaining: config.maxRequests, resetTime: new Date(now.getTime() + config.windowMs) };
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
