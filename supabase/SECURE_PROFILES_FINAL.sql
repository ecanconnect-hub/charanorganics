-- ========================================================
-- 🛡️ CHARAN ORGANICS - SECURE PROFILES WITH SELECTIVE VISIBILITY
-- ========================================================
-- This policy hides sensitive data (email, phone, dates) while allowing
-- name to be visible for reviews and admin checks to work.

-- 1. Drop existing policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles - Privacy First Selection" ON public.profiles;

-- 2. Create a secure view that only exposes safe fields
CREATE OR REPLACE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT 
    id,
    full_name,
    role
FROM public.profiles;

-- Grant access to the view
GRANT SELECT ON public.public_profiles TO authenticated, anon;

-- 3. Restrict direct access to profiles table
-- Only owner or admin can see full profile
CREATE POLICY "Profiles - Restricted Access"
ON public.profiles FOR SELECT
USING (
    auth.uid() = id OR 
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 4. Users can still update their own profile
-- (This policy should already exist, but we ensure it's there)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 5. Users can insert their own profile during signup
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ========================================================
-- ✅ SECURE PROFILES COMPLETE
-- Now:
-- - Email, phone, dates are HIDDEN from public
-- - Only name and role are visible (for reviews/admin checks)
-- - Users can see their own full profile
-- - Admins can see all profiles
-- ========================================================
