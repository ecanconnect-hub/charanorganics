-- ========================================================
-- 🔍 DIAGNOSTIC: Check Current Profile Policies
-- ========================================================
-- Run this to see what policies are currently active on profiles table

SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'profiles'
ORDER BY policyname;

-- ========================================================
-- This will show you which policies are currently active.
-- If you see "Profiles - Privacy First Selection", that's the problem.
-- You need to run SECURE_PROFILES_FINAL.sql to fix it.
-- ========================================================
