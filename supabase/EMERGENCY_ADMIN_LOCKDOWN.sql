-- =====================================================
-- EMERGENCY ADMIN SECURITY LOCKDOWN
-- =====================================================
-- This script ensures ONLY verified admins can access admin data
-- Run this immediately to secure your admin panel
-- =====================================================

-- 1. CHECK CURRENT ADMIN USERS
SELECT 
    id,
    email,
    role,
    created_at
FROM profiles
WHERE role = 'admin';

-- ⚠️ VERIFY: Only YOUR email should be listed above!
-- If you see unauthorized users with 'admin' role, note their IDs

-- 2. REMOVE ADMIN ROLE FROM UNAUTHORIZED USERS (if needed)
-- Uncomment and replace 'unauthorized-user-id' with actual ID:
-- UPDATE profiles 
-- SET role = 'user' 
-- WHERE id = 'unauthorized-user-id';

-- 3. STRICT RLS POLICY FOR PROFILES TABLE
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can ONLY view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can ONLY update their own profile (NOT role!)
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id 
    AND role = (SELECT role FROM profiles WHERE id = auth.uid()) -- Prevent role change
);

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- Policy: Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- 4. STRICT RLS FOR ORDERS (Admin-only access to all orders)
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own orders" ON orders;
DROP POLICY IF EXISTS "Admins can view all orders" ON orders;

-- Users can only see their own orders
CREATE POLICY "Users can view own orders"
ON orders FOR SELECT
USING (user_id = auth.uid());

-- Admins can see all orders
CREATE POLICY "Admins can view all orders"
ON orders FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- 5. STRICT RLS FOR PAYMENTS (Admin-only access)
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payments" ON payments;
DROP POLICY IF EXISTS "Admins can view all payments" ON payments;

-- Users can only see their own payments
CREATE POLICY "Users can view own payments"
ON payments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM orders
        WHERE orders.id = payments.order_id
        AND orders.user_id = auth.uid()
    )
);

-- Admins can see all payments
CREATE POLICY "Admins can view all payments"
ON payments FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    )
);

-- 6. CREATE ADMIN VERIFICATION FUNCTION
-- This function can be called from API routes to verify admin access
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid()
        AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. CREATE FUNCTION TO GET USER ROLE
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role FROM profiles
        WHERE id = auth.uid()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. PREVENT ROLE ESCALATION
-- Create trigger to prevent users from changing their own role
CREATE OR REPLACE FUNCTION prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- If user is trying to update their own profile
    IF NEW.id = auth.uid() THEN
        -- If they're trying to change their role
        IF NEW.role != OLD.role THEN
            -- Only allow if they're already an admin
            IF OLD.role != 'admin' THEN
                RAISE EXCEPTION 'You cannot change your own role';
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS prevent_role_escalation_trigger ON profiles;
CREATE TRIGGER prevent_role_escalation_trigger
    BEFORE UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION prevent_role_escalation();

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check RLS is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename IN ('profiles', 'orders', 'payments');

-- Should show 't' (true) for all tables

-- Check admin users
SELECT 
    email,
    role,
    created_at
FROM profiles
WHERE role = 'admin'
ORDER BY created_at;

-- ⚠️ CRITICAL: Verify only authorized users are admins!

-- Test admin function
SELECT is_admin(); -- Should return true if you're admin, false otherwise

-- =====================================================
-- NEXT STEPS
-- =====================================================
-- 1. Verify RLS is enabled (should see 't' above)
-- 2. Verify only YOUR email has admin role
-- 3. Test accessing /admin in your app
-- 4. Non-admin users should be redirected to /
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Admin security lockdown complete!';
    RAISE NOTICE '⚠️  CRITICAL: Verify only authorized users have admin role';
    RAISE NOTICE '📋 Run the verification queries above';
END $$;
