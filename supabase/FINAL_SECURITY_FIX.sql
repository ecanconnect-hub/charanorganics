-- ========================================================
-- 🛡️ CHARAN ORGANICS - CONSOLIDATED SECURITY & RECURSION FIX
-- ========================================================
-- This script:
-- 1. Fixes the "Infinite Recursion" error on the profiles table.
-- 2. Consolidates all previous security scripts into one safe version.
-- 3. Ensures automatic profile creation for new users.
-- 4. Protects the 'admin' role from unauthorized changes.
-- ========================================================

-- I. CLEANUP (Remove all old/buggy policies)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are viewable by owner and admin" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile info" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- II. SAFE ADMIN CHECK (Security Definer Function)
-- This prevents "Infinite Recursion" by checking admin status without triggering RLS loops.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- III. APPLY SECURE POLICIES TO PROFILES
-- Policy 1: Everyone can see profiles (Safe - no recursion)
CREATE POLICY "Profiles are viewable by everyone"
    ON public.profiles FOR SELECT
    USING (true);

-- Policy 2: Users can update their own profile (name, phone, etc.)
-- The Trigger below will secretly block 'role' changes.
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- Policy 3: Allow users to insert their own profile during signup
CREATE POLICY "Users can insert own profile"
    ON public.profiles FOR INSERT
    WITH CHECK (auth.uid() = id);

-- IV. ROLE PROTECTION TRIGGER (The "Lockdown")
-- This function ensures ONLY existing admins can change roles.
CREATE OR REPLACE FUNCTION protect_user_roles_final()
RETURNS TRIGGER AS $$
BEGIN
    -- If the role is being changed
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        -- Check if the current user (the one making the change) is an admin
        IF NOT public.is_admin() THEN
            -- Special case: Allow the very first admin to be created if none exist
            IF (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin') > 0 THEN
                RAISE EXCEPTION 'Security Violation: Only existing admins can change user roles.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trigger_protect_user_roles ON public.profiles;
DROP TRIGGER IF EXISTS trigger_protect_user_role ON public.profiles;
CREATE TRIGGER trigger_protect_user_roles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION protect_user_roles_final();

-- V. AUTH SYNC (New User Handlers)
CREATE OR REPLACE FUNCTION public.handle_new_user_v2()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_v2();

-- VI. BACKFILL & CLEANUP
-- Ensure all existing auth users have profiles
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', ''), 
  'customer'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- VII. SECURE OTHER SENSITIVE TABLES
-- Admin Notifications
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Only admins can view notifications" ON public.admin_notifications;
CREATE POLICY "Only admins can view notifications" ON public.admin_notifications
    FOR SELECT USING (public.is_admin());

-- Admin Settings
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Only admins can view settings" ON public.admin_settings;
CREATE POLICY "Only admins can view settings" ON public.admin_settings
    FOR SELECT USING (public.is_admin());

-- ========================================================
-- ✅ FINAL LOCKDOWN COMPLETE & RECURSION FIXED
-- ========================================================
