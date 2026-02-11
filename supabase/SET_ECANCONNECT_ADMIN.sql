-- =====================================================
-- SET ADMIN: ecanconnect@gmail.com
-- =====================================================

BEGIN;
  -- Disable the trigger
  ALTER TABLE profiles DISABLE TRIGGER protect_user_roles_final_trigger;
  
  -- Make ecanconnect@gmail.com admin
  UPDATE profiles 
  SET role = 'admin' 
  WHERE email = 'ecanconnect@gmail.com';
  
  -- Make sure yuvakiranreddy7@gmail.com is regular user (if it exists)
  UPDATE profiles 
  SET role = 'user' 
  WHERE email = 'yuvakiranreddy7@gmail.com';
  
  -- Re-enable trigger
  ALTER TABLE profiles ENABLE TRIGGER protect_user_roles_final_trigger;
COMMIT;

-- =====================================================
-- VERIFY: Check who has admin role
-- =====================================================

SELECT 
    email,
    role,
    created_at
FROM profiles
WHERE role = 'admin'
ORDER BY created_at DESC;

-- ⚠️ Should ONLY show: ecanconnect@gmail.com

-- =====================================================
-- See ALL users
-- =====================================================

SELECT 
    email,
    role,
    created_at
FROM profiles
ORDER BY created_at DESC;

-- =====================================================
