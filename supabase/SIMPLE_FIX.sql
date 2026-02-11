-- =====================================================
-- 🔧 SIMPLE FIX - Run this if COMPREHENSIVE_FIX fails
-- =====================================================
-- This is a simplified version without transactions
-- Run each section one at a time if needed
-- =====================================================

-- =====================================================
-- SECTION 1: Create missing profiles
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
-- SECTION 2: Set admin role for ecanconnect@gmail.com
-- =====================================================
-- Disable triggers (ignore errors if they don't exist)
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

-- Re-enable triggers (ignore errors if they don't exist)
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
-- SECTION 3: Fix RLS policies for profiles table
-- =====================================================
-- Drop existing policies (ignore errors if they don't exist)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
ON profiles FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id 
    AND role = (SELECT role FROM profiles WHERE id = auth.uid())
);

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
-- SECTION 4: Fix RLS policies for cart_items table
-- =====================================================
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can insert own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON cart_items;

-- Enable RLS
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Create new policies
CREATE POLICY "Users can view own cart"
ON cart_items FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart items"
ON cart_items FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart items"
ON cart_items FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart items"
ON cart_items FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- SECTION 5: Ensure products table is readable
-- =====================================================
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Enable read access for all users" ON products;

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Products are viewable by everyone"
ON products FOR SELECT
TO authenticated, anon
USING (true);

-- =====================================================
-- SECTION 6: Ensure product_variants table is readable
-- =====================================================
DROP POLICY IF EXISTS "Variants are viewable by everyone" ON product_variants;

ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Variants are viewable by everyone"
ON product_variants FOR SELECT
TO authenticated, anon
USING (true);

-- =====================================================
-- VERIFICATION: Check admin user
-- =====================================================
SELECT 
    'Admin Check' as check_name,
    email,
    role,
    created_at
FROM profiles
WHERE email = 'ecanconnect@gmail.com';

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
-- 1. Admin Check should show: ecanconnect@gmail.com with role = 'admin'
-- 2. All Users should show all users with profiles
-- =====================================================
