import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from '@/lib/supabase/database.types';

const detailsSchema = z.object({
    orderId: z.string().min(1),
    phone: z.string().trim().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = detailsSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
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
            .select('id, order_id, total_amount, status, user_id, shipping_phone')
            .eq('order_id', parsed.data.orderId)
            .single() as { data: any; error: any };

        if (error || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const isOwner = !!user && order.user_id === user.id;
        const isPhoneVerified = !!parsed.data.phone && parsed.data.phone.trim() === order.shipping_phone;

        if (!isOwner && !isPhoneVerified) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (order.status !== 'pending_payment') {
            return NextResponse.json({ error: 'Order is not awaiting payment' }, { status: 409 });
        }

        return NextResponse.json({
            id: order.id,
            orderId: order.order_id,
            totalAmount: Number(order.total_amount),
            status: order.status,
        });
    } catch (error) {
        console.error('Payment details API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
