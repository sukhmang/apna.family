# PRD Database Final Verification

## ✅ What You've Completed

Based on your confirmation:
- ✅ **RLS Policies:** Enabled (`005-rls-policies.sql` run)
- ✅ **Helper Function:** `check_is_super_admin` exists
- ✅ **Data:** 5 families, 43 people, 1 super_admin permission

---

## 🔍 Final Verification Steps

Run these SQL queries in **PRD Supabase Dashboard → SQL Editor** to confirm everything is set up correctly:

### 1. Verify RLS is Enabled on All Tables

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('families', 'people', 'user_permissions')
ORDER BY tablename;
```

**Expected Output:**
```
tablename          | rowsecurity
-------------------+-------------
families           | true
people              | true
user_permissions    | true
```

---

### 2. Verify All Policies Are Created

```sql
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('families', 'people', 'user_permissions')
GROUP BY tablename
ORDER BY tablename;
```

**Expected Output:**
```
tablename          | policy_count
-------------------+-------------
families           | 3
people             | 4
user_permissions   | 2
```

---

### 3. Verify Function Works

```sql
-- Test the function (should return false for NULL, true for super admin email)
SELECT 
  check_is_super_admin(NULL) as null_test,
  check_is_super_admin('sukhman.s.grewal@gmail.com') as super_admin_test;
```

**Expected Output:**
```
null_test | super_admin_test
----------+------------------
false     | true
```

---

### 4. Verify Data Counts

```sql
SELECT 
  'Families' as table_name,
  COUNT(*) as count
FROM families
UNION ALL
SELECT 
  'People' as table_name,
  COUNT(*) as count
FROM people
UNION ALL
SELECT 
  'User Permissions' as table_name,
  COUNT(*) as count
FROM user_permissions;
```

**Expected Output (should match your data):**
```
table_name        | count
------------------+------
Families          | 5
People            | 43
User Permissions  | 1
```

---

### 5. Verify Super Admin Permission

```sql
SELECT 
  user_email,
  role,
  family_id,
  created_at
FROM user_permissions
WHERE role = 'super_admin';
```

**Expected Output:**
```
user_email                | role         | family_id | created_at
--------------------------+--------------+-----------+----------------------------
sukhman.s.grewal@gmail.com| super_admin  | null      | 2026-01-27 07:35:55+00
```

---

### 6. Test RLS Policies (Optional - Advanced)

If you want to test that RLS is working:

```sql
-- This should work (public read)
SELECT COUNT(*) FROM families;

-- This should work (public read)
SELECT COUNT(*) FROM people;

-- This should work (you can see your own permissions)
SELECT * FROM user_permissions 
WHERE user_email = 'sukhman.s.grewal@gmail.com';
```

---

## ✅ If All Checks Pass

If all the above queries return the expected results, your PRD database is **fully configured and secure**!

### What This Means:
- ✅ **Security:** RLS is enabled, preventing unauthorized access
- ✅ **Permissions:** Super admin can manage everything
- ✅ **Data:** All families and people are migrated
- ✅ **Functionality:** Database is ready for production use

---

## 🚀 Next Steps

1. **Update Vercel Environment Variables:**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Update `VITE_SUPABASE_URL` to PRD URL
   - Update `VITE_SUPABASE_ANON_KEY` to PRD anon key
   - **Keep `SUPABASE_SERVICE_ROLE_KEY` as DEV** (only used for migrations)

2. **Deploy to Production:**
   - Push your code to main branch
   - Vercel will auto-deploy
   - Or manually trigger a deployment

3. **Test Production:**
   - Visit `https://apna.family`
   - Test login with Google OAuth
   - Verify data loads correctly
   - Test that you can see/edit data (as super admin)

4. **Switch Local Back to DEV:**
   - Update `.env.local` back to DEV credentials
   - This ensures local development uses DEV database

---

## 📝 Summary

**PRD Database Status:**
- ✅ Schema created
- ✅ Data migrated (5 families, 43 people)
- ✅ Super admin permission added
- ✅ RLS policies enabled
- ✅ Security function created

**Your PRD database is ready for production!** 🎉
