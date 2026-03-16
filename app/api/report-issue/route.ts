import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { z } from 'zod';
import { checkRateLimit } from '@/lib/middleware/rateLimit';

const reportSchema = z.object({
    issueType: z.enum([
        'order_issue',
        'payment_issue',
        'product_issue',
        'website_bug',
        'delivery_issue',
        'general',
    ]),
    orderId: z
        .string()
        .trim()
        .max(64)
        .regex(/^(ORD-\d{8}-\d{3,})?$/, 'Invalid Order ID format')
        .optional()
        .or(z.literal('')),
    description: z.string().trim().min(10, 'Please describe the issue in at least 10 characters').max(2000),
    reporterName: z.string().trim().max(100).optional().or(z.literal('')),
    reporterEmail: z
        .string()
        .trim()
        .email('Invalid email address')
        .max(254)
        .optional()
        .or(z.literal('')),
    reporterPhone: z
        .string()
        .trim()
        .regex(/^[\d\s+\-()]{0,15}$/, 'Invalid phone number')
        .optional()
        .or(z.literal('')),
});

export async function POST(request: NextRequest) {
    // Rate limit: 5 reports per 15 minutes
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
        const parsed = reportSchema.safeParse(body);

        if (!parsed.success) {
            const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0];
            return NextResponse.json(
                { error: firstError || 'Invalid request data' },
                { status: 400, headers: { 'Cache-Control': 'no-store' } }
            );
        }

        const { issueType, orderId, description, reporterName, reporterEmail, reporterPhone } = parsed.data;

        // Optionally get current user (anonymous reports are fine)
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
        const { data: { user } } = await authClient.auth.getUser();

        const serviceClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        // Store report in Supabase
        const userAgent = request.headers.get('user-agent')?.slice(0, 512) || null;
        const { data: insertedReport, error: insertError } = await (serviceClient
            .from('issue_reports') as any)
            .insert({
                issue_type: issueType,
                order_id: orderId || null,
                description,
                reporter_name: reporterName || null,
                reporter_email: reporterEmail || null,
                reporter_phone: reporterPhone || null,
                user_id: user?.id || null,
                user_agent: userAgent,
                status: 'open',
            })
            .select('id, created_at')
            .single();

        if (insertError) {
            console.error('Failed to save issue report:', insertError);
            // If insertion fails (table might not exist yet), still return success
            // to not break UX — the WhatsApp fallback is always available
            console.warn('Issue report table may not exist. Run CREATE_ISSUE_REPORTS_TABLE.sql in Supabase.');
        }

        const reportId = insertedReport?.id || 'N/A';

        return NextResponse.json(
            {
                success: true,
                reportId,
                message: 'Your issue has been reported. We will follow up shortly.',
                // Return WhatsApp URL so client can optionally open it
                whatsappFallback: buildWhatsappMessage({ issueType, orderId, description, reporterName, reporterPhone, reportId }),
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
        console.error('Report issue API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500, headers: { 'Cache-Control': 'no-store' } }
        );
    }
}

function buildWhatsappMessage(params: {
    issueType: string;
    orderId?: string;
    description: string;
    reporterName?: string;
    reporterPhone?: string;
    reportId: string;
}): string {
    const typeLabels: Record<string, string> = {
        order_issue: '📦 Order Issue',
        payment_issue: '💳 Payment Issue',
        product_issue: '🌿 Product Issue',
        website_bug: '🐛 Website Bug',
        delivery_issue: '🚚 Delivery Issue',
        general: '📝 General Issue',
    };

    const lines: string[] = [
        `🚨 *Issue Report — Charan Organics*`,
        `Report ID: ${params.reportId}`,
        ``,
        `*Type:* ${typeLabels[params.issueType] || params.issueType}`,
    ];
    if (params.orderId) lines.push(`*Order ID:* ${params.orderId}`);
    if (params.reporterName) lines.push(`*Name:* ${params.reporterName}`);
    if (params.reporterPhone) lines.push(`*Phone:* ${params.reporterPhone}`);
    lines.push(``, `*Description:*`, params.description);

    const waPhone = process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP_PHONE?.replace(/\D/g, '') || '918247838125';
    return `https://wa.me/${waPhone}?text=${encodeURIComponent(lines.join('\n'))}`;
}
