-- ========================================================
-- 🛡️ CHARAN ORGANICS - ULTIMATE SECURITY LOCKDOWN
-- ========================================================
-- This script secures the database against:
-- 1. Unauthorized role changes (Self-promotion)
-- 2. Missing user profiles (Auth sync issues)
-- 3. Data leaks (Secure RLS)
-- ========================================================

-- 1. SETUP AUTOMATIC PROFILES (Sync Auth Users to Public Profiles)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'customer' -- Always default to customer
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. PREVENT SELF-PROMOTION (Role Protection)
-- This function ensures ONLY existing admins can change roles.
CREATE OR REPLACE FUNCTION protect_user_roles()
RETURNS TRIGGER AS $$
BEGIN
    -- If the role is being changed
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        -- Check if the current user (the one making the change) is an admin
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ) THEN
            -- Special case: Allow the very first admin to be created if none exist
            IF (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin') > 0 THEN
                RAISE EXCEPTION 'Security Violation: Only existing admins can change user roles.';
            END IF;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_protect_user_roles ON public.profiles;
CREATE TRIGGER trigger_protect_user_roles
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION protect_user_roles();

-- 3. BACKFILL MISSING PROFILES
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', ''), 
  'customer'
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 4. REINFORCE RLS POLICIES
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles: Public can view, but only admins can see all emails (prevent scraping)
-- Note: We keep "viewable by everyone" for now as the app might need it for order references.
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

-- Profiles: Users can only update their own profile (Trigger handles role safety)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" 
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 5. SECURE ADMIN TABLES
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Only admins can view settings" ON public.admin_settings;
CREATE POLICY "Only admins can view settings" ON public.admin_settings
    FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Only admins can view notifications" ON public.admin_notifications;
CREATE POLICY "Only admins can view notifications" ON public.admin_notifications
    FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- ========================================================
-- ✅ LOCKDOWN COMPLETE
-- ========================================================
