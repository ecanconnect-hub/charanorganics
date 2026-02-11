-- =====================================================
-- 🔍 CHECK IF TABLES EXIST
-- =====================================================
-- This will tell us which tables are missing
-- =====================================================

-- Check if cart_items table exists
SELECT 
    'cart_items table' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'cart_items'
    ) as exists;

-- Check if products table exists
SELECT 
    'products table' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'products'
    ) as exists;

-- Check if profiles table exists
SELECT 
    'profiles table' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'profiles'
    ) as exists;

-- Check if product_variants table exists
SELECT 
    'product_variants table' as table_name,
    EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'product_variants'
    ) as exists;

-- List ALL tables in public schema
SELECT 
    'All Public Tables' as info,
    table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check cart_items table structure (if it exists)
SELECT 
    'cart_items columns' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'cart_items'
ORDER BY ordinal_position;

-- Check products table structure (if it exists)
SELECT 
    'products columns' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'products'
ORDER BY ordinal_position;

-- =====================================================
-- ✅ WHAT TO LOOK FOR:
-- =====================================================
-- 1. All tables should show "exists = true"
-- 2. "All Public Tables" should list your tables
-- 3. cart_items should have: user_id, product_id, variant_id, quantity
-- 4. products should have: id, product_id, title_en, image_url, etc.
-- =====================================================
