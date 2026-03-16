import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from '@/lib/supabase/database.types';
import { checkRateLimit } from '@/lib/middleware/rateLimit';
import { verifyGuestOrderToken } from '@/lib/security/guest-order-token';
import { ORDER_ID_PATTERN, normalizeOrderId } from '@/lib/security/order-id';

const detailsSchema = z.object({
    orderId: z.string().trim().min(1).max(64),
    accessToken: z.string().trim().max(4096).optional(),
});

export async function POST(request: NextRequest) {
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
        const parsed = detailsSchema.safeParse(body);
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

        const { data: order, error } = await serviceClient
            .from('orders')
            .select('id, order_id, total_amount, status, user_id')
            .eq('order_id', normalizedOrderId)
            .single() as { data: any; error: any };

        if (error || !order) {
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
                { error: 'Order is not awaiting payment' },
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

        return NextResponse.json({
            id: order.id,
            orderId: order.order_id,
            totalAmount: Number(order.total_amount),
            status: order.status,
        }, {
            headers: {
                'X-RateLimit-Remaining': remaining.toString(),
                'X-RateLimit-Reset': resetTime.toISOString(),
                'Cache-Control': 'no-store',
            },
        });
    } catch (error) {
        console.error('Payment details API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: { 'Cache-Control': 'no-store' } }
        );
    }
}
