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
import { z } from 'zod';
import { checkRateLimit } from '@/lib/middleware/rateLimit';
import { verifyGuestOrderToken } from '@/lib/security/guest-order-token';
import { ORDER_ID_PATTERN, normalizeOrderId } from '@/lib/security/order-id';

const sendOrderEmailSchema = z.object({
    orderId: z.string().trim().min(1).max(64),
    accessToken: z.string().trim().max(4096).optional(),
});

const emailSchema = z.string().email();

const parseAdminNotificationEmail = (value: unknown): string | null => {
    if (typeof value !== 'string') return null;

    const trimmed = value.trim();
    if (!trimmed) return null;

    // Handle accidentally double-stringified values.
    try {
        const parsedValue = JSON.parse(trimmed);
        if (typeof parsedValue === 'string' && parsedValue.trim()) {
            return parsedValue.trim();
        }
    } catch {
        // Value is already a plain string.
    }

    const normalized = trimmed.replace(/^"+|"+$/g, '').trim();
    return normalized || null;
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
        const parsed = sendOrderEmailSchema.safeParse(body);
        if (!parsed.success) {
            return NextResponse.json(
                { error: 'Order ID is required' },
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

        const accessToken = parsed.data.accessToken;

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
            .eq('order_id', normalizedOrderId)
            .single() as { data: any, error: any };

        if (orderError || !orderData) {
            console.error('Order fetch error:', orderError);
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

        const isOwner = !!user && orderData.user_id === user.id;
        const isTokenVerified = !!accessToken && verifyGuestOrderToken(accessToken, normalizedOrderId);
        if (!isAdmin && !isOwner && !isTokenVerified) {
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

        // Get user email - Try order record first, then profile
        let recipientEmail = orderData.email;

        if (!recipientEmail && orderData.user_id) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('email')
                .eq('id', orderData.user_id)
                .single() as any;

            if (profile?.email) {
                recipientEmail = profile.email;
            }
        }

        if (!recipientEmail) {
            console.error('No email found for order:', normalizedOrderId);
            return NextResponse.json(
                { error: 'No email found linked to this order' },
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

        const emailItems = (orderData.order_items || []).map((item: any) => ({
            product_title_en: item.product_title_en,
            variant_label: item.variant_label,
            quantity: item.quantity,
            unit_price: item.unit_price
        }));

        const customerEmailHtml = OrderConfirmationTemplate(emailOrderData, emailItems);

        // Send email to customer
        const customerEmailResult = await emailService.sendEmail(
            recipientEmail, // Use the resolved email
            `Order Confirmation #${orderData.order_id}`,
            customerEmailHtml
        );

        if (!customerEmailResult.success) {
            console.error('Failed to send customer confirmation email:', customerEmailResult.error);
        }

        // Also send notification to admin
        let adminEmail = process.env.EMAIL_USER || 'ecanconnect@gmail.com';
        const { data: adminEmailSetting, error: adminEmailSettingError } = await (supabase
            .from('app_settings' as any) as any)
            .select('value')
            .eq('key', 'order_notification_email')
            .maybeSingle();

        if (adminEmailSettingError) {
            console.error('Failed to fetch order notification email setting:', adminEmailSettingError);
        } else {
            const configuredAdminEmail = parseAdminNotificationEmail(adminEmailSetting?.value);
            if (configuredAdminEmail && emailSchema.safeParse(configuredAdminEmail).success) {
                adminEmail = configuredAdminEmail;
            }
        }

        const customerEmailErrorMessage = !customerEmailResult.success
            ? (customerEmailResult.error instanceof Error
                ? customerEmailResult.error.message
                : String(customerEmailResult.error))
            : '';
        const smtpAuthFailure = /smtp authentication|invalid login|badcredentials|eauth|credentials/i
            .test(customerEmailErrorMessage);

        let adminNotificationSent = false;
        if (!smtpAuthFailure) {
            try {
                const adminEmailHtml = OrderConfirmationTemplate(emailOrderData, emailItems);
                const adminEmailResult = await emailService.sendEmail(
                    adminEmail,
                    `New Order Payment Submitted - #${orderData.order_id}`,
                    adminEmailHtml
                );
                adminNotificationSent = adminEmailResult.success;
                if (!adminEmailResult.success) {
                    console.error('Failed to send admin notification:', adminEmailResult.error);
                }
            } catch (adminEmailError) {
                // Don't fail if admin email fails
                console.error('Failed to send admin notification:', adminEmailError);
            }
        } else {
            console.error('Skipping admin notification due to SMTP authentication failure.');
        }

        return NextResponse.json(
            {
                success: true,
                emailSent: customerEmailResult.success,
                adminNotificationSent,
            },
            {
                headers: {
                    'X-RateLimit-Remaining': remaining.toString(),
                    'X-RateLimit-Reset': resetTime.toISOString(),
                    'Cache-Control': 'no-store',
                },
            }
        );

    } catch (error: any) {
        console.error('Send email API error:', error);
        return NextResponse.json(
            { error: 'Failed to send email' },
            { status: 500, headers: { 'Cache-Control': 'no-store' } }
        );
    }
}
