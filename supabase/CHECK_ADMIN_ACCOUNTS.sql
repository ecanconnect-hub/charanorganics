-- =====================================================
-- CHECK ADMIN ACCOUNTS
-- =====================================================
-- Run this in Supabase SQL Editor to see who has admin access
-- =====================================================

-- 1. LIST ALL ADMIN USERS
SELECT 
    id,
    email,
    role,
    full_name,
    created_at,
    updated_at
FROM profiles
WHERE role = 'admin'
ORDER BY created_at DESC;

-- ⚠️ CRITICAL: Only YOUR email should appear above!
-- If you see unauthorized users, note their email addresses

-- =====================================================

-- 2. LIST ALL USERS WITH THEIR ROLES
SELECT 
    id,
    email,
    role,
    full_name,
    created_at
FROM profiles
ORDER BY 
    CASE role
        WHEN 'admin' THEN 1
        WHEN 'user' THEN 2
        ELSE 3
    END,
    created_at DESC;

-- =====================================================

-- 3. COUNT USERS BY ROLE
SELECT 
    role,
    COUNT(*) as count
FROM profiles
GROUP BY role
ORDER BY count DESC;

-- Expected: Only 1 admin (YOU!)

-- =====================================================

-- 4. REMOVE ADMIN FROM SPECIFIC USER (if needed)
-- ⚠️ Uncomment and replace email to demote user:

-- UPDATE profiles 
-- SET role = 'user' 
-- WHERE email = 'unauthorized@email.com';

-- =====================================================

-- 5. MAKE YOURSELF ADMIN (if you're not already)
-- ⚠️ Replace with YOUR email:

-- UPDATE profiles 
-- SET role = 'admin' 
-- WHERE email = 'your-email@example.com';

-- =====================================================

-- 6. CHECK SPECIFIC USER'S ROLE
-- Replace with email to check:

-- SELECT 
--     email,
--     role,
--     created_at
-- FROM profiles
-- WHERE email = 'user@example.com';

-- =====================================================
