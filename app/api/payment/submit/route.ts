import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import type { Database } from '@/lib/supabase/database.types';

const submitSchema = z.object({
    orderId: z.string().min(1),
    phone: z.string().trim().optional(),
    utr: z.string().trim().optional(),
    screenshotUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const parsed = submitSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
        }

        if (!parsed.data.utr && !parsed.data.screenshotUrl) {
            return NextResponse.json({ error: 'UTR or screenshot is required' }, { status: 400 });
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
            .select('id, user_id, shipping_phone, status')
            .eq('order_id', parsed.data.orderId)
            .single() as { data: any; error: any };

        if (orderError || !order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const isOwner = !!user && order.user_id === user.id;
        const isPhoneVerified = !!parsed.data.phone && parsed.data.phone.trim() === order.shipping_phone;
        if (!isOwner && !isPhoneVerified) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        if (order.status !== 'pending_payment') {
            return NextResponse.json({ error: 'Payment already submitted' }, { status: 409 });
        }

        const { error: insertError } = await (serviceClient
            .from('payments') as any)
            .insert({
                order_id: order.id,
                utr_number: parsed.data.utr || null,
                payment_screenshot_url: parsed.data.screenshotUrl || null,
                status: 'pending',
            });

        if (insertError) {
            if (insertError.message?.toLowerCase().includes('unique')) {
                return NextResponse.json({ error: 'Duplicate payment reference detected' }, { status: 409 });
            }
            return NextResponse.json({ error: 'Failed to save payment details' }, { status: 400 });
        }

        const { error: updateError } = await (serviceClient
            .from('orders') as any)
            .update({ status: 'payment_verification' })
            .eq('id', order.id)
            .eq('status', 'pending_payment');

        if (updateError) {
            return NextResponse.json({ error: 'Failed to update order status' }, { status: 400 });
        }

        // Clear cart items for this user now that payment is submitted
        if (order.user_id) {
            await serviceClient
                .from('cart_items')
                .delete()
                .eq('user_id', order.user_id);
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Payment submit API error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
