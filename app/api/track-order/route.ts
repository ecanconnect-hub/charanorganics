import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from '@/lib/supabase/database.types';
import { checkRateLimit } from '@/lib/middleware/rateLimit';

const trackOrderSchema = z.object({
    orderId: z.string().min(1),
    phone: z.string().trim().optional(),
});

const normalizePhone = (value: string): string => value.replace(/\D/g, '');

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
                },
            }
        );
    }

    try {
        const body = await request.json();
        const parsed = trackOrderSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }
        const normalizedOrderId = parsed.data.orderId.trim().toUpperCase();

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
            .select('id, order_id, created_at, total_amount, status, shipping_name, shipping_phone, shipping_address, shipping_city, shipping_state, shipping_pincode, user_id')
            .ilike('order_id', normalizedOrderId)
            .single() as { data: any; error: any };

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
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
        const normalizedOrderPhone = normalizePhone(order.shipping_phone || '');
        const normalizedInputPhone = normalizePhone(parsed.data.phone || '');
        const isPhoneVerified = normalizedInputPhone.length >= 10 && normalizedInputPhone === normalizedOrderPhone;

        if (!isOwner && !isAdmin && !isPhoneVerified) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const { data: orderItems, error: orderItemsError } = await serviceClient
            .from('order_items')
            .select('product_id, product_title_en, variant_label, quantity, unit_price')
            .eq('order_id', order.id) as { data: any[] | null; error: any };

        if (orderItemsError) {
            console.error('Track order items fetch error:', orderItemsError);
            return NextResponse.json({ error: 'Failed to load order details' }, { status: 500 });
        }

        const productIds = Array.from(
            new Set(
                (orderItems || [])
                    .map((item) => item.product_id)
                    .filter((id): id is string => typeof id === 'string' && id.length > 0)
            )
        );

        let productImageById = new Map<string, string | null>();
        if (productIds.length > 0) {
            const { data: productsRaw } = await serviceClient
                .from('products')
                .select('id, image_url')
                .in('id', productIds);
            const products = (productsRaw || []) as Array<{ id: string; image_url: string | null }>;

            productImageById = new Map(products.map((product) => [product.id, product.image_url]));
        }

        const items = (orderItems || []).map((item) => ({
            ...item,
            product: {
                image_url: productImageById.get(item.product_id) || null,
            },
        }));

        return NextResponse.json(
            {
                order: {
                    ...order,
                    total_amount: Number(order.total_amount),
                },
                items,
            },
            {
                headers: {
                    'X-RateLimit-Remaining': remaining.toString(),
                    'X-RateLimit-Reset': resetTime.toISOString(),
                },
            }
        );
    } catch (error) {
        console.error('Track order API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
