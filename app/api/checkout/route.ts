import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { Database } from '@/lib/supabase/database.types';
import { emailService } from '@/lib/email-service/EmailService';
import { OrderConfirmationTemplate } from '@/lib/email-service/templates/OrderConfirmationTemplate';

// Rate Limiting (Simple In-Memory)
const rateLimit = new Map<string, number>();
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minute
const MAX_REQUESTS = 5; // 5 requests per minute per IP

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const windowStart = now - RATE_LIMIT_WINDOW;

    // Clean up old entries
    for (const [key, timestamp] of rateLimit.entries()) {
        if (timestamp < windowStart) {
            rateLimit.delete(key);
        }
    }

    const requestCount = Array.from(rateLimit.entries()).filter(
        ([key, timestamp]) => key.startsWith(ip) && timestamp > windowStart
    ).length;

    if (requestCount >= MAX_REQUESTS) {
        return true;
    }

    rateLimit.set(`${ip}-${now}`, now);
    return false;
}

// Input Validation Schema
const checkoutSchema = z.object({
    fullName: z.string().min(2).max(100),
    phone: z.string().min(10).max(15).regex(/^\+?[\d\s-]+$/, "Invalid phone format"),
    addressLine1: z.string().min(5).max(200),
    addressLine2: z.string().max(200).optional(),
    city: z.string().min(2).max(100),
    state: z.string().min(2).max(100),
    pincode: z.string().min(4).max(10).regex(/^[\d\s-]+$/, "Invalid pincode"),
    cartItems: z.array(z.object({
        product_id: z.string().uuid(),
        variant_id: z.string().uuid().optional().nullable(),
        quantity: z.number().int().positive().max(100),
    })).min(1).optional(),
});

// Server-side Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminDb = createClient<Database>(supabaseUrl, serviceRoleKey);

export async function POST(req: NextRequest) {
    // 1. Rate Limiting
    const ip = req.headers.get('x-forwarded-for') || 'unknown';
    if (isRateLimited(ip)) {
        return NextResponse.json(
            { error: 'Too many requests. Please try again later.' },
            { status: 429 }
        );
    }

    try {
        // 2. Authentication (Optional)
        const authHeader = req.headers.get('Authorization');
        let user: any = null;

        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.replace('Bearer ', '');
            const { data: { user: authUser } } = await adminDb.auth.getUser(token);
            user = authUser;
        }

        // 3. Input Validation
        const body = await req.json();
        const validation = checkoutSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: 'Invalid input', details: validation.error.format() },
                { status: 400 }
            );
        }

        const { fullName, phone, addressLine1, addressLine2, city, state, pincode, cartItems: validatedCartItems } = validation.data;
        const guestCartItems = validatedCartItems; // Safe verified source

        // 4. Fetch Cart Items (Trusted Source)
        let cartToProcess: any[] = [];

        if (user) {
            const { data: dbItems, error: cartError } = await adminDb
                .from('cart_items')
                .select(`
                    *, 
                    product:products(*),
                    variant:product_variants(*)
                `)
                .eq('user_id', user.id);

            if (cartError || !dbItems || dbItems.length === 0) {
                return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
            }
            cartToProcess = (dbItems as any[]).map(item => ({
                ...item,
                price: item.variant?.price ?? item.product?.current_price,
                shipping: item.variant?.shipping_charge ?? item.product?.shipping_charges,
                label: item.variant?.label
            }));
        } else {
            // Guest Flow: Fetch products and variants from DB
            if (!guestCartItems || !Array.isArray(guestCartItems) || guestCartItems.length === 0) {
                return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
            }

            const productIds = Array.from(new Set(guestCartItems.map((item: any) => item.product_id)));
            const variantIds = Array.from(new Set(guestCartItems.map((item: any) => item.variant_id).filter(Boolean))) as string[];

            const [{ data: products }, { data: variants }] = await Promise.all([
                adminDb.from('products').select('*').in('id', productIds),
                variantIds.length > 0 ? adminDb.from('product_variants').select('*').in('id', variantIds) : { data: [] }
            ]);

            if (!products || products.length === 0) {
                return NextResponse.json({ error: 'Products not found' }, { status: 400 });
            }

            cartToProcess = guestCartItems.map((item: any) => {
                const product = (products as any[]).find(p => p.id === item.product_id);
                const variant = (variants as any[]).find(v => v.id === item.variant_id);

                return {
                    product_id: item.product_id,
                    variant_id: item.variant_id,
                    quantity: item.quantity,
                    product: product,
                    variant: variant,
                    price: variant?.price ?? product?.current_price,
                    shipping: variant?.shipping_charge ?? product?.shipping_charges,
                    label: variant?.label
                };
            }).filter(item => item.product);
        }

        // 6. Secure Price Calculation (Trusted Source)
        let subtotal = 0;
        let maxShipping = 0;

        for (const item of cartToProcess) {
            subtotal += (item.price || 0) * item.quantity;
            if ((item.shipping || 0) > maxShipping) {
                maxShipping = item.shipping || 0;
            }
        }

        const shippingFee = subtotal >= 2000 ? 0 : maxShipping;
        const totalAmount = subtotal + shippingFee;

        // 7. Secure Order Creation via RPC (Atomic & Stock-Aware)
        const rpcItems = cartToProcess.map(item => ({
            product_id: item.product_id,
            variant_id: item.variant_id || null,
            quantity: item.quantity
        }));

        const { data: rpcResult, error: rpcError } = await (adminDb.rpc as any)('place_secure_order', {
            p_full_name: fullName,
            p_phone: phone,
            p_address: [addressLine1, addressLine2].filter(Boolean).join(', '),
            p_city: city,
            p_state: state,
            p_pincode: pincode,
            p_items: rpcItems,
            p_subtotal: subtotal,
            p_shipping_total: shippingFee,
            p_total_amount: totalAmount,
            p_user_id: user ? user.id : null,
            p_email: user?.email || body.email
        });

        if (rpcError) {
            console.error('Order creation failed via RPC:', rpcError);
            let errorMessage = 'Failed to create order. Please try again.';
            if (rpcError.message.includes('Insufficient stock')) {
                errorMessage = rpcError.message;
            }
            return NextResponse.json({ error: errorMessage }, { status: 400 });
        }

        const typedResult = rpcResult as { success: boolean, order_id: string, id: string };

        // Email will be sent AFTER payment proof submission, not here

        return NextResponse.json({
            success: true,
            orderId: typedResult.order_id
        });

    } catch (error: any) {
        console.error('Checkout API error:', error);
        return NextResponse.json(
            { error: 'Internal server error', message: error.message },
            { status: 500 }
        );
    }
}
