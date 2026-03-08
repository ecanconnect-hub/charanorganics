-- Allow payment_update in security_audit_log action_type check constraint
-- Run this in Supabase SQL editor

ALTER TABLE public.security_audit_log
    DROP CONSTRAINT IF EXISTS security_audit_log_action_type_check;

ALTER TABLE public.security_audit_log
    ADD CONSTRAINT security_audit_log_action_type_check
    CHECK (action_type IN (
        'order_view',
        'order_create',
        'order_update',
        'payment_submit',
        'payment_verify',
        'payment_reject',
        'payment_update',
        'address_create',
        'address_update',
        'address_delete',
        'admin_access',
        'admin_action',
        'unauthorized_access_attempt',
        'suspicious_activity',
        'rate_limit_exceeded',
        'session_created',
        'session_invalidated',
        'password_change',
        'profile_update'
    ));
