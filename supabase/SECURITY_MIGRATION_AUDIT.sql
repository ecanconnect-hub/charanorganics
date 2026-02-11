-- ============================================
-- SECURITY MIGRATION: AUDIT LOGGING
-- ============================================
-- This migration creates comprehensive audit logging
-- for security monitoring and compliance
-- 
-- Run this in Supabase SQL Editor
-- ============================================

-- ============================================
-- 1. CREATE AUDIT LOG TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.security_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL CHECK (action_type IN (
        'order_view',
        'order_create',
        'order_update',
        'payment_submit',
        'payment_verify',
        'payment_reject',
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
    )),
    resource_type TEXT NOT NULL, -- 'order', 'payment', 'address', 'admin_panel', etc.
    resource_id UUID,
    public_token UUID,
    ip_address INET,
    user_agent TEXT,
    request_path TEXT,
    request_method TEXT,
    success BOOLEAN DEFAULT true,
    failure_reason TEXT,
    metadata JSONB, -- Additional context (e.g., old vs new values)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. CREATE INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_audit_user_id ON public.security_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action_type ON public.security_audit_log(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.security_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_success ON public.security_audit_log(success);
CREATE INDEX IF NOT EXISTS idx_audit_resource ON public.security_audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_ip_address ON public.security_audit_log(ip_address);

-- Index for suspicious activity queries
CREATE INDEX IF NOT EXISTS idx_audit_suspicious 
ON public.security_audit_log(user_id, action_type, created_at DESC) 
WHERE success = false;

-- ============================================
-- 3. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.security_audit_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view audit logs
CREATE POLICY "Only admins can view audit logs"
    ON public.security_audit_log FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- System can insert audit logs (no user restriction)
CREATE POLICY "System can insert audit logs"
    ON public.security_audit_log FOR INSERT
    WITH CHECK (true);

-- Prevent updates and deletes (audit logs are immutable)
CREATE POLICY "Audit logs cannot be updated"
    ON public.security_audit_log FOR UPDATE
    USING (false);

CREATE POLICY "Audit logs cannot be deleted"
    ON public.security_audit_log FOR DELETE
    USING (false);

-- ============================================
-- 4. HELPER FUNCTIONS FOR AUDIT LOGGING
-- ============================================

-- Function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
    p_user_id UUID,
    p_action_type TEXT,
    p_resource_type TEXT,
    p_resource_id UUID DEFAULT NULL,
    p_public_token UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_request_path TEXT DEFAULT NULL,
    p_request_method TEXT DEFAULT NULL,
    p_success BOOLEAN DEFAULT true,
    p_failure_reason TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.security_audit_log (
        user_id,
        action_type,
        resource_type,
        resource_id,
        public_token,
        ip_address,
        user_agent,
        request_path,
        request_method,
        success,
        failure_reason,
        metadata
    ) VALUES (
        p_user_id,
        p_action_type,
        p_resource_type,
        p_resource_id,
        p_public_token,
        p_ip_address,
        p_user_agent,
        p_request_path,
        p_request_method,
        p_success,
        p_failure_reason,
        p_metadata
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 5. AUTOMATIC AUDIT TRIGGERS
-- ============================================

-- Trigger function for order changes
CREATE OR REPLACE FUNCTION audit_order_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_security_event(
            NEW.user_id,
            'order_create',
            'order',
            NEW.id,
            NEW.public_token,
            NULL,
            NULL,
            NULL,
            NULL,
            true,
            NULL,
            jsonb_build_object(
                'order_id', NEW.order_id,
                'total_amount', NEW.total_amount,
                'status', NEW.status
            )
        );
    ELSIF TG_OP = 'UPDATE' THEN
        -- Only log if status changed
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            PERFORM log_security_event(
                NEW.user_id,
                'order_update',
                'order',
                NEW.id,
                NEW.public_token,
                NULL,
                NULL,
                NULL,
                NULL,
                true,
                NULL,
                jsonb_build_object(
                    'order_id', NEW.order_id,
                    'old_status', OLD.status,
                    'new_status', NEW.status,
                    'updated_by', auth.uid()
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for payment changes
CREATE OR REPLACE FUNCTION audit_payment_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_security_event(
            (SELECT user_id FROM public.orders WHERE id = NEW.order_id),
            'payment_submit',
            'payment',
            NEW.id,
            NEW.public_token,
            NULL,
            NULL,
            NULL,
            NULL,
            true,
            NULL,
            jsonb_build_object(
                'order_id', NEW.order_id,
                'payment_method', NEW.payment_method
            )
        );
    ELSIF TG_OP = 'UPDATE' THEN
        -- Log payment verification
        IF OLD.status IS DISTINCT FROM NEW.status THEN
            PERFORM log_security_event(
                NEW.verified_by,
                CASE 
                    WHEN NEW.status = 'verified' THEN 'payment_verify'
                    WHEN NEW.status = 'rejected' THEN 'payment_reject'
                    ELSE 'payment_update'
                END,
                'payment',
                NEW.id,
                NEW.public_token,
                NULL,
                NULL,
                NULL,
                NULL,
                true,
                NEW.rejection_reason,
                jsonb_build_object(
                    'order_id', NEW.order_id,
                    'old_status', OLD.status,
                    'new_status', NEW.status,
                    'verified_by', NEW.verified_by
                )
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for address changes
CREATE OR REPLACE FUNCTION audit_address_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        PERFORM log_security_event(
            NEW.user_id,
            'address_create',
            'address',
            NEW.id,
            NEW.public_token,
            NULL,
            NULL,
            NULL,
            NULL,
            true,
            NULL,
            jsonb_build_object(
                'city', NEW.city,
                'state', NEW.state,
                'is_default', NEW.is_default
            )
        );
    ELSIF TG_OP = 'UPDATE' THEN
        PERFORM log_security_event(
            NEW.user_id,
            'address_update',
            'address',
            NEW.id,
            NEW.public_token,
            NULL,
            NULL,
            NULL,
            NULL,
            true,
            NULL,
            jsonb_build_object(
                'changes', jsonb_build_object(
                    'old', row_to_json(OLD),
                    'new', row_to_json(NEW)
                )
            )
        );
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM log_security_event(
            OLD.user_id,
            'address_delete',
            'address',
            OLD.id,
            OLD.public_token,
            NULL,
            NULL,
            NULL,
            NULL,
            true,
            NULL,
            jsonb_build_object(
                'deleted_address', row_to_json(OLD)
            )
        );
    END IF;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 6. CREATE TRIGGERS
-- ============================================

-- Orders audit trigger
DROP TRIGGER IF EXISTS audit_orders_trigger ON public.orders;
CREATE TRIGGER audit_orders_trigger
    AFTER INSERT OR UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION audit_order_changes();

-- Payments audit trigger
DROP TRIGGER IF EXISTS audit_payments_trigger ON public.payments;
CREATE TRIGGER audit_payments_trigger
    AFTER INSERT OR UPDATE ON public.payments
    FOR EACH ROW
    EXECUTE FUNCTION audit_payment_changes();

-- Addresses audit trigger
DROP TRIGGER IF EXISTS audit_addresses_trigger ON public.addresses;
CREATE TRIGGER audit_addresses_trigger
    AFTER INSERT OR UPDATE OR DELETE ON public.addresses
    FOR EACH ROW
    EXECUTE FUNCTION audit_address_changes();

-- ============================================
-- 7. SECURITY ANALYTICS VIEWS
-- ============================================

-- View for suspicious activity
CREATE OR REPLACE VIEW security_suspicious_activity AS
SELECT 
    user_id,
    action_type,
    COUNT(*) as attempt_count,
    MAX(created_at) as last_attempt,
    array_agg(DISTINCT ip_address) as ip_addresses
FROM public.security_audit_log
WHERE success = false
AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id, action_type
HAVING COUNT(*) >= 3
ORDER BY attempt_count DESC;

-- View for admin actions
CREATE OR REPLACE VIEW security_admin_actions AS
SELECT 
    sal.user_id,
    p.email,
    p.full_name,
    sal.action_type,
    sal.resource_type,
    sal.created_at,
    sal.metadata
FROM public.security_audit_log sal
JOIN public.profiles p ON p.id = sal.user_id
WHERE sal.action_type IN ('admin_access', 'admin_action', 'payment_verify', 'payment_reject', 'order_update')
ORDER BY sal.created_at DESC;

-- View for failed access attempts
CREATE OR REPLACE VIEW security_failed_access AS
SELECT 
    user_id,
    ip_address,
    action_type,
    resource_type,
    failure_reason,
    created_at
FROM public.security_audit_log
WHERE success = false
ORDER BY created_at DESC;

-- ============================================
-- 8. CLEANUP FUNCTION (OPTIONAL)
-- ============================================

-- Function to archive old audit logs (run monthly)
CREATE OR REPLACE FUNCTION archive_old_audit_logs(
    p_days_to_keep INTEGER DEFAULT 90
) RETURNS INTEGER AS $$
DECLARE
    v_archived_count INTEGER;
BEGIN
    -- In production, move to archive table instead of deleting
    -- For now, we'll just count what would be archived
    SELECT COUNT(*) INTO v_archived_count
    FROM public.security_audit_log
    WHERE created_at < NOW() - (p_days_to_keep || ' days')::INTERVAL;
    
    RAISE NOTICE 'Would archive % audit log entries older than % days', v_archived_count, p_days_to_keep;
    
    RETURN v_archived_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICATION
-- ============================================

-- Test audit logging
DO $$
BEGIN
    RAISE NOTICE '✅ Audit logging system installed successfully';
    RAISE NOTICE '📊 Available views:';
    RAISE NOTICE '   - security_suspicious_activity';
    RAISE NOTICE '   - security_admin_actions';
    RAISE NOTICE '   - security_failed_access';
    RAISE NOTICE '';
    RAISE NOTICE '📝 Next steps:';
    RAISE NOTICE '   1. Update API routes to call log_security_event()';
    RAISE NOTICE '   2. Monitor security_suspicious_activity view daily';
    RAISE NOTICE '   3. Set up alerts for unauthorized access attempts';
    RAISE NOTICE '   4. Review security_admin_actions regularly';
END $$;
