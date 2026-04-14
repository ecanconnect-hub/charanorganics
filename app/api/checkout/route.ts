import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { Database } from '@/lib/supabase/database.types';
import { checkRateLimit } from '@/lib/middleware/rateLimit';
import { createGuestOrderToken, createGuestTrackingToken } from '@/lib/security/guest-order-token';
import { enforceSecureJsonPostRequest } from '@/lib/security/request-guards';
import { calculateWeightBasedShipping } from '@/lib/utils/shipping';

type OrderRow = Database['public']['Tables']['orders']['Row'];
type OrderItemRow = Database['public']['Tables']['order_items']['Row'];

// Input Validation Schema
const checkoutSchema = z.object({
    fullName: z.string().trim().min(2).max(20, "Full name must be 20 characters or fewer"),
    phone: z.string().trim().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
    email: z
        .string()
        .trim()
        .max(254)
        .email("Email is wrong.")
        .refine((value) => !/[\r\n]/.test(value), "Email is wrong.")
        .optional(),
    addressLine1: z.string().trim().min(5).max(400, "Address must be 400 characters or fewer"),
    addressLine2: z.string().trim().max(400, "Address must be 400 characters or fewer").optional(),
    city: z.string().trim().min(2).max(100),
    state: z.string().trim().min(2).max(100),
    pincode: z.string().min(4).max(10).regex(/^[\d\s-]+$/, "Invalid pincode"),
    cartItems: z.array(z.object({
        product_id: z.string().uuid(),
        variant_id: z.string().uuid().optional().nullable(),
        quantity: z.number().int().positive().max(100),
    })).min(1).max(50).optional(),
});

// Server-side Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const adminDb = createClient<Database>(supabaseUrl, serviceRoleKey);

type CheckoutRpcItem = {
    product_id: string;
    variant_id: string | null;
    quantity: number;
};

type DuplicateOrderCandidate = Pick<OrderRow, 'id' | 'order_id' | 'user_id' | 'created_at' | 'status'>;
type DuplicateOrderItemCandidate = Pick<OrderItemRow, 'order_id' | 'product_id' | 'variant_id' | 'quantity'>;
type DuplicateOrderMatch = Pick<OrderRow, 'id' | 'order_id'>;

const DUPLICATE_ORDER_WINDOW_MS = 2 * 60 * 1000;

const buildItemsSignature = (items: CheckoutRpcItem[]): string =>
    items
        .map((item) => `${item.product_id}:${item.variant_id || 'no_variant'}:${item.quantity}`)
        .sort()
        .join('|');

const findRecentDuplicateOrder = async ({
    userId,
    fullAddress,
    phone,
    pincode,
    totalAmount,
    items,
}: {
    userId: string | null;
    fullAddress: string;
    phone: string;
    pincode: string;
    totalAmount: number;
    items: CheckoutRpcItem[];
}) => {
    const sinceIso = new Date(Date.now() - DUPLICATE_ORDER_WINDOW_MS).toISOString();
    const incomingSignature = buildItemsSignature(items);

    const baseOrderQuery = adminDb
        .from('orders')
        .select('id, order_id, user_id, created_at, status')
        .gte('created_at', sinceIso)
        .eq('shipping_phone', phone)
        .eq('shipping_address', fullAddress)
        .eq('shipping_pincode', pincode)
        .eq('total_amount', totalAmount)
        .in('status', ['pending_payment', 'payment_verification'])
        .order('created_at', { ascending: false })
        .limit(10);

    const orderQuery = userId ? baseOrderQuery.eq('user_id', userId) : baseOrderQuery.is('user_id', null);
    const { data: candidateOrdersRaw, error: candidateOrdersError } = await orderQuery;
    const candidateOrders = (candidateOrdersRaw ?? []) as DuplicateOrderCandidate[];

    if (candidateOrdersError || candidateOrders.length === 0) {
        return null;
    }

    const candidateOrderIds = candidateOrders.map((order) => order.id);
    const { data: candidateItemsRaw, error: candidateItemsError } = await adminDb
        .from('order_items')
        .select('order_id, product_id, variant_id, quantity')
        .in('order_id', candidateOrderIds);
    const candidateItems = (candidateItemsRaw ?? []) as DuplicateOrderItemCandidate[];

    if (candidateItemsError || candidateItems.length === 0) {
        return null;
    }

    const itemsByOrderId: Record<string, CheckoutRpcItem[]> = {};
    for (const row of candidateItems) {
        if (!itemsByOrderId[row.order_id]) {
            itemsByOrderId[row.order_id] = [];
        }
        itemsByOrderId[row.order_id].push({
            product_id: row.product_id,
            variant_id: row.variant_id ?? null,
            quantity: row.quantity,
        });
    }

    for (const candidate of candidateOrders) {
        const candidateSignature = buildItemsSignature(itemsByOrderId[candidate.id] || []);
        if (candidateSignature === incomingSignature) {
            return candidate as DuplicateOrderMatch;
        }
    }

    return null;
};

