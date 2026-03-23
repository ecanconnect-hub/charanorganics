import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from '@/lib/supabase/database.types';
import { checkRateLimit } from '@/lib/middleware/rateLimit';
import { verifyGuestOrderToken } from '@/lib/security/guest-order-token';
import { ORDER_ID_PATTERN, normalizeOrderId } from '@/lib/security/order-id';
import { enforceSecureJsonPostRequest } from '@/lib/security/request-guards';

const submitSchema = z.object({
    orderId: z.string().trim().min(1).max(64),
    accessToken: z.string().trim().max(4096).optional(),
    utr: z.string().trim().max(64).optional(),
    // Accept either a Supabase Storage URL or a bucket-relative object path.
    screenshotUrl: z.string().trim().max(2048).optional(),
});

const PAYMENTS_BUCKET = 'payments';
const STORAGE_PUBLIC_PREFIX = `/storage/v1/object/public/${PAYMENTS_BUCKET}/`;
const STORAGE_SIGNED_PREFIX = `/storage/v1/object/sign/${PAYMENTS_BUCKET}/`;

function getSupabaseHostname(): string | null {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) return null;

    try {
        return new URL(supabaseUrl).hostname;
    } catch {
        return null;
    }
}

function extractPaymentsObjectPath(value: string): string | null {
    const trimmed = value.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        try {
            const hostname = getSupabaseHostname();
            if (!hostname) return null;

            const url = new URL(trimmed);
            if (url.hostname !== hostname) return null;

            const pathname = url.pathname;
            const prefix = pathname.startsWith(STORAGE_PUBLIC_PREFIX)
                ? STORAGE_PUBLIC_PREFIX
                : pathname.startsWith(STORAGE_SIGNED_PREFIX)
                    ? STORAGE_SIGNED_PREFIX
                    : null;

            if (!prefix) return null;

            const rawPath = pathname.slice(prefix.length);
            if (!rawPath) return null;

            return decodeURIComponent(rawPath);
        } catch {
            return null;
        }
    }

    // Treat as bucket-relative path (preferred).
    return trimmed.replace(/^\/+/, '');
}

function isSafeStoragePath(value: string): boolean {
    if (!value) return false;
    if (value.length > 512) return false;
    if (value.includes('\\')) return false;
    if (value.includes('..')) return false;
    if (value.includes('\u0000')) return false;
    if (value.startsWith('/')) return false;
    if (value.includes('?') || value.includes('#')) return false;
    return true;
}

