-- =====================================================
-- 🔍 DIAGNOSTIC SCRIPT - Run this first!
-- =====================================================
-- This will help identify what's wrong
-- =====================================================

-- 1. Check if profiles table exists and has data
SELECT 
    'Profiles Table Check' as check_name,
    COUNT(*) as total_profiles,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as admin_count,
    COUNT(CASE WHEN role = 'customer' THEN 1 END) as customer_count
FROM profiles;

-- 2. Check for users without profiles
SELECT 
    'Missing Profiles Check' as check_name,
    COUNT(*) as users_without_profiles
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- 3. Check admin user specifically
SELECT 
    'Admin User Check' as check_name,
    email,
    role,
    created_at,
    updated_at
FROM profiles
WHERE email = 'ecanconnect@gmail.com';

-- 4. Check RLS policies on profiles table
SELECT 
    'Profiles RLS Policies' as check_name,
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

-- 5. Check RLS policies on cart_items table
SELECT 
    'Cart Items RLS Policies' as check_name,
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'cart_items'
ORDER BY policyname;

-- 6. Check if cart_items table exists
SELECT 
    'Cart Items Table Check' as check_name,
    COUNT(*) as total_cart_items
FROM cart_items;

-- 7. Check if products table is accessible
SELECT 
    'Products Table Check' as check_name,
    COUNT(*) as total_products
FROM products;

-- 8. Check all users and their roles
SELECT 
    'All Users' as check_name,
    email,
    role,
    created_at
FROM profiles
ORDER BY created_at DESC;

-- =====================================================
-- ✅ WHAT TO LOOK FOR:
-- =====================================================
-- 1. Profiles Table Check: Should show at least 1 profile
-- 2. Missing Profiles Check: Should show 0 users without profiles
-- 3. Admin User Check: Should show ecanconnect@gmail.com with role = 'admin'
-- 4. Profiles RLS Policies: Should show at least 4 policies
-- 5. Cart Items RLS Policies: Should show at least 4 policies
-- 6. Cart Items Table Check: Should not error
-- 7. Products Table Check: Should show products count
-- 8. All Users: Should list all users with their roles
-- =====================================================
