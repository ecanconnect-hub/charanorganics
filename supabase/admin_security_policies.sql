-- Admin Security Policies
-- Implements strict security measures for admin access

-- 1. Set session timeout to 3 hours (10800 seconds)
-- This needs to be set in Supabase Dashboard -> Authentication -> Settings
-- Or via SQL:
-- UPDATE auth.config SET session_timeout = 10800;

-- 2. Create admin activity log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES profiles(id),
    action VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100),
    resource_id UUID,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    details JSONB
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_admin_activity_admin_id ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_activity_created_at ON admin_activity_log(created_at);

-- Enable RLS
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can view activity logs
CREATE POLICY "Admins can view activity logs"
    ON admin_activity_log
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Policy: System can insert activity logs
CREATE POLICY "System can insert activity logs"
    ON admin_activity_log
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = admin_id);

-- 3. Create failed login attempts table
CREATE TABLE IF NOT EXISTS failed_login_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    ip_address INET,
    attempted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE failed_login_attempts ENABLE ROW LEVEL SECURITY;

-- Only admins can view failed login attempts
CREATE POLICY "Only admins can view failed login attempts"
    ON failed_login_attempts
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Index for cleanup and queries
CREATE INDEX IF NOT EXISTS idx_failed_login_email ON failed_login_attempts(email);
CREATE INDEX IF NOT EXISTS idx_failed_login_attempted_at ON failed_login_attempts(attempted_at);

-- 4. Function to check if account should be locked (5 failed attempts in 15 minutes)
CREATE OR REPLACE FUNCTION is_account_locked(user_email VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
    attempt_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO attempt_count
    FROM failed_login_attempts
    WHERE email = user_email
    AND attempted_at > NOW() - INTERVAL '15 minutes';
    
    RETURN attempt_count >= 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity(
    p_action VARCHAR,
    p_resource_type VARCHAR DEFAULT NULL,
    p_resource_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO admin_activity_log (
        admin_id,
        action,
        resource_type,
        resource_id,
        details
    ) VALUES (
        auth.uid(),
        p_action,
        p_resource_type,
        p_resource_id,
        p_details
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 6. Trigger to log order status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        PERFORM log_admin_activity(
            'order_status_changed',
            'order',
            NEW.id,
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'order_id', NEW.order_id
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS log_order_status_change_trigger ON orders;
CREATE TRIGGER log_order_status_change_trigger
    AFTER UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION log_order_status_change();

-- 7. Trigger to log payment verifications
CREATE OR REPLACE FUNCTION log_payment_verification()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) THEN
        PERFORM log_admin_activity(
            'payment_verified',
            'payment',
            NEW.id,
            jsonb_build_object(
                'old_status', OLD.status,
                'new_status', NEW.status,
                'transaction_id', NEW.transaction_id
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS log_payment_verification_trigger ON payments;
CREATE TRIGGER log_payment_verification_trigger
    AFTER UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION log_payment_verification();

-- 8. Function to cleanup old activity logs (keep last 90 days)
CREATE OR REPLACE FUNCTION cleanup_old_activity_logs()
RETURNS VOID AS $$
BEGIN
    DELETE FROM admin_activity_log
    WHERE created_at < NOW() - INTERVAL '90 days';
    
    DELETE FROM failed_login_attempts
    WHERE attempted_at < NOW() - INTERVAL '1 day';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 9. Additional RLS policies for enhanced security

-- Ensure only admins can update order status
DROP POLICY IF EXISTS "Only admins can update orders" ON orders;
CREATE POLICY "Only admins can update orders"
    ON orders
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Ensure only admins can update payments
DROP POLICY IF EXISTS "Only admins can update payments" ON payments;
CREATE POLICY "Only admins can update payments"
    ON payments
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- Ensure only admins can modify products
DROP POLICY IF EXISTS "Only admins can modify products" ON products;
CREATE POLICY "Only admins can modify products"
    ON products
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );

-- 10. Create a view for recent admin activity (for dashboard)
-- Explicitly using security_invoker (SQL standard default)
CREATE OR REPLACE VIEW recent_admin_activity 
WITH (security_invoker = true)
AS
SELECT 
    aal.*,
    p.full_name as admin_name,
    p.email as admin_email
FROM admin_activity_log aal
JOIN profiles p ON aal.admin_id = p.id
WHERE aal.created_at > NOW() - INTERVAL '7 days'
ORDER BY aal.created_at DESC
LIMIT 100;

-- Grant access to admins
GRANT SELECT ON recent_admin_activity TO authenticated;

COMMENT ON TABLE admin_activity_log IS 'Logs all admin actions for security audit trail';
COMMENT ON TABLE failed_login_attempts IS 'Tracks failed login attempts for security monitoring';
COMMENT ON FUNCTION is_account_locked IS 'Checks if account is temporarily locked due to failed login attempts';
COMMENT ON FUNCTION log_admin_activity IS 'Logs admin actions for audit trail';
