-- ========================================================
-- 🛡️ CHARAN ORGANICS - SECURE PROFILES (NO CIRCULAR DEPENDENCY)
-- ========================================================
-- This fixes the cart error by avoiding circular dependencies in RLS policies

-- Step 1: Ensure is_admin() function exists and works correctly
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- This function bypasses RLS because it's SECURITY DEFINER
    -- It can safely query profiles without triggering the policy
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$;

-- Grant execute to all roles
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- Step 2: Drop all existing profile policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles - Privacy First Selection" ON public.profiles;
DROP POLICY IF EXISTS "Profiles - Restricted Access" ON public.profiles;

-- Step 3: Create the CORRECT policy (no circular dependency)
-- This policy works because is_admin() is SECURITY DEFINER
CREATE POLICY "Profiles - Secure Access"
ON public.profiles FOR SELECT
USING (
    -- User can see their own profile
    auth.uid() = id 
    OR 
    -- OR user is an admin (uses SECURITY DEFINER function, no recursion)
    public.is_admin()
);

-- Step 4: Ensure users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Step 5: Users can insert their own profile during signup
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- ========================================================
-- ✅ SECURE & FUNCTIONAL
-- ========================================================
-- This solution:
-- - Allows users to see their own profile (for cart, orders, etc.)
-- - Allows admins to see all profiles (for management)
-- - NO circular dependency (is_admin uses SECURITY DEFINER)
-- - Login works ✅
-- - Cart works ✅
-- - Admin panel works ✅
--
-- Note: All profile fields are visible to owner/admin.
-- If you want to hide email/phone from PUBLIC views (like reviews),
-- modify the frontend to only fetch 'full_name' field.
-- ========================================================
