-- ========================================================
-- 🚨 EMERGENCY FIX: Restore Login Functionality
-- ========================================================
-- This completely resets the profiles policies to working state

-- STEP 1: Remove ALL profile policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles - Privacy First Selection" ON public.profiles;
DROP POLICY IF EXISTS "Profiles - Restricted Access" ON public.profiles;
DROP POLICY IF EXISTS "Profiles - Secure Access" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- STEP 2: Create SIMPLE, WORKING policies
-- Allow everyone to SELECT (needed for login to work)
CREATE POLICY "allow_select_profiles"
    ON public.profiles FOR SELECT
    USING (true);

-- Allow users to INSERT their own profile
CREATE POLICY "allow_insert_own_profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Allow users to UPDATE their own profile
CREATE POLICY "allow_update_own_profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- STEP 3: Ensure is_admin() function exists
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, anon;

-- STEP 4: Create profiles for users who don't have one
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) as full_name,
    'customer' as role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- STEP 5: Ensure the trigger exists for new users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, role)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
        'customer'
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========================================================
-- ✅ DONE! Login should work now.
-- ========================================================
-- This script:
-- 1. Removes all broken policies
-- 2. Creates simple, working policies
-- 3. Creates missing profiles
-- 4. Sets up auto-profile creation for new users
--
-- After running this:
-- - Clear browser cookies
-- - Go to /login
-- - Login should work
-- - Profile page should work
-- ========================================================
