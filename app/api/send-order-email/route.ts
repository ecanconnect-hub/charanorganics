/**
 * Send Order Confirmation Email API
 * Sends email after payment proof submission
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/supabase/database.types';
import { emailService } from '@/lib/email-service/EmailService';
import { OrderConfirmationTemplate } from '@/lib/email-service/templates/OrderConfirmationTemplate';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { orderId, phone } = body;

        if (!orderId || typeof orderId !== 'string') {
            return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
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
                        // No cookie mutation needed in this route.
                    },
                },
            }
        );

        const {
            data: { user },
        } = await authClient.auth.getUser();

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
        const supabase = createClient<Database>(supabaseUrl, serviceRoleKey);

        let isAdmin = false;
        if (user) {
            const { data: requesterProfile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single() as { data: { role: string } | null };

            isAdmin = requesterProfile?.role === 'admin';
        }

        // Fetch order details with payment information
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select(`
                *,
                order_items (
                    product_title_en,
                    variant_label,
                    quantity,
                    unit_price
                ),
                payments (
                    utr_number,
                    payment_screenshot_url
                )
            `)
            .eq('order_id', orderId)
            .single() as { data: any, error: any };

        if (orderError || !orderData) {
            console.error('Order fetch error:', orderError);
            return NextResponse.json({ error: 'Order not found' }, { status: 404 });
        }

        const isOwner = !!user && orderData.user_id === user.id;
        const hasPhoneMatch = typeof phone === 'string' && phone.trim() !== '' && orderData.shipping_phone === phone.trim();
        if (!isAdmin && !isOwner && !hasPhoneMatch) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Get user email
        const userEmail = orderData.email;

        if (!userEmail) {
            console.error('No email found for order:', orderId);
            return NextResponse.json({ error: 'No email found' }, { status: 400 });
        }

        // Prepare email data
        const paymentInfo = orderData.payments?.[0] || {};

        const emailOrderData = {
            order_id: orderData.order_id,
            created_at: orderData.created_at,
            subtotal_amount: orderData.subtotal,
            shipping_cost: orderData.shipping_total,
            total_amount: orderData.total_amount,
            shipping_address: {
                full_name: orderData.shipping_name,
                phone: orderData.shipping_phone,
                address_line1: orderData.shipping_address,
                city: orderData.shipping_city,
                state: orderData.shipping_state,
                pincode: orderData.shipping_pincode
            },
            payment_proof: {
                utr_number: paymentInfo.utr_number || null,
                has_screenshot: !!paymentInfo.payment_screenshot_url
            }
        };

        const emailItems = orderData.order_items.map((item: any) => ({
            product_title_en: item.product_title_en,
            variant_label: item.variant_label,
            quantity: item.quantity,
            unit_price: item.unit_price
        }));

        const emailHtml = OrderConfirmationTemplate(emailOrderData, emailItems);

        // Send email to customer
        await emailService.sendEmail(
            userEmail,
            `Order Confirmation #${orderData.order_id}`,
            emailHtml
        );

        // Also send notification to admin
        const adminEmail = process.env.EMAIL_USER || 'ecanconnect@gmail.com';
        try {
            await emailService.sendEmail(
                adminEmail,
                `New Order Payment Submitted - #${orderData.order_id}`,
                emailHtml
            );
        } catch (adminEmailError) {
            // Don't fail if admin email fails
            console.error('Failed to send admin notification:', adminEmailError);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Send email API error:', error);
        return NextResponse.json(
            { error: 'Failed to send email' },
            { status: 500 }
        );
    }
}