export async function POST(request: NextRequest) {
    const requestGuardResponse = enforceSecureJsonPostRequest(request);
    if (requestGuardResponse) {
        return requestGuardResponse;
    }

    const { allowed, remaining, resetTime } = await checkRateLimit(request);
    if (!allowed) {
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            {
                status: 429,
                headers: {
                    'X-RateLimit-Remaining': '0',
                    'X-RateLimit-Reset': resetTime.toISOString(),
                    'Retry-After': Math.ceil((resetTime.getTime() - Date.now()) / 1000).toString(),
                    'Cache-Control': 'no-store',
                },
            }
        );
    }

    try {
        const body = await request.json();
        const parsed = submitSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid request' },
                { status: 400, headers: { 'Cache-Control': 'no-store' } }
            );
        }

        const normalizedOrderId = normalizeOrderId(parsed.data.orderId);
        if (!ORDER_ID_PATTERN.test(normalizedOrderId)) {
            return NextResponse.json(
                { error: 'Order not found' },
                {
                    status: 404,
                    headers: {
                        'X-RateLimit-Remaining': remaining.toString(),
                        'X-RateLimit-Reset': resetTime.toISOString(),
                        'Cache-Control': 'no-store',
                    },
                }
            );
        }

        if (!parsed.data.utr && !parsed.data.screenshotUrl) {
            return NextResponse.json(
                { error: 'UTR or screenshot is required' },
                { status: 400, headers: { 'Cache-Control': 'no-store' } }
            );
        }

        const cookieStore = await cookies();
        const authClient = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                cookies: {
                    getAll() {
                        return cookieStore.getAll();
                    },
                    setAll() {
                        // No cookie mutation needed.
                    },
                },
            }
        );

        const {
            data: { user },
        } = await authClient.auth.getUser();

        const serviceClient = createClient<Database>(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: order, error: orderError } = await serviceClient
            .from('orders')
            .select('id, user_id, status')
            .eq('order_id', normalizedOrderId)
            .single() as { data: any; error: any };

        if (orderError || !order) {
            return NextResponse.json(
                { error: 'Order not found' },
                {
                    status: 404,
                    headers: {
                        'X-RateLimit-Remaining': remaining.toString(),
                        'X-RateLimit-Reset': resetTime.toISOString(),
                        'Cache-Control': 'no-store',
                    },
                }
            );
        }

        let isAdmin = false;
        if (user) {
            const { data: requesterProfile } = await serviceClient
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single() as { data: { role: string } | null };
            isAdmin = requesterProfile?.role === 'admin';
        }

        const isOwner = !!user && order.user_id === user.id;
        const isTokenVerified =
            typeof parsed.data.accessToken === 'string' &&
            verifyGuestOrderToken(parsed.data.accessToken, normalizedOrderId);
        if (!isOwner && !isAdmin && !isTokenVerified) {
            // Avoid leaking whether an order exists for guessable order IDs.
            return NextResponse.json(
                { error: 'Order not found' },
                {
                    status: 404,
                    headers: {
                        'X-RateLimit-Remaining': remaining.toString(),
                        'X-RateLimit-Reset': resetTime.toISOString(),
                        'Cache-Control': 'no-store',
                    },
                }
            );
        }

        if (order.status !== 'pending_payment') {
            return NextResponse.json(
                { error: 'Payment already submitted' },
                {
                    status: 409,
                    headers: {
                        'X-RateLimit-Remaining': remaining.toString(),
                        'X-RateLimit-Reset': resetTime.toISOString(),
                        'Cache-Control': 'no-store',
                    },
                }
            );
        }

        let screenshotPath: string | null = null;
        if (parsed.data.screenshotUrl) {
            const extractedPath = extractPaymentsObjectPath(parsed.data.screenshotUrl);
            if (!extractedPath || !isSafeStoragePath(extractedPath)) {
                return NextResponse.json(
                    { error: 'Invalid screenshot reference' },
                    {
                        status: 400,
                        headers: {
                            'X-RateLimit-Remaining': remaining.toString(),
                            'X-RateLimit-Reset': resetTime.toISOString(),
                            'Cache-Control': 'no-store',
                        },
                    }
                );
            }

            const allowedPrefixes: string[] = [];
            if (isAdmin) {
                if (typeof order.user_id === 'string' && order.user_id) {
                    allowedPrefixes.push(`${order.user_id}/`);
                }
                allowedPrefixes.push('guest-uploads/');
            } else if (isOwner) {
                if (typeof order.user_id === 'string' && order.user_id) {
                    allowedPrefixes.push(`${order.user_id}/`);
                }
            } else if (isTokenVerified) {
                allowedPrefixes.push('guest-uploads/');
            }

            if (!allowedPrefixes.some((prefix) => extractedPath.startsWith(prefix))) {
                return NextResponse.json(
                    { error: 'Invalid screenshot reference' },
                    {
                        status: 400,
                        headers: {
                            'X-RateLimit-Remaining': remaining.toString(),
                            'X-RateLimit-Reset': resetTime.toISOString(),
                            'Cache-Control': 'no-store',
                        },
                    }
                );
            }

            screenshotPath = extractedPath;
        }

        const { error: insertError } = await (serviceClient
            .from('payments') as any)
            .insert({
                order_id: order.id,
                utr_number: parsed.data.utr || null,
                // Store only the bucket-relative object path (not a public URL).
                payment_screenshot_url: screenshotPath,
                status: 'pending',
            });

        if (insertError) {
            if (insertError.message?.toLowerCase().includes('unique')) {
                return NextResponse.json(
                    { error: 'Duplicate payment reference detected' },
                    {
                        status: 409,
                        headers: {
                            'X-RateLimit-Remaining': remaining.toString(),
                            'X-RateLimit-Reset': resetTime.toISOString(),
                            'Cache-Control': 'no-store',
                        },
                    }
                );
            }
            return NextResponse.json(
                { error: 'Failed to save payment details' },
                {
                    status: 400,
                    headers: {
                        'X-RateLimit-Remaining': remaining.toString(),
                        'X-RateLimit-Reset': resetTime.toISOString(),
                        'Cache-Control': 'no-store',
                    },
                }
            );
        }

        const { error: updateError } = await (serviceClient
            .from('orders') as any)
            .update({ status: 'payment_verification' })
            .eq('id', order.id)
            .eq('status', 'pending_payment');

        if (updateError) {
            return NextResponse.json(
                { error: 'Failed to update order status' },
                {
                    status: 400,
                    headers: {
                        'X-RateLimit-Remaining': remaining.toString(),
                        'X-RateLimit-Reset': resetTime.toISOString(),
                        'Cache-Control': 'no-store',
                    },
                }
            );
        }

        // Clear cart items for this user now that payment is submitted
        if (order.user_id) {
            await serviceClient
                .from('cart_items')
                .delete()
                .eq('user_id', order.user_id);
        }

        return NextResponse.json(
            { success: true },
            {
                headers: {
                    'X-RateLimit-Remaining': remaining.toString(),
                    'X-RateLimit-Reset': resetTime.toISOString(),
                    'Cache-Control': 'no-store',
                },
            }
        );
    } catch (error) {
        console.error('Payment submit API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: { 'Cache-Control': 'no-store' } }
        );
    }
}
