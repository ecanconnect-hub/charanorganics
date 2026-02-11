-- =====================================================
-- EMERGENCY: FIX ADMIN ROLES (Bypass Security Trigger)
-- =====================================================
-- The security trigger is blocking role changes
-- We need to temporarily disable it, fix roles, then re-enable
-- =====================================================

-- STEP 1: Disable the security trigger temporarily
ALTER TABLE profiles DISABLE TRIGGER ALL;

-- STEP 2: Check current admin accounts
SELECT 
    id,
    email,
    role,
    created_at
FROM profiles
WHERE role = 'admin'
ORDER BY created_at DESC;

-- ⚠️ Look at the results above - who has admin role?

-- STEP 3: Make YOUR email admin (replace with your actual email)
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'yuvakiranreddy7@gmail.com';

-- STEP 4: Remove admin from unauthorized users (if any)
-- Uncomment and replace email if needed:
-- UPDATE profiles 
-- SET role = 'user' 
-- WHERE email = 'unauthorized@email.com';

-- STEP 5: Re-enable the security trigger
ALTER TABLE profiles ENABLE TRIGGER ALL;

-- STEP 6: Verify the changes
SELECT 
    email,
    role,
    created_at
FROM profiles
WHERE role = 'admin'
ORDER BY created_at DESC;

-- ⚠️ CRITICAL: Only YOUR email should appear above!

-- =====================================================
-- VERIFICATION
-- =====================================================

-- Check all users and their roles
SELECT 
    email,
    role,
    CASE 
        WHEN role = 'admin' THEN '🔴 ADMIN'
        WHEN role = 'user' THEN '🟢 USER'
        ELSE '⚪ OTHER'
    END as status
FROM profiles
ORDER BY 
    CASE role
        WHEN 'admin' THEN 1
        WHEN 'user' THEN 2
        ELSE 3
    END,
    created_at DESC;

-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '✅ Admin roles fixed!';
    RAISE NOTICE '⚠️  Verify only authorized users have admin role';
    RAISE NOTICE '🔒 Security trigger is now re-enabled';
END $$;
