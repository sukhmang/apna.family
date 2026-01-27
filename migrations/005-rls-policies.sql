-- ============================================
-- Milestone 5: Row Level Security (RLS) Policies
-- ============================================
-- 
-- This script enables RLS and creates security policies for:
-- - families table
-- - people table  
-- - user_permissions table
--
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================

-- ============================================
-- Step 1: Enable RLS on All Tables
-- ============================================

ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE people ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;

-- ============================================
-- Step 2: RLS Policies for `families` Table
-- ============================================

-- Policy: Anyone can read families (public data)
CREATE POLICY "Families are viewable by everyone"
  ON families FOR SELECT
  USING (true);

-- Policy: Only admins/editors can update their family
CREATE POLICY "Family admins can update their family"
  ON families FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_email = auth.jwt() ->> 'email'
      AND (
        (user_permissions.role = 'super_admin' AND user_permissions.family_id IS NULL)
        OR (user_permissions.family_id = families.id AND user_permissions.role IN ('admin', 'editor'))
      )
    )
  );

-- Policy: Only super_admins can insert/delete families
CREATE POLICY "Super admins can manage families"
  ON families FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_email = auth.jwt() ->> 'email'
      AND user_permissions.role = 'super_admin'
      AND user_permissions.family_id IS NULL
    )
  );

-- ============================================
-- Step 3: RLS Policies for `people` Table
-- ============================================

-- Policy: Anyone can read people (public data)
CREATE POLICY "People are viewable by everyone"
  ON people FOR SELECT
  USING (true);

-- Policy: Admins/editors can update people in their family
CREATE POLICY "Family admins can update people in their family"
  ON people FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_email = auth.jwt() ->> 'email'
      AND (
        (user_permissions.role = 'super_admin' AND user_permissions.family_id IS NULL)
        OR (user_permissions.family_id = people.family_id AND user_permissions.role IN ('admin', 'editor'))
      )
    )
  );

-- Policy: Admins/editors can insert people in their family
CREATE POLICY "Family admins can insert people in their family"
  ON people FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_email = auth.jwt() ->> 'email'
      AND (
        (user_permissions.role = 'super_admin' AND user_permissions.family_id IS NULL)
        OR (user_permissions.family_id = people.family_id AND user_permissions.role IN ('admin', 'editor'))
      )
    )
  );

-- Policy: Only admins (not editors) can delete people
CREATE POLICY "Family admins can delete people in their family"
  ON people FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_permissions
      WHERE user_permissions.user_email = auth.jwt() ->> 'email'
      AND (
        (user_permissions.role = 'super_admin' AND user_permissions.family_id IS NULL)
        OR (user_permissions.family_id = people.family_id AND user_permissions.role = 'admin')
      )
    )
  );

-- ============================================
-- Step 4: Helper Function for Permission Checks (Bypasses RLS)
-- ============================================

-- Create a security definer function that bypasses RLS to check permissions
-- This prevents infinite recursion when checking if a user is super_admin
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

-- ============================================
-- Step 5: RLS Policies for `user_permissions` Table
-- ============================================

-- Policy: Users can view their own permissions OR super admins can view all
-- Uses helper function to avoid infinite recursion
CREATE POLICY "Users can view their own permissions"
  ON user_permissions FOR SELECT
  USING (
    user_email = auth.jwt() ->> 'email'
    OR check_is_super_admin(auth.jwt() ->> 'email')
  );

-- Policy: Only super_admins can manage permissions
-- Uses the helper function to avoid infinite recursion
CREATE POLICY "Super admins can manage permissions"
  ON user_permissions FOR ALL
  USING (
    check_is_super_admin(auth.jwt() ->> 'email')
  );

-- ============================================
-- Verification Queries (Optional - run to test)
-- ============================================

-- Check if RLS is enabled:
-- SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('families', 'people', 'user_permissions');

-- List all policies:
-- SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual FROM pg_policies WHERE schemaname = 'public' AND tablename IN ('families', 'people', 'user_permissions');
