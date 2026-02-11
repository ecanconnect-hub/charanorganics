-- =====================================================
-- 🔧 COMPREHENSIVE FIX FOR ALL ISSUES
-- =====================================================
-- This script fixes:
-- 1. Missing profiles causing login/cart errors
-- 2. Admin access for ecanconnect@gmail.com
-- 3. RLS policies for cart_items and profiles
-- =====================================================

-- =====================================================
-- STEP 1: Create missing profiles
-- =====================================================
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) as full_name,
    'customer' as role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- STEP 2: Set admin role for ecanconnect@gmail.com
-- =====================================================
-- Temporarily disable triggers (ignore if they don't exist)
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

-- Set admin role
UPDATE profiles 
SET role = 'admin' 
WHERE email = 'ecanconnect@gmail.com';

-- Re-enable triggers (ignore if they don't exist)
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
-- STEP 3: Fix RLS policies for profiles table
-- =====================================================
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create new policies
-- 1. Users can view their own profile
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- 3. Users can update their own profile (except role)
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id 
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
);

-- 4. Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
ON profiles FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- =====================================================
-- STEP 4: Fix RLS policies for cart_items table
-- =====================================================
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can insert own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON cart_items;

-- Enable RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Create new policies
-- 1. Users can view their own cart
CREATE POLICY "Users can view own cart"
ON cart_items FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- 2. Users can insert into their own cart
CREATE POLICY "Users can insert own cart items"
ON cart_items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 3. Users can update their own cart
CREATE POLICY "Users can update own cart items"
ON cart_items FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 4. Users can delete from their own cart
CREATE POLICY "Users can delete own cart items"
ON cart_items FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- STEP 5: Ensure products table is readable by all
-- =====================================================
-- Drop existing policies
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Enable read access for all users" ON products;

-- Enable RLS
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create new policy
CREATE POLICY "Products are viewable by everyone"
ON products FOR SELECT
TO authenticated, anon
USING (true);

-- =====================================================
-- STEP 6: Ensure product_variants table is readable
-- =====================================================
-- Drop existing policies
DROP POLICY IF EXISTS "Variants are viewable by everyone" ON product_variants;

-- Enable RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Create new policy
CREATE POLICY "Variants are viewable by everyone"
ON product_variants FOR SELECT
TO authenticated, anon
USING (true);

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Check admin users
SELECT 
    email,
    role,
    created_at
FROM profiles
WHERE role = 'admin'
ORDER BY created_at DESC;

-- Check all users
SELECT 
    email,
    role,
    created_at
FROM profiles
ORDER BY created_at DESC;

-- Check for users without profiles
SELECT 
    u.email,
    u.id,
    p.id as profile_id
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- =====================================================
-- ✅ EXPECTED RESULTS:
-- 1. ecanconnect@gmail.com should have role = 'admin'
-- 2. All users should have profiles
-- 3. No users should be missing profiles
-- =====================================================
