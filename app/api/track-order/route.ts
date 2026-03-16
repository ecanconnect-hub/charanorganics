import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from '@/lib/supabase/database.types';
import { checkRateLimit } from '@/lib/middleware/rateLimit';
import { verifyGuestOrderToken } from '@/lib/security/guest-order-token';

const trackOrderSchema = z.object({
    orderId: z.string().min(1),
    phone: z.string().trim().optional(),
    pincode: z.string().trim().optional(),
    accessToken: z.string().trim().optional(),
});

const ORDER_ID_PATTERN = /^ORD-\d{8}-\d{3,}$/;

const normalizePhone = (value: string): string => value.replace(/\D/g, '');
const normalizePincode = (value: string): string => value.replace(/\D/g, '');
const maskPhone = (value: string): string => {
    const digits = normalizePhone(value);
    if (digits.length <= 4) return '***';
    return `${'*'.repeat(Math.max(0, digits.length - 4))}${digits.slice(-4)}`;
};
const maskPincode = (value: string): string => {
    const digits = normalizePincode(value);
    if (digits.length <= 2) return '**';
    return `${'*'.repeat(Math.max(0, digits.length - 2))}${digits.slice(-2)}`;
};

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
        const parsed = trackOrderSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Invalid request' },
                { status: 400, headers: { 'Cache-Control': 'no-store' } }
            );
        }
        const normalizedOrderId = parsed.data.orderId.trim().toUpperCase();
        if (!ORDER_ID_PATTERN.test(normalizedOrderId)) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404, headers: { 'Cache-Control': 'no-store' } }
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
            .select('id, order_id, created_at, total_amount, status, shipping_name, shipping_phone, shipping_address, shipping_city, shipping_state, shipping_pincode, user_id')
            .eq('order_id', normalizedOrderId)
            .single() as { data: any; error: any };

        if (orderError || !order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404, headers: { 'Cache-Control': 'no-store' } }
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
        const normalizedOrderPhone = normalizePhone(order.shipping_phone || '');
        const normalizedInputPhone = normalizePhone(parsed.data.phone || '');
        const isPhoneVerified = normalizedInputPhone.length >= 10 && normalizedInputPhone === normalizedOrderPhone;
        const normalizedOrderPincode = normalizePincode(order.shipping_pincode || '');
        const normalizedInputPincode = normalizePincode(parsed.data.pincode || '');
        const isPincodeVerified = normalizedInputPincode.length >= 4 && normalizedInputPincode === normalizedOrderPincode;
        const isTokenVerified =
            typeof parsed.data.accessToken === 'string' &&
            verifyGuestOrderToken(parsed.data.accessToken, normalizedOrderId, ['guest_payment', 'guest_tracking']);
        const isGuestFallbackVerified = isPhoneVerified && isPincodeVerified;

        if (!isOwner && !isAdmin && !isTokenVerified && !isGuestFallbackVerified) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404, headers: { 'Cache-Control': 'no-store' } }
            );
        }

        const { data: orderItems, error: orderItemsError } = await serviceClient
            .from('order_items')
            .select('product_id, product_title_en, variant_label, quantity, unit_price')
            .eq('order_id', order.id) as { data: any[] | null; error: any };

        if (orderItemsError) {
            console.error('Track order items fetch error:', orderItemsError);
            return NextResponse.json(
                { error: 'Failed to load order details' },
                { status: 500, headers: { 'Cache-Control': 'no-store' } }
            );
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

        // Privacy-first: a guest token is enough to track status/items, but not enough to reveal PII.
        // To reveal full delivery details, require either:
        // - Owner/admin session, or
        // - Guest verification via phone + pincode.
        const hasFullShippingAccess = isOwner || isAdmin || isGuestFallbackVerified;
        const safeOrder = {
            ...order,
            total_amount: Number(order.total_amount),
            can_view_shipping: hasFullShippingAccess,
            shipping_name: hasFullShippingAccess ? order.shipping_name : 'Verified Customer',
            shipping_phone: hasFullShippingAccess ? order.shipping_phone : maskPhone(order.shipping_phone || ''),
            shipping_address: hasFullShippingAccess ? order.shipping_address : 'Address hidden for security',
            shipping_city: hasFullShippingAccess ? order.shipping_city : 'Hidden',
            shipping_state: hasFullShippingAccess ? order.shipping_state : 'Hidden',
            shipping_pincode: hasFullShippingAccess ? order.shipping_pincode : maskPincode(order.shipping_pincode || ''),
        };

        return NextResponse.json(
            {
                order: safeOrder,
                items,
            },
            {
                headers: {
                    'X-RateLimit-Remaining': remaining.toString(),
                    'X-RateLimit-Reset': resetTime.toISOString(),
                    'Cache-Control': 'no-store',
                },
            }
        );
    } catch (error) {
        console.error('Track order API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: { 'Cache-Control': 'no-store' } }
        );
    }
}
