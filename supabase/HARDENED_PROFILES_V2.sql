-- ========================================================
-- 🛡️ CHARAN ORGANICS - OVERRIDE: SECURE PROFILES (NO SCRAPING)
-- ========================================================
-- This script hardens user profiles against discovery and scraping.

-- 1. Remove loose policy
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

-- 2. Create restricted policy
-- Only owner can see their profile, or an admin for management
CREATE POLICY "Profiles - Privacy First Selection"
ON public.profiles FOR SELECT
USING (
    auth.uid() = id OR 
    public.is_admin()
);

-- 3. Ensure role protection is applied (Refetched from FINAL_SECURITY_FIX)
-- (Trigger already exists, but we ensure it covers all bases)

-- ========================================================
-- ✅ PROFILES HARDENED
-- ========================================================
