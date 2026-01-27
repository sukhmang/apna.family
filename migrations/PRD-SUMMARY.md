# PRD Database Migration Summary

## ✅ What You Need to Run on PRD

Based on your current PRD database status, here's what still needs to be done:

### Current PRD Status
- ✅ **Families table:** 5 families (fann, grewal, mann, virk, wong) - **DONE**
- ✅ **People table:** Data migrated - **DONE**
- ✅ **User permissions:** 1 super admin - **DONE**
- ❓ **RLS Policies:** Need to verify/enable

---

## 📋 Scripts to Run on PRD

### 1. Enable RLS Policies (REQUIRED)

**File:** `migrations/005-rls-policies.sql`

**Action:**
1. Open **PRD** Supabase Dashboard → SQL Editor
2. Copy entire contents of `005-rls-policies.sql`
3. Paste and run
4. This enables security at the database level

**Why:** Without RLS, anyone with the anon key could edit data. RLS enforces permissions.

---

### 2. Fix RLS Recursion (If Needed)

**File:** `migrations/005-rls-policies-complete-fix.sql`

**Action:**
1. Only run if you get "infinite recursion" errors after step 1
2. Copy and run the fix script
3. This creates a helper function to prevent recursion

**When to run:** Only if you see errors about "infinite recursion detected in policy"

---

## 🧪 Verify DEV and PRD Match

### Run Comparison Script

```bash
npm run compare-databases
```

**Before running:**
1. Make sure `.env.local` has DEV credentials
2. The script will use PRD credentials from the script defaults (or set `PRD_SUPABASE_URL` and `PRD_SERVICE_ROLE_KEY` env vars)

**What it checks:**
- ✅ Record counts (families, people, permissions)
- ✅ Family details match
- ✅ People counts per family match
- ✅ Permissions match

**Expected output:**
```
✅ SUCCESS: DEV and PRD databases match!
```

---

## 📊 Quick Verification Queries

Run these in PRD Supabase Dashboard → SQL Editor to verify:

### Check RLS is Enabled
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('families', 'people', 'user_permissions');
```

**Expected:** All 3 tables should show `rowsecurity = true`

### Check Policies Exist
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

### Check Record Counts
```sql
SELECT 
  (SELECT COUNT(*) FROM families) as families,
  (SELECT COUNT(*) FROM people) as people,
  (SELECT COUNT(*) FROM user_permissions) as permissions;
```

**Compare to DEV:** Should match exactly

---

## 🎯 Summary

**What's Already Done in PRD:**
- ✅ Schema created
- ✅ Data migrated
- ✅ Super admin permission added

**What Still Needs to Be Done:**
- ⏳ Enable RLS policies (`005-rls-policies.sql`)
- ⏳ Fix RLS recursion if needed (`005-rls-policies-complete-fix.sql`)
- ⏳ Verify DEV and PRD match (`npm run compare-databases`)

**Total Time:** ~5 minutes

---

## 🚀 After PRD Migration

1. **Update Vercel environment variables** to PRD Supabase credentials
2. **Deploy to production**
3. **Test OAuth** on `https://apna.family`
4. **Verify everything works** in production

---

## 📝 Files Reference

- `migrations/001-schema-setup.sql` - ✅ Already run in PRD
- `migrations/002-data-migration.js` - ✅ Already run in PRD
- `migrations/003-add-super-admin.sql` - ✅ Already run in PRD
- `migrations/005-rls-policies.sql` - ⏳ **RUN THIS**
- `migrations/005-rls-policies-complete-fix.sql` - ⏳ Run if needed
- `migrations/007-compare-dev-prd.js` - 🧪 **RUN THIS TO VERIFY**
