-- =====================================================
-- 🔧 EMERGENCY FIX: Disable RLS to Test
-- =====================================================
-- This will temporarily disable RLS to see if that's
-- causing the HTTP 500 errors
-- =====================================================

-- Disable RLS on all tables
ALTER TABLE products DISABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT 
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('products', 'cart_items', 'profiles', 'product_variants')
ORDER BY tablename;

-- =====================================================
-- ✅ EXPECTED RESULT:
-- All tables should show rls_enabled = false
-- 
-- AFTER RUNNING THIS:
-- 1. Refresh your app
-- 2. Check if products load
-- 3. Check if cart works
-- 
-- If it works, the RLS policies were the problem!
-- =====================================================

-- =====================================================
-- ⚠️ IMPORTANT: This is TEMPORARY for testing!
-- After confirming it works, run RE_ENABLE_RLS.sql
-- to turn security back on with fixed policies
-- =====================================================
