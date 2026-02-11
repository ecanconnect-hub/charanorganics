-- =====================================================
-- 🔧 FIX INFINITE RECURSION ERROR
-- =====================================================
-- The error "infinite recursion detected in policy" happens because
-- the RLS policy for profiles queries the profiles table itself.
-- 
-- SOLUTION: Use a SECURITY DEFINER function to bypass RLS
-- for the admin check.
-- =====================================================

-- 1. Create the helper function
-- This function runs with the privileges of the creator (SECURITY DEFINER),
-- effectively bypassing the RLS recursion loop for this specific check.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM profiles
    WHERE id = auth.uid()
    AND role = 'admin'
  );
$$;

-- 2. Update PROFILES Policies (The Source of the Error)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop all old/potential policies to be safe
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;

-- New Policies using is_admin()
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Admins can view all" 
ON profiles FOR SELECT 
USING (is_admin());

CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id);

-- 3. Update PRODUCTS Policies
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view products" ON products;
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;

CREATE POLICY "Anyone can view products" 
ON products FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage products" 
ON products FOR ALL 
USING (is_admin());

-- 4. Update PRODUCT_VARIANTS Policies
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view variants" ON product_variants;
DROP POLICY IF EXISTS "Variants are viewable by everyone" ON product_variants;
DROP POLICY IF EXISTS "Admins can manage variants" ON product_variants;

CREATE POLICY "Anyone can view variants" 
ON product_variants FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage variants" 
ON product_variants FOR ALL 
USING (is_admin());

-- 5. Update CART_ITEMS Policies (Ensure these are clean)
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can insert own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can update own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can delete own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can insert own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON cart_items;

CREATE POLICY "Users can view own cart" 
ON cart_items FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cart" 
ON cart_items FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cart" 
ON cart_items FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own cart" 
ON cart_items FOR DELETE 
USING (auth.uid() = user_id);

-- 6. Verification
SELECT 
    'Function Created' as check_name,
    proname
FROM pg_proc 
WHERE proname = 'is_admin';

SELECT 
    tablename,
    policyname
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'products')
ORDER BY tablename;
