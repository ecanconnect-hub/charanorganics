-- ============================================
-- SECURITY HARDENING PATCH (2026-03-10)
-- ============================================
-- Goals:
-- 1) Block profile role escalation while keeping self-profile updates.
-- 2) Restrict profile/settings exposure.
-- 3) Lock down rate-limit table writes.
-- ============================================

BEGIN;

-- Safe admin check function for policies (avoids recursive policy patterns).
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_is_admin boolean;
BEGIN
    IF auth.uid() IS NULL THEN
        RETURN false;
    END IF;

    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid()
          AND role = 'admin'
    )
    INTO v_is_admin;

    RETURN COALESCE(v_is_admin, false);
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated, service_role;

-- ---------------------------------------------------------------------------
-- PROFILES HARDENING
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF to_regclass('public.profiles') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY';

        -- Remove legacy/insecure policies.
        EXECUTE 'DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles';
        EXECUTE 'DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles';
        EXECUTE 'DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles';
        EXECUTE 'DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles';
        EXECUTE 'DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles';
        EXECUTE 'DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles';
        EXECUTE 'DROP POLICY IF EXISTS "Profiles - self or admin read" ON public.profiles';
        EXECUTE 'DROP POLICY IF EXISTS "Profiles - self insert" ON public.profiles';
        EXECUTE 'DROP POLICY IF EXISTS "Profiles - self update safe" ON public.profiles';

        -- Keep normal user features: own profile read/update and self insert.
        EXECUTE 'CREATE POLICY "Profiles - self or admin read" ON public.profiles
                 FOR SELECT USING (auth.uid() = id OR public.is_admin())';

        EXECUTE 'CREATE POLICY "Profiles - self insert" ON public.profiles
                 FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin())';

        EXECUTE 'CREATE POLICY "Profiles - self update safe" ON public.profiles
                 FOR UPDATE USING (auth.uid() = id OR public.is_admin())
                 WITH CHECK (auth.uid() = id OR public.is_admin())';
    END IF;
END $$;

-- Prevent non-admins from changing sensitive profile columns (role/email/id).
CREATE OR REPLACE FUNCTION public.guard_profile_sensitive_fields()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Service-role/internal updates bypass this check.
    IF auth.uid() IS NULL THEN
        RETURN NEW;
    END IF;

    -- Admins can manage profiles.
    IF public.is_admin() THEN
        RETURN NEW;
    END IF;

    -- Non-admins may only update their own non-sensitive fields.
    IF auth.uid() <> OLD.id THEN
        RAISE EXCEPTION 'Not allowed to update this profile';
    END IF;

    IF NEW.id IS DISTINCT FROM OLD.id THEN
        RAISE EXCEPTION 'Profile id is immutable';
    END IF;

    IF NEW.email IS DISTINCT FROM OLD.email THEN
        RAISE EXCEPTION 'Email cannot be changed from this endpoint';
    END IF;

    IF NEW.role IS DISTINCT FROM OLD.role THEN
        RAISE EXCEPTION 'Role changes are restricted';
    END IF;

    RETURN NEW;
END;
$$;

DO $$
BEGIN
    IF to_regclass('public.profiles') IS NOT NULL THEN
        EXECUTE 'DROP TRIGGER IF EXISTS trg_guard_profile_sensitive_fields ON public.profiles';
        EXECUTE 'CREATE TRIGGER trg_guard_profile_sensitive_fields
                 BEFORE UPDATE ON public.profiles
                 FOR EACH ROW EXECUTE FUNCTION public.guard_profile_sensitive_fields()';
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- SETTINGS HARDENING
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF to_regclass('public.app_settings') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Public can read settings" ON public.app_settings';
        EXECUTE 'DROP POLICY IF EXISTS "Admins can read settings" ON public.app_settings';
        EXECUTE 'DROP POLICY IF EXISTS "Admins can manage settings" ON public.app_settings';
        EXECUTE 'DROP POLICY IF EXISTS "App settings - admin only" ON public.app_settings';

        EXECUTE 'CREATE POLICY "App settings - admin only" ON public.app_settings
                 FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())';
    END IF;

    IF to_regclass('public.admin_settings') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "Only admins can view settings" ON public.admin_settings';
        EXECUTE 'DROP POLICY IF EXISTS "Only admins can insert settings" ON public.admin_settings';
        EXECUTE 'DROP POLICY IF EXISTS "Only admins can update settings" ON public.admin_settings';
        EXECUTE 'DROP POLICY IF EXISTS "Admin settings - admin only" ON public.admin_settings';

        EXECUTE 'CREATE POLICY "Admin settings - admin only" ON public.admin_settings
                 FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin())';
    END IF;
END $$;

-- ---------------------------------------------------------------------------
-- RATE-LIMIT TABLE HARDENING
-- ---------------------------------------------------------------------------
DO $$
BEGIN
    IF to_regclass('public.rate_limits') IS NOT NULL THEN
        EXECUTE 'ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY';
        EXECUTE 'DROP POLICY IF EXISTS "System can manage rate limits" ON public.rate_limits';
        EXECUTE 'DROP POLICY IF EXISTS "Rate limits - service role only" ON public.rate_limits';

        -- Only service-role access (API server path). Regular authenticated users cannot tamper.
        EXECUTE 'CREATE POLICY "Rate limits - service role only" ON public.rate_limits
                 FOR ALL TO service_role
                 USING (true) WITH CHECK (true)';
    END IF;
END $$;

COMMIT;