export async function POST(req: NextRequest) {
    const requestGuardResponse = enforceSecureJsonPostRequest(req);
    if (requestGuardResponse) {
        return requestGuardResponse;
    }

    // 1. Rate Limiting
    const { allowed, remaining, resetTime } = await checkRateLimit(req);
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
                { status: 400, headers: { 'Cache-Control': 'no-store' } }
            );
        }

        const { fullName, phone, email, addressLine1, addressLine2, city, state, pincode, cartItems: validatedCartItems } = validation.data;
        const guestCartItems = validatedCartItems; // Safe verified source

        // Email is required for guest checkout to send confirmation/updates.
        const normalizedBodyEmail = typeof email === 'string' ? email.trim().toLowerCase() : null;
        const normalizedUserEmail = typeof user?.email === 'string' ? user.email.trim().toLowerCase() : null;
        const resolvedEmail = normalizedUserEmail || normalizedBodyEmail;

        if (!user && !resolvedEmail) {
            return NextResponse.json(
                { error: 'Email is required for guest checkout' },
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
                return NextResponse.json(
                    { error: 'Cart is empty' },
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
            cartToProcess = (dbItems as any[]).map(item => ({
                ...item,
                price: item.variant?.price ?? item.product?.current_price,
                shipping: item.variant?.shipping_charge ?? item.product?.shipping_charges,
                label: item.variant?.label
            }));
        } else {
            // Guest Flow: Fetch products and variants from DB
            if (!guestCartItems || !Array.isArray(guestCartItems) || guestCartItems.length === 0) {
                return NextResponse.json(
                    { error: 'Cart is empty' },
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

            const productIds = Array.from(new Set(guestCartItems.map((item: any) => item.product_id)));
            const variantIds = Array.from(new Set(guestCartItems.map((item: any) => item.variant_id).filter(Boolean))) as string[];

            const [{ data: products }, { data: variants }] = await Promise.all([
                adminDb.from('products').select('*').in('id', productIds),
                variantIds.length > 0 ? adminDb.from('product_variants').select('*').in('id', variantIds) : { data: [] }
            ]);

            if (!products || products.length === 0) {
                return NextResponse.json(
                    { error: 'Products not found' },
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

        for (const item of cartToProcess) {
            subtotal += (item.price || 0) * item.quantity;
        }

        const shippingFee = calculateWeightBasedShipping(cartToProcess).shippingCharge;
        const totalAmount = subtotal + shippingFee;
        const shippingAddress = [addressLine1, addressLine2].filter(Boolean).join(', ');

        // 7. Secure Order Creation via RPC (Atomic & Stock-Aware)
        const rpcItems = cartToProcess.map(item => ({
            product_id: item.product_id,
            variant_id: item.variant_id || null,
            quantity: item.quantity
        })) as CheckoutRpcItem[];

        const duplicateOrder = await findRecentDuplicateOrder({
            userId: user?.id ?? null,
            fullAddress: shippingAddress,
            phone,
            pincode,
            totalAmount,
            items: rpcItems,
        });

        if (duplicateOrder) {
            if (resolvedEmail) {
                const { error: emailUpdateError } = await (adminDb
                    .from('orders') as any)
                    .update({ email: resolvedEmail })
                    .eq('id', duplicateOrder.id);
                if (emailUpdateError) {
                    console.error('Failed to persist order email for duplicate order:', emailUpdateError);
                }
            }

            const responsePayload: {
                success: boolean;
                orderId: string;
                reusedExistingOrder: boolean;
                guestAccessToken?: string;
                guestTrackingToken?: string;
            } = {
                success: true,
                orderId: duplicateOrder.order_id,
                reusedExistingOrder: true,
            };

            if (!user) {
                responsePayload.guestAccessToken = createGuestOrderToken(duplicateOrder.order_id);
                responsePayload.guestTrackingToken = createGuestTrackingToken(duplicateOrder.order_id);
            }

            return NextResponse.json(
                responsePayload,
                {
                    headers: {
                        'X-RateLimit-Remaining': remaining.toString(),
                        'X-RateLimit-Reset': resetTime.toISOString(),
                        'Cache-Control': 'no-store',
                    },
                }
            );
        }

        const { data: rpcResult, error: rpcError } = await (adminDb.rpc as any)('place_secure_order', {
            p_full_name: fullName,
            p_phone: phone,
            p_address: shippingAddress,
            p_city: city,
            p_state: state,
            p_pincode: pincode,
            p_items: rpcItems,
            p_subtotal: subtotal,
            p_shipping_total: shippingFee,
            p_total_amount: totalAmount,
            p_user_id: user ? user.id : null
        });

        if (rpcError) {
            console.error('Order creation failed via RPC:', rpcError);
            let errorMessage = 'Failed to create order. Please try again.';
            if (rpcError.message.includes('Insufficient stock')) {
                errorMessage = rpcError.message;
            }
            return NextResponse.json(
                { error: errorMessage },
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

        const typedResult = rpcResult as { success: boolean, order_id: string, id: string };

        if (resolvedEmail) {
            const { error: emailUpdateError } = await (adminDb
                .from('orders') as any)
                .update({ email: resolvedEmail })
                .eq('id', typedResult.id);
            if (emailUpdateError) {
                console.error('Failed to persist order email:', emailUpdateError);
            }
        }

        // Email will be sent AFTER payment proof submission, not here

        const responsePayload: {
            success: boolean;
            orderId: string;
            guestAccessToken?: string;
            guestTrackingToken?: string;
        } = {
            success: true,
            orderId: typedResult.order_id,
        };

        if (!user) {
            responsePayload.guestAccessToken = createGuestOrderToken(typedResult.order_id);
            responsePayload.guestTrackingToken = createGuestTrackingToken(typedResult.order_id);
        }

        return NextResponse.json(
            responsePayload,
            {
                headers: {
                    'X-RateLimit-Remaining': remaining.toString(),
                    'X-RateLimit-Reset': resetTime.toISOString(),
                    'Cache-Control': 'no-store',
                },
            }
        );

    } catch (error: any) {
        console.error('Checkout API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: { 'Cache-Control': 'no-store' } }
        );
    }
}
