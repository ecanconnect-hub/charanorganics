-- =====================================================
-- SUPER SIMPLE FIX: Make Yourself Admin
-- =====================================================
-- This bypasses ALL security and FORCES your role to admin
-- =====================================================

-- OPTION 1: Direct update (bypasses trigger)
BEGIN;
  -- Disable trigger
  ALTER TABLE profiles DISABLE TRIGGER protect_user_roles_final_trigger;
  
  -- Update your role
  UPDATE profiles 
  SET role = 'admin' 
  WHERE email = 'yuvakiranreddy7@gmail.com';
  
  -- Re-enable trigger
  ALTER TABLE profiles ENABLE TRIGGER protect_user_roles_final_trigger;
COMMIT;

-- Verify it worked
SELECT email, role FROM profiles WHERE email = 'yuvakiranreddy7@gmail.com';

-- =====================================================

-- If that doesn't work, try OPTION 2:
-- Drop the trigger completely, update, then recreate

-- DROP TRIGGER IF EXISTS protect_user_roles_final_trigger ON profiles;

-- UPDATE profiles 
-- SET role = 'admin' 
-- WHERE email = 'yuvakiranreddy7@gmail.com';

-- SELECT email, role FROM profiles WHERE email = 'yuvakiranreddy7@gmail.com';

-- =====================================================
