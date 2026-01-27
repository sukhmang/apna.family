-- ============================================
-- Fix for Infinite Recursion in user_permissions RLS Policy
-- ============================================
-- 
-- This script fixes the infinite recursion error by:
-- 1. Creating a security definer function that bypasses RLS
-- 2. Updating the policy to use this function
--
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- Step 1: Drop the problematic policy
DROP POLICY IF EXISTS "Super admins can manage permissions" ON user_permissions;

-- Step 2: Create a security definer function that bypasses RLS
-- This function can check permissions without triggering RLS recursion
-- Handles NULL email (when user is not logged in)
CREATE OR REPLACE FUNCTION check_is_super_admin(user_email_param TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
BEGIN
  -- Return false if email is NULL (user not logged in)
  IF user_email_param IS NULL THEN
    RETURN FALSE;
  END IF;
  
  RETURN EXISTS (
    SELECT 1 FROM user_permissions
    WHERE user_permissions.user_email = user_email_param
    AND user_permissions.role = 'super_admin'
    AND user_permissions.family_id IS NULL
  );
END;
$$;

-- Step 3: Recreate the policy using the helper function
CREATE POLICY "Super admins can manage permissions"
  ON user_permissions FOR ALL
  USING (
    check_is_super_admin(auth.jwt() ->> 'email')
  );

-- ============================================
-- Verification
-- ============================================

-- Test that the function works (should return true for super admin, false for others)
-- SELECT check_is_super_admin('your-email@example.com');

-- Verify the policy exists
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'user_permissions';
