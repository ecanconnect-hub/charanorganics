-- =====================================================
-- 🔒 FORCE FIX: Remove extra admin account
-- =====================================================
-- This bypasses the trigger by dropping it temporarily
-- =====================================================

-- Step 1: Drop the trigger completely
DROP TRIGGER IF EXISTS protect_user_roles_final_trigger ON profiles;
DROP TRIGGER IF EXISTS protect_user_roles_trigger ON profiles;

-- Step 2: Set ALL users to 'customer' first
UPDATE profiles 
SET role = 'customer';

-- Step 3: Set ONLY ecanconnect@gmail.com as admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'ecanconnect@gmail.com';

-- Step 4: Recreate the trigger (if the function exists)
DO $$
BEGIN
    -- Only create trigger if the function exists
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'protect_user_roles_final') THEN
        CREATE TRIGGER protect_user_roles_final_trigger
        BEFORE UPDATE ON profiles
        FOR EACH ROW
        WHEN (OLD.role IS DISTINCT FROM NEW.role)
        EXECUTE FUNCTION protect_user_roles_final();
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'protect_user_roles') THEN
        CREATE TRIGGER protect_user_roles_trigger
        BEFORE UPDATE ON profiles
        FOR EACH ROW
        WHEN (OLD.role IS DISTINCT FROM NEW.role)
        EXECUTE FUNCTION protect_user_roles();
    END IF;
END $$;

-- =====================================================
-- VERIFICATION: Check admin accounts
-- =====================================================
SELECT 
    'Admin Accounts' as check_name,
    email,
    role,
    created_at
FROM profiles
WHERE role = 'admin'
ORDER BY created_at DESC;

-- Should show ONLY ecanconnect@gmail.com

-- =====================================================
-- VERIFICATION: Check all users
-- =====================================================
SELECT 
    'All Users' as check_name,
    email,
    role,
    created_at
FROM profiles
ORDER BY created_at DESC;

-- =====================================================
-- ✅ EXPECTED RESULTS:
-- 1. Admin Accounts: Should show ONLY ecanconnect@gmail.com
-- 2. All other users should have role = 'customer'
-- =====================================================
