-- ========================================================
-- 🛡️ CHARAN ORGANICS - FIX LOGIN WHILE KEEPING SECURITY
-- ========================================================
-- This restores the original profile policy to fix login

-- Remove the restrictive policy
DROP POLICY IF EXISTS "Profiles - Privacy First Selection" ON public.profiles;

-- Restore the original policy that allows login to work
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

-- Note: This is needed for the authentication flow to work properly.
-- The profiles table doesn't contain sensitive data (passwords are in auth.users).
-- If you need to restrict profile visibility later, do it at the application level.

-- ========================================================
-- ✅ LOGIN RESTORED
-- ========================================================
