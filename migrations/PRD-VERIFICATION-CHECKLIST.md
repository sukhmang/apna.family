# PRD Database Verification Checklist

## Current PRD Status

Based on your data:
- ✅ **Families:** 5 families (fann, grewal, mann, virk, wong)
- ✅ **People:** 43 people
- ✅ **User Permissions:** 1 super_admin (sukhman.s.grewal@gmail.com)

## Critical Checks Needed

### 1. ✅ RLS Policies Enabled (CRITICAL)

**Check if RLS is enabled:**
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('families', 'people', 'user_permissions');
```

**Expected:** All 3 tables should have `rowsecurity = true`

**If not enabled, run:**
- File: `migrations/005-rls-policies.sql`
- This enables RLS and creates all security policies

---

### 2. ✅ RLS Policies Created

**Check if policies exist:**
```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('families', 'people', 'user_permissions')
GROUP BY tablename;
```

**Expected:**
- `families`: 3 policies
- `people`: 4 policies
- `user_permissions`: 2 policies

**If missing, run:**
- File: `migrations/005-rls-policies.sql`

---

### 3. ✅ `check_is_super_admin` Function Exists

**Check if function exists:**
```sql
SELECT proname FROM pg_proc 
WHERE proname = 'check_is_super_admin';
```

**Expected:** Function should exist

**If missing, run:**
- File: `migrations/005-rls-policies-complete-fix.sql`
- This creates the function needed to prevent infinite recursion

---

### 4. ✅ Data Counts Match DEV

**Run comparison script:**
```bash
# Set PRD credentials as environment variables first
export PRD_SUPABASE_URL="your-prd-url"
export PRD_SERVICE_ROLE_KEY="your-prd-key"

# Then run comparison
npm run compare-databases
```

**Or manually check:**
```sql
-- In PRD, run:
SELECT COUNT(*) as family_count FROM families;
SELECT COUNT(*) as people_count FROM people;
SELECT COUNT(*) as permission_count FROM user_permissions;

-- Compare to DEV counts
```

---

### 5. ✅ Data Integrity Checks

**Check for missing relationships:**
```sql
-- People with invalid family_id (should be 0)
SELECT p.id, p.first_name, p.family_id
FROM people p
LEFT JOIN families f ON p.family_id = f.id
WHERE p.family_id IS NOT NULL
AND f.id IS NULL;

-- Families with missing head_id person (check if head exists)
SELECT 
  f.id,
  f.display_name,
  f.head_id,
  CASE 
    WHEN f.head_id IS NULL THEN 'No head'
    WHEN EXISTS (SELECT 1 FROM people WHERE id = f.head_id) THEN 'Head exists'
    ELSE 'Head missing'
  END as head_status
FROM families f;
```

---

## Quick Verification SQL

Run this in PRD Supabase Dashboard → SQL Editor to check everything at once:

```sql
-- 1. Check RLS is enabled
SELECT 'RLS Status' as check_type, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('families', 'people', 'user_permissions');

-- 2. Check policies exist
SELECT 'Policy Count' as check_type, tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('families', 'people', 'user_permissions')
GROUP BY tablename;

-- 3. Check function exists
SELECT 'Function Check' as check_type, 
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'check_is_super_admin'
  ) THEN 'Function exists' ELSE 'Function missing' END as status;

-- 4. Check counts
SELECT 'Counts' as check_type, 
  (SELECT COUNT(*) FROM families) as families,
  (SELECT COUNT(*) FROM people) as people,
  (SELECT COUNT(*) FROM user_permissions) as permissions;

-- 5. Check super admin exists
SELECT 'Super Admin' as check_type,
  user_email,
  role,
  family_id
FROM user_permissions
WHERE role = 'super_admin' AND family_id IS NULL;
```

---

## Most Likely Missing Items

Based on typical PRD migrations, you're most likely missing:

1. **RLS Policies** - If you haven't run `005-rls-policies.sql`, your database is not secure
2. **`check_is_super_admin` function** - Needed for RLS to work without infinite recursion

---

## Action Items

1. **Run RLS setup** (if not done):
   - Open PRD Supabase Dashboard → SQL Editor
   - Run: `migrations/005-rls-policies.sql`
   - Verify with queries above

2. **Verify data matches DEV**:
   - Use comparison script or manually check counts
   - Ensure all families and people match

3. **Test authentication**:
   - Try logging in on production
   - Verify permissions work correctly

---

## If Everything Checks Out

If all the above checks pass, your PRD database is ready! The main things to verify are:
- ✅ RLS enabled and policies created
- ✅ Function exists
- ✅ Data counts match DEV
- ✅ Super admin permission exists
