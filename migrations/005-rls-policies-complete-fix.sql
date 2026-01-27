-- ============================================
-- Complete Fix for Infinite Recursion in RLS Policies
-- ============================================
-- 
-- This script fixes the infinite recursion error by:
-- 1. Dropping all problematic policies
-- 2. Creating a security definer function that bypasses RLS
-- 3. Recreating all policies with proper NULL handling
--
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- Step 1: Drop all existing policies on user_permissions
DROP POLICY IF EXISTS "Users can view their own permissions" ON user_permissions;
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

-- Step 3: Recreate the SELECT policy (users can view their own permissions)
CREATE POLICY "Users can view their own permissions"
  ON user_permissions FOR SELECT
  USING (
    user_email = auth.jwt() ->> 'email'
    OR check_is_super_admin(auth.jwt() ->> 'email')
  );

-- Step 4: Recreate the ALL policy (super admins can manage permissions)
-- Uses the helper function to avoid infinite recursion
CREATE POLICY "Super admins can manage permissions"
  ON user_permissions FOR ALL
  USING (
    check_is_super_admin(auth.jwt() ->> 'email')
  );

-- ============================================
-- Verification
-- ============================================

-- Test that the function works
-- SELECT check_is_super_admin('sukhman.s.grewal@gmail.com'); -- Should return true
-- SELECT check_is_super_admin(NULL); -- Should return false
-- SELECT check_is_super_admin('nonexistent@example.com'); -- Should return false

-- Verify the policies exist
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'user_permissions';

-- ============================================
-- Additional Fix: Ensure families and people policies handle NULL email
-- ============================================

-- The families and people policies should already handle NULL email correctly
-- because they use EXISTS which returns false if the subquery returns no rows
-- But let's verify they're not causing issues

-- Check current policies
-- SELECT tablename, policyname, cmd, qual 
-- FROM pg_policies 
-- WHERE schemaname = 'public' 
-- AND tablename IN ('families', 'people', 'user_permissions')
-- ORDER BY tablename, policyname;
