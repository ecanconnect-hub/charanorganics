-- =====================================================
-- 🔒 SECURITY FIX: Ensure ONLY ecanconnect@gmail.com is admin
-- =====================================================
-- Current issue: Multiple admin accounts detected
-- This will set ONLY ecanconnect@gmail.com as admin
-- =====================================================

-- Disable triggers temporarily
DO $$
BEGIN
    ALTER TABLE profiles DISABLE TRIGGER protect_user_roles_final_trigger;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE profiles DISABLE TRIGGER protect_user_roles_trigger;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

-- Set ALL users to 'customer' first
UPDATE profiles 
SET role = 'customer';

-- Then set ONLY ecanconnect@gmail.com as admin
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'ecanconnect@gmail.com';

-- Re-enable triggers
DO $$
BEGIN
    ALTER TABLE profiles ENABLE TRIGGER protect_user_roles_final_trigger;
EXCEPTION
    WHEN undefined_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE profiles ENABLE TRIGGER protect_user_roles_trigger;
EXCEPTION
    WHEN undefined_object THEN NULL;
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
