-- ========================================================
-- 🛡️ CHARAN ORGANICS - DATABASE HARDENING (PATCH)
-- ========================================================
-- This script fixes SECURITY DEFINER vulnerabilities and strengthens RLS.

-- 1. Hardening has_purchased_product
CREATE OR REPLACE FUNCTION public.has_purchased_product(
    p_user_id UUID,
    p_product_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM orders o
        INNER JOIN order_items oi ON oi.order_id = o.id
        WHERE o.user_id = p_user_id
        AND oi.product_id = p_product_id
        AND o.status = 'delivered'
    );
END;
$$;

-- 2. Hardening mark_review_as_verified
CREATE OR REPLACE FUNCTION public.mark_review_as_verified()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    NEW.verified_purchase := public.has_purchased_product(NEW.user_id, NEW.product_id);
    RETURN NEW;
END;
$$;

-- 3. Hardening role protection trigger
CREATE OR REPLACE FUNCTION protect_user_roles_v3()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        IF NOT public.is_admin() THEN
             RAISE EXCEPTION 'Security Violation: Unauthorized role modification attempt.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_protect_user_roles ON public.profiles;
CREATE TRIGGER trigger_protect_user_roles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION protect_user_roles_v3();

-- 4. Strengthening Admin Activity Access
-- Ensure only admins can see activity logs even via direct SQL
ALTER TABLE admin_activity_log FORCE ROW LEVEL SECURITY;

-- ========================================================
-- ✅ DATABASE HARDENING COMPLETE
-- ========================================================
