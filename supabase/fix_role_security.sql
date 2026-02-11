-- Fix: Prevent self-elevation of roles
-- This script restricts users from changing their own role and provides 
-- a way for admins to manage user roles securely.

-- 1. DROP the existing loose update policy
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- 2. CREATE a more secure policy for profiles
-- Users can still update their name, phone, etc., but NOT their role
CREATE POLICY "Users can update own profile info"
    ON public.profiles FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND 
        (
            -- This complex check ensures that if the role is being changed,
            -- it can only be done by someone who is ALREADY an admin.
            -- However, RLS policies are hard to use for column-level checks 
            -- against the NEW row values. A Trigger is better for this.
            true
        )
    );

-- 3. Use a TRIGGER to enforce role protection (Most Secure way)
CREATE OR REPLACE FUNCTION protect_user_role()
RETURNS TRIGGER AS $$
BEGIN
    -- If the role is being changed
    IF NEW.role IS DISTINCT FROM OLD.role THEN
        -- Check if the current user (auth.uid()) is an admin
        IF NOT EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        ) THEN
            -- If not an admin, revert the role change to the OLD value
            NEW.role := OLD.role;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_protect_user_role ON public.profiles;
CREATE TRIGGER trigger_protect_user_role
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION protect_user_role();

-- 4. Ensure only admins can see all profiles if you want privacy, 
-- but usually, a basic SELECT is fine if RLS is on for sensitive data.
-- Currently, schema has "Profiles are viewable by everyone" (Line 360)
-- We should probably limit sensitive data to admins.

DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles are viewable by owner and admin"
    ON public.profiles FOR SELECT
    USING (
        auth.uid() = id OR 
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );
