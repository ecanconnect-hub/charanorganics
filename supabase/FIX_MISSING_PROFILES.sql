-- ========================================================
-- 🔧 FIX: Create missing profiles for existing users
-- ========================================================
-- This creates profiles for any users that don't have one

-- Create profiles for users without them
INSERT INTO public.profiles (id, email, full_name, role)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', split_part(u.email, '@', 1)) as full_name,
    'customer' as role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- ========================================================
-- ✅ This will create profiles for all users who are missing them
-- After running this, try to login again
-- ========================================================
