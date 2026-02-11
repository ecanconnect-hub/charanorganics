/**
 * Authorization Helpers
 * 
 * Provides ownership verification and access control
 * for sensitive resources using public tokens.
 */

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role for authorization checks
);

/**
 * Check if user can access an order
 */
export async function canAccessOrder(
    userId: string,
    orderPublicToken: string
): Promise<boolean> {
    const { data: order } = await supabase
        .from('orders')
        .select('user_id, id')
        .eq('public_token', orderPublicToken)
        .single();

    if (!order) {
        await logSecurityEvent({
            userId,
            actionType: 'order_view',
            resourceType: 'order',
            resourceId: null,
            publicToken: orderPublicToken,
            success: false,
            failureReason: 'Order not found',
        });
        return false;
    }

    const hasAccess = order.user_id === userId;

    // Log access attempt
    await logSecurityEvent({
        userId,
        actionType: 'order_view',
        resourceType: 'order',
        resourceId: order.id,
        publicToken: orderPublicToken,
        success: hasAccess,
        failureReason: hasAccess ? null : 'Ownership mismatch',
    });

    return hasAccess;
}

/**
 * Check if user can access an address
 */
export async function canAccessAddress(
    userId: string,
    addressPublicToken: string
): Promise<boolean> {
    const { data: address } = await supabase
        .from('addresses')
        .select('user_id, id')
        .eq('public_token', addressPublicToken)
        .single();

    if (!address) {
        await logSecurityEvent({
            userId,
            actionType: 'address_view',
            resourceType: 'address',
            resourceId: null,
            publicToken: addressPublicToken,
            success: false,
            failureReason: 'Address not found',
        });
        return false;
    }

    const hasAccess = address.user_id === userId;

    await logSecurityEvent({
        userId,
        actionType: 'address_view',
        resourceType: 'address',
        resourceId: address.id,
        publicToken: addressPublicToken,
        success: hasAccess,
        failureReason: hasAccess ? null : 'Ownership mismatch',
    });

    return hasAccess;
}

/**
 * Check if user can access a payment
 */
export async function canAccessPayment(
    userId: string,
    paymentPublicToken: string
): Promise<boolean> {
    const { data: payment } = await supabase
        .from('payments')
        .select(`
            id,
            order:orders!inner(user_id)
        `)
        .eq('public_token', paymentPublicToken)
        .single();

    if (!payment || !payment.order) {
        await logSecurityEvent({
            userId,
            actionType: 'payment_view',
            resourceType: 'payment',
            resourceId: null,
            publicToken: paymentPublicToken,
            success: false,
            failureReason: 'Payment not found',
        });
        return false;
    }

    const hasAccess = (payment.order as any).user_id === userId;

    await logSecurityEvent({
        userId,
        actionType: 'payment_view',
        resourceType: 'payment',
        resourceId: payment.id,
        publicToken: paymentPublicToken,
        success: hasAccess,
        failureReason: hasAccess ? null : 'Ownership mismatch',
    });

    return hasAccess;
}

/**
 * Get order by public token with ownership verification
 */
export async function getOrderByToken(
    userId: string,
    orderPublicToken: string
) {
    const canAccess = await canAccessOrder(userId, orderPublicToken);

    if (!canAccess) {
        return null;
    }

    const { data: order } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (
                *,
                product:products (
                    title_en,
                    title_te,
                    image_url
                )
            ),
            payment:payments (
                status,
                utr_number,
                payment_screenshot_url,
                created_at,
                verified_at
            )
        `)
        .eq('public_token', orderPublicToken)
        .eq('user_id', userId)
        .single();

    return order;
}

/**
 * Get address by public token with ownership verification
 */
export async function getAddressByToken(
    userId: string,
    addressPublicToken: string
) {
    const canAccess = await canAccessAddress(userId, addressPublicToken);

    if (!canAccess) {
        return null;
    }

    const { data: address } = await supabase
        .from('addresses')
        .select('*')
        .eq('public_token', addressPublicToken)
        .eq('user_id', userId)
        .single();

    return address;
}

/**
 * Log security event to audit log
 */
async function logSecurityEvent(event: {
    userId: string;
    actionType: string;
    resourceType: string;
    resourceId: string | null;
    publicToken: string;
    success: boolean;
    failureReason: string | null;
}) {
    try {
        await supabase.from('security_audit_log').insert({
            user_id: event.userId,
            action_type: event.actionType,
            resource_type: event.resourceType,
            resource_id: event.resourceId,
            public_token: event.publicToken,
            success: event.success,
            failure_reason: event.failureReason,
        });
    } catch (error) {
        console.error('Failed to log security event:', error);
        // Don't throw - logging failure shouldn't break the app
    }
}

/**
 * Log admin action to audit log
 */
export async function logAdminAction(
    adminUserId: string,
    actionType: string,
    resourceType: string,
    resourceId: string,
    metadata?: any
) {
    try {
        await supabase.from('security_audit_log').insert({
            user_id: adminUserId,
            action_type: actionType,
            resource_type: resourceType,
            resource_id: resourceId,
            success: true,
            metadata: metadata || {},
        });
    } catch (error) {
        console.error('Failed to log admin action:', error);
    }
}

/**
 * Log unauthorized access attempt
 */
export async function logUnauthorizedAccess(
    userId: string | null,
    resourceType: string,
    publicToken: string,
    ipAddress?: string,
    userAgent?: string
) {
    try {
        await supabase.from('security_audit_log').insert({
            user_id: userId,
            action_type: 'unauthorized_access_attempt',
            resource_type: resourceType,
            public_token: publicToken,
            ip_address: ipAddress,
            user_agent: userAgent,
            success: false,
            failure_reason: 'Unauthorized access attempt',
        });
    } catch (error) {
        console.error('Failed to log unauthorized access:', error);
    }
}
