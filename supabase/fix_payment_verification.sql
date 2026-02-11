-- Fix Payment Verification Issues
-- 1. Drop logging triggers that might be failing due to permissions/RLS
DROP TRIGGER IF EXISTS log_payment_verification_trigger ON payments;
DROP TRIGGER IF EXISTS log_order_status_change_trigger ON orders;

-- 2. Ensure log_admin_activity has correct search path (if we want to keep using it later)
CREATE OR REPLACE FUNCTION log_admin_activity(
    p_action VARCHAR,
    p_resource_type VARCHAR DEFAULT NULL,
    p_resource_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.admin_activity_log (
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

-- 3. Verify RLS policies on payments are correct
DROP POLICY IF EXISTS "Only admins can verify payments" ON payments;
CREATE POLICY "Only admins can verify payments"
    ON payments
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role = 'admin'
        )
    );
