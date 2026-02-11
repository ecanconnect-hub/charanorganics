-- ========================================================
-- 🛡️ CHARAN ORGANICS - ULTIMATE PRODUCTION LOCKDOWN V2
-- ========================================================
-- This script hardens the database against all identified vulnerabilities:
-- 1. Data Leakage (Profiles)
-- 2. Authorization Bypass (Payment Verification)
-- 3. Storage Insecurity (Payment Proofs)
-- 4. Audit Log Integrity
-- 5. Safe Guest Order Tracking (Unpredictable)
-- ========================================================

-- I. PROFILES: STOP DATA SCRAPING
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles - Restricted Selective Select" ON public.profiles;

CREATE POLICY "Profiles - Restricted Selection"
ON public.profiles FOR SELECT
USING (
    auth.uid() = id OR 
    public.is_admin()
);

-- II. PAYMENTS: STOP SELF-VERIFICATION
DROP POLICY IF EXISTS "Users can update own payment proof" ON public.payments;
DROP POLICY IF EXISTS "Only admins can verify payments" ON public.payments;
DROP POLICY IF EXISTS "Payments - Owner Update Proof Only" ON public.payments;
DROP POLICY IF EXISTS "Payments - Admin Controlled Update" ON public.payments;

CREATE POLICY "Payments - Owner Update Proof Only"
ON public.payments FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.orders
        WHERE orders.id = payments.order_id
        AND orders.user_id = auth.uid()
    )
)
WITH CHECK (
    -- Prevent status changes by users
    (status = OLD.status) 
    AND (verified_by IS NOT DISTINCT FROM OLD.verified_by)
);

CREATE POLICY "Payments - Admin Full Control"
ON public.payments FOR ALL
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- III. ADMIN ACTIVITY: LOG INTEGRITY
DROP POLICY IF EXISTS "System can insert activity logs" ON public.admin_activity_log;
DROP POLICY IF EXISTS "Admins can view activity logs" ON public.admin_activity_log;
DROP POLICY IF EXISTS "Admin Activity - Restricted Insert" ON public.admin_activity_log;
DROP POLICY IF EXISTS "Admin Activity - Admin View Only" ON public.admin_activity_log;

CREATE POLICY "Admin Activity - Restricted Insert"
ON public.admin_activity_log FOR INSERT
TO authenticated
WITH CHECK (public.is_admin() AND auth.uid() = admin_id);

CREATE POLICY "Admin Activity - Admin View Only"
ON public.admin_activity_log FOR SELECT
TO authenticated
USING (public.is_admin());

-- IV. STORAGE LOCKDOWN: PRIVATE PAYMENT PROOFS
-- 1. Make the bucket private
UPDATE storage.buckets SET public = false WHERE id = 'payments';

-- 2. Restrict SELECT
DROP POLICY IF EXISTS "Public Payment Read" ON storage.objects;
DROP POLICY IF EXISTS "Payments - Secure Selection" ON storage.objects;
CREATE POLICY "Payments - Secure Selection"
ON storage.objects FOR SELECT
USING (
    bucket_id = 'payments' 
    AND (
        public.is_admin() OR 
        (auth.uid()::text = (storage.foldername(name))[1])
    )
);

-- 3. Restrict INSERT
DROP POLICY IF EXISTS "Auth User Upload" ON storage.objects;
DROP POLICY IF EXISTS "Payments - Restricted Upload" ON storage.objects;
CREATE POLICY "Payments - Restricted Upload"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'payments' 
    AND (auth.role() = 'authenticated')
    AND (auth.uid()::text = (storage.foldername(name))[1])
);

-- V. SECURE GUEST TRACKING (RPC)
-- This function allows guests to track orders ONLY if they provide the correct phone number.
-- Using SECURITY DEFINER to bypass RLS for this specific, controlled logic.
CREATE OR REPLACE FUNCTION public.get_order_tracking(p_order_id TEXT, p_phone TEXT)
RETURNS JSONB 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_order_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'order', to_jsonb(o.*),
        'items', (
            SELECT jsonb_agg(
                jsonb_build_object(
                    'quantity', oi.quantity,
                    'unit_price', oi.unit_price,
                    'product_title_en', oi.product_title_en,
                    'image_url', p.image_url
                )
            ) 
            FROM order_items oi 
            LEFT JOIN products p ON p.id = oi.product_id
            WHERE oi.order_id = o.id
        )
    ) INTO v_order_result
    FROM orders o
    WHERE o.order_id = p_order_id 
    AND (
        o.shipping_phone = p_phone -- The secret key for guests
        OR o.user_id = auth.uid()  -- Logged in owner
        OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin') -- Admin
    );
    
    RETURN v_order_result;
END;
$$;

-- VI. BRUTE FORCE PROTECTION TABLE
CREATE TABLE IF NOT EXISTS public.login_security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    ip_address TEXT,
    event_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE public.login_security_events ENABLE ROW LEVEL SECURITY;

-- Only Allow Inserts (Public can track their own failures if needed, but usually just for system)
CREATE POLICY "System can insert login events" 
ON public.login_security_events FOR INSERT 
WITH CHECK (true);

-- ========================================================
-- ✅ PRODUCTION LOCKDOWN COMPLETE
-- ========================================================
