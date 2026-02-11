-- ========================================================
-- 🛡️ CHARAN ORGANICS - BRUTE FORCE PROTECTION
-- ========================================================
-- Implements login attempt tracking and account lockout

-- 1. Create function to check for brute force attempts
CREATE OR REPLACE FUNCTION public.check_brute_force(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_failed_count INTEGER;
BEGIN
    -- Count failed login attempts in the last 15 minutes
    SELECT COUNT(*)
    INTO v_failed_count
    FROM login_security_events
    WHERE email = p_email
    AND event_type = 'failed_login'
    AND created_at > NOW() - INTERVAL '15 minutes';
    
    -- Return true if 5 or more failed attempts
    RETURN v_failed_count >= 5;
END;
$$;

-- Grant access to the function
GRANT EXECUTE ON FUNCTION public.check_brute_force TO authenticated, anon;

-- 2. Create cleanup function to remove old security events
CREATE OR REPLACE FUNCTION public.cleanup_security_events()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Delete events older than 24 hours
    DELETE FROM login_security_events
    WHERE created_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- ========================================================
-- ✅ BRUTE FORCE PROTECTION ENABLED
-- ========================================================
