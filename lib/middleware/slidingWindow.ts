/**
 * In-Memory Sliding-Window Rate Limiter
 *
 * Purpose: ultra-fast, zero-latency pre-screen in Next.js Middleware (Edge Runtime).
 * This runs BEFORE the request hits any API route, protecting Vercel CPU & DB connections.
 *
 * Design:
 *  - Sliding window algorithm per (IP, tier) pair.
 *  - In-memory Map — resets on each cold start (acceptable for edge functions).
 *  - Vercel Edge instances are short-lived; the Map stays lean automatically.
 *  - Distinct tiers allow stricter limits on search/cart vs general browsing.
 *
 * NOTE: This is intentionally separate from rateLimit.ts (which is Supabase-backed
 * and runs inside individual API route handlers for fine-grained per-endpoint limits).
 * The two layers complement each other:
 *   Middleware (this) = fast early rejection of obvious abuse
 *   Route handler     = precise per-endpoint counting with persistent storage
 */

export type RateTier = 'strict' | 'normal' | 'relaxed';

interface WindowEntry {
    timestamps: number[];
}

interface TierConfig {
    windowMs: number;
    maxRequests: number;
}

const TIER_CONFIG: Record<RateTier, TierConfig> = {
    // Search, cart mutations → tight
    strict: { windowMs: 60_000, maxRequests: 30 },
    // General API calls
    normal: { windowMs: 60_000, maxRequests: 60 },
    // Public read-only pages / static assets
    relaxed: { windowMs: 60_000, maxRequests: 120 },
};

// Global in-memory store (per Edge instance / serverless container)
const store = new Map<string, WindowEntry>();

// Cleanup stale entries every 5 minutes to prevent unbounded growth
let lastCleanup = Date.now();
const CLEANUP_INTERVAL_MS = 5 * 60_000;

function maybeCleanup(now: number): void {
    if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
    lastCleanup = now;

    for (const [key, entry] of store.entries()) {
        // Remove entries where all timestamps are older than the longest window
        const maxWindow = Math.max(...Object.values(TIER_CONFIG).map((c) => c.windowMs));
        const cutoff = now - maxWindow;
        const recent = entry.timestamps.filter((ts) => ts > cutoff);
        if (recent.length === 0) {
            store.delete(key);
        } else {
            entry.timestamps = recent;
        }
    }
}

export interface SlidingWindowResult {
    allowed: boolean;
    remaining: number;
    resetTime: number; // epoch ms
    limit: number;
}

/**
 * Check and record a request hit for the given IP + tier.
 *
 * @param ip    Client IP address.
 * @param tier  Rate tier to apply.
 */
export function checkSlidingWindow(ip: string, tier: RateTier): SlidingWindowResult {
    const now = Date.now();
    maybeCleanup(now);

    const config = TIER_CONFIG[tier];
    const key = `${tier}:${ip}`;
    const cutoff = now - config.windowMs;

    let entry = store.get(key);
    if (!entry) {
        entry = { timestamps: [] };
        store.set(key, entry);
    }

    // Prune timestamps outside the window
    entry.timestamps = entry.timestamps.filter((ts) => ts > cutoff);

    const count = entry.timestamps.length;

    if (count >= config.maxRequests) {
        const oldestInWindow = entry.timestamps[0] ?? now;
        return {
            allowed: false,
            remaining: 0,
            resetTime: oldestInWindow + config.windowMs,
            limit: config.maxRequests,
        };
    }

    // Record this request
    entry.timestamps.push(now);

    return {
        allowed: true,
        remaining: config.maxRequests - entry.timestamps.length,
        resetTime: now + config.windowMs,
        limit: config.maxRequests,
    };
}

/**
 * Derive the rate tier for a given pathname.
 */
export function getTierForPath(pathname: string): RateTier {
    // Strict tier: high-value or search-heavy endpoints
    if (
        pathname.startsWith('/api/shop/products') ||
        pathname.startsWith('/api/cart') ||
        pathname.startsWith('/api/checkout') ||
        pathname.startsWith('/api/auth') ||
        pathname.startsWith('/api/payment')
    ) {
        return 'strict';
    }

    // Normal tier: other API routes
    if (pathname.startsWith('/api/')) {
        return 'normal';
    }

    // Relaxed tier: pages, static assets
    return 'relaxed';
}
