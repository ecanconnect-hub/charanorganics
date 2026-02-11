-- =====================================================
-- 🔒 RE-ENABLE RLS with Fixed Policies
-- =====================================================
-- Run this AFTER testing with RLS disabled
-- This will re-enable RLS with proper policies
-- =====================================================

-- =====================================================
-- PRODUCTS TABLE
-- =====================================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
DROP POLICY IF EXISTS "Enable read access for all users" ON products;
DROP POLICY IF EXISTS "Admins can manage products" ON products;

-- Create simple, working policy
CREATE POLICY "Anyone can view products"
ON products FOR SELECT
USING (true);

-- Admins can do everything
CREATE POLICY "Admins can manage products"
ON products FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- =====================================================
-- CART_ITEMS TABLE
-- =====================================================
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own cart" ON cart_items;
DROP POLICY IF EXISTS "Users can insert own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can update own cart items" ON cart_items;
DROP POLICY IF EXISTS "Users can delete own cart items" ON cart_items;

-- Create simple, working policies
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

-- =====================================================
-- PROFILES TABLE
-- =====================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON profiles;

-- Create simple, working policies
CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

CREATE POLICY "Admins can view all"
ON profiles FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM profiles p
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);

CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- =====================================================
-- PRODUCT_VARIANTS TABLE
-- =====================================================
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Variants are viewable by everyone" ON product_variants;
DROP POLICY IF EXISTS "Admins can manage variants" ON product_variants;

-- Create simple, working policy
CREATE POLICY "Anyone can view variants"
ON product_variants FOR SELECT
USING (true);

CREATE POLICY "Admins can manage variants"
ON product_variants FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);

-- =====================================================
-- VERIFICATION
-- =====================================================
SELECT 
    pg_tables.tablename,
    rowsecurity as rls_enabled,
    COUNT(*) as policy_count
FROM pg_tables
LEFT JOIN pg_policies ON pg_tables.tablename = pg_policies.tablename
WHERE pg_tables.schemaname = 'public'
AND pg_tables.tablename IN ('products', 'cart_items', 'profiles', 'product_variants')
GROUP BY pg_tables.tablename, rowsecurity
ORDER BY pg_tables.tablename;

-- =====================================================
-- ✅ EXPECTED RESULT:
-- All tables should show:
-- - rls_enabled = true
-- - policy_count > 0
-- =====================================================
