-- ========================================================
-- 🔍 DIAGNOSTIC: Check if your user has a profile
-- ========================================================
-- Run this to see if your login created a profile

-- 1. Check all users in auth.users
SELECT id, email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- 2. Check all profiles
SELECT id, email, full_name, role, created_at 
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Check if there are users WITHOUT profiles (THIS IS THE PROBLEM)
SELECT u.id, u.email, u.created_at
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- ========================================================
-- If the 3rd query returns rows, those users don't have profiles!
-- That's why login fails - the app expects a profile to exist.
-- ========================================================
