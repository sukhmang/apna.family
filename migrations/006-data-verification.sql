-- ============================================
-- Milestone 6: Data Verification Queries
-- ============================================
-- 
-- Run these queries in Supabase Dashboard → SQL Editor
-- to verify data migration completeness and integrity
-- ============================================

-- ============================================
-- 1. Count Records
-- ============================================

-- Count families
SELECT COUNT(*) as family_count FROM families;

-- Count people
SELECT COUNT(*) as people_count FROM people;

-- Count people with full profiles (profile_data is not null/empty)
SELECT COUNT(*) as full_profile_count 
FROM people 
WHERE profile_data IS NOT NULL 
AND profile_data::text != '{}'::text;

-- Count user permissions
SELECT COUNT(*) as permission_count FROM user_permissions;

-- ============================================
-- 2. Check for Missing Family IDs
-- ============================================

-- People without family_id (should be 0 or very few)
SELECT id, first_name, last_name, family_id
FROM people
WHERE family_id IS NULL;

-- ============================================
-- 3. Check Relationships
-- ============================================

-- People with parents
SELECT 
  id,
  first_name,
  last_name,
  array_length(parents, 1) as parent_count
FROM people
WHERE parents IS NOT NULL
AND array_length(parents, 1) > 0
ORDER BY parent_count DESC
LIMIT 10;

-- People with children
SELECT 
  id,
  first_name,
  last_name,
  array_length(children, 1) as child_count
FROM people
WHERE children IS NOT NULL
AND array_length(children, 1) > 0
ORDER BY child_count DESC
LIMIT 10;

-- People with partners
SELECT 
  id,
  first_name,
  last_name,
  array_length(partners, 1) as partner_count
FROM people
WHERE partners IS NOT NULL
AND array_length(partners, 1) > 0
ORDER BY partner_count DESC
LIMIT 10;

-- ============================================
-- 4. Check Data Completeness
-- ============================================

-- Families with head_id
SELECT 
  id,
  display_name,
  head_id,
  CASE 
    WHEN head_id IS NULL THEN 'No head'
    WHEN EXISTS (SELECT 1 FROM people WHERE id = families.head_id) THEN 'Head exists'
    ELSE 'Head missing'
  END as head_status
FROM families;

-- People by family
SELECT 
  family_id,
  COUNT(*) as person_count
FROM people
GROUP BY family_id
ORDER BY person_count DESC;

-- ============================================
-- 5. Check Profile Data
-- ============================================

-- Sample of people with full profiles
SELECT 
  id,
  first_name,
  last_name,
  family_id,
  jsonb_object_keys(profile_data) as profile_keys
FROM people
WHERE profile_data IS NOT NULL
AND profile_data::text != '{}'::text
LIMIT 10;

-- ============================================
-- 6. Check Permissions
-- ============================================

-- All user permissions
SELECT 
  user_email,
  family_id,
  role,
  created_at
FROM user_permissions
ORDER BY created_at DESC;

-- Super admins
SELECT 
  user_email,
  role,
  family_id
FROM user_permissions
WHERE role = 'super_admin'
AND family_id IS NULL;

-- Family admins/editors
SELECT 
  user_email,
  family_id,
  role
FROM user_permissions
WHERE role IN ('admin', 'editor')
ORDER BY family_id, role;

-- ============================================
-- 7. Check for Data Issues
-- ============================================

-- People with invalid family_id (should be 0)
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.family_id
FROM people p
LEFT JOIN families f ON p.family_id = f.id
WHERE p.family_id IS NOT NULL
AND f.id IS NULL;

-- People with invalid parent IDs (check if parents exist)
-- Note: This is a complex query, may need to be run per family
SELECT 
  p.id,
  p.first_name,
  p.family_id,
  unnest(p.parents) as parent_id
FROM people p
WHERE p.parents IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM people p2 
  WHERE p2.id = unnest(p.parents)
)
LIMIT 10;

-- ============================================
-- 8. RLS Policy Verification
-- ============================================

-- Check RLS is enabled
SELECT 
  tablename, 
  rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('families', 'people', 'user_permissions');

-- Count policies
SELECT 
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('families', 'people', 'user_permissions')
GROUP BY tablename;

-- ============================================
-- 9. Sample Data Verification
-- ============================================

-- Get a sample person with all relationships
SELECT 
  id,
  first_name,
  last_name,
  family_id,
  parents,
  children,
  partners,
  dob,
  dod,
  profile_data
FROM people
WHERE (
  (parents IS NOT NULL AND array_length(parents, 1) > 0)
  OR (children IS NOT NULL AND array_length(children, 1) > 0)
  OR (partners IS NOT NULL AND array_length(partners, 1) > 0)
)
AND profile_data IS NOT NULL
LIMIT 5;

-- ============================================
-- 10. Performance Checks
-- ============================================

-- Check indexes exist (should return rows for all tables)
SELECT 
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN ('families', 'people', 'user_permissions')
ORDER BY tablename, indexname;
