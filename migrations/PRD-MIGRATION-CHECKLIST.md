# Production Database Migration Checklist

## Overview

This checklist ensures your **PRD** (Production) Supabase database matches your **DEV** database after migration.

---

## ✅ Step 1: Run Schema Setup

**File:** `migrations/001-schema-setup.sql`

**Action:**
1. Open **PRD** Supabase Dashboard → SQL Editor
2. Copy entire contents of `001-schema-setup.sql`
3. Paste and run
4. Verify tables created: `families`, `people`, `user_permissions`

**Verification:**
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('families', 'people', 'user_permissions');
```

**Expected:** 3 tables should exist

---

## ✅ Step 2: Run Data Migration

**File:** `migrations/002-data-migration.js`

**Action:**
1. Update `.env.local` to point to **PRD**:
   ```env
   VITE_SUPABASE_URL=https://your-prd-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_prd_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_prd_service_role_key_here
   ```
   
   **⚠️ Security Note:** Get these values from your PRD Supabase Dashboard → Settings → API. Never commit actual keys to git.
2. Run migration script:
   ```bash
   npm run migrate-to-supabase
   ```
3. Verify data was migrated

**Verification:**
```sql
-- Count records
SELECT COUNT(*) as family_count FROM families;
SELECT COUNT(*) as people_count FROM people;

-- Should match DEV counts
```

---

## ✅ Step 3: Add Super Admin Permission

**File:** `migrations/003-add-super-admin.sql`

**Action:**
1. Open **PRD** Supabase Dashboard → SQL Editor
2. Update email in script (replace `sukhman.s.grewal@gmail.com` if needed)
3. Copy and run the SQL
4. Verify permission was created

**Verification:**
```sql
SELECT * FROM user_permissions 
WHERE user_email = 'sukhman.s.grewal@gmail.com';
```

**Expected:** 1 row with `role = 'super_admin'` and `family_id IS NULL`

---

## ✅ Step 4: Enable RLS Policies

**File:** `migrations/005-rls-policies.sql`

**Action:**
1. Open **PRD** Supabase Dashboard → SQL Editor
2. Copy entire contents of `005-rls-policies.sql`
3. Paste and run
4. Verify policies were created

**Verification:**
```sql
-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('families', 'people', 'user_permissions');

-- Check policies exist
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('families', 'people', 'user_permissions')
GROUP BY tablename;
```

**Expected:**
- All 3 tables should have `rowsecurity = true`
- `families`: 3 policies
- `people`: 4 policies
- `user_permissions`: 2 policies

---

## ✅ Step 5: Fix RLS Infinite Recursion (If Needed)

**File:** `migrations/005-rls-policies-complete-fix.sql`

**Action:**
1. Only run this if you get "infinite recursion" errors
2. Open **PRD** Supabase Dashboard → SQL Editor
3. Copy and run the fix script
4. Verify function was created

**Verification:**
```sql
SELECT proname FROM pg_proc 
WHERE proname = 'check_is_super_admin';
```

**Expected:** Function should exist

---

## ✅ Step 6: Verify Data Completeness

**File:** `migrations/006-data-verification.sql`

**Action:**
1. Run verification queries from `006-data-verification.sql`
2. Compare results to DEV database
3. Ensure counts match

**Key Checks:**
- Family count matches
- People count matches
- All relationships intact
- No missing family_ids
- Permissions set up correctly

---

## 📊 Quick Comparison Checklist

After running all migrations, verify PRD matches DEV:

- [ ] **Families table:** Same number of families
- [ ] **People table:** Same number of people
- [ ] **User permissions:** Super admin exists
- [ ] **RLS enabled:** All tables have RLS
- [ ] **Policies created:** All policies exist
- [ ] **Data integrity:** No missing relationships
- [ ] **Profile data:** Full profiles migrated correctly

---

## 🔄 Switch Back to DEV

After PRD migration is complete:

1. Update `.env.local` back to **DEV**:
   ```env
   VITE_SUPABASE_URL=https://your-dev-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your_dev_anon_key_here
   SUPABASE_SERVICE_ROLE_KEY=your_dev_service_role_key_here
   ```
   
   **⚠️ Security Note:** Get these values from your DEV Supabase Dashboard → Settings → API. Never commit actual keys to git.

---

## 🧪 Testing PRD

After migration:

1. **Update Vercel environment variables** to point to PRD
2. **Deploy to production**
3. **Test authentication** on `https://apna.family`
4. **Verify data loads** correctly
5. **Test permissions** work

---

## 📝 Migration Order Summary

1. ✅ `001-schema-setup.sql` - Create tables
2. ✅ `002-data-migration.js` - Migrate data (update .env.local first!)
3. ✅ `003-add-super-admin.sql` - Add your permission
4. ✅ `005-rls-policies.sql` - Enable security
5. ✅ `005-rls-policies-complete-fix.sql` - Fix recursion (if needed)
6. ✅ `006-data-verification.sql` - Verify everything

---

## ⚠️ Important Notes

- **Always backup PRD** before running migrations
- **Test in DEV first** before running in PRD
- **Update .env.local** to PRD before running `002-data-migration.js`
- **Switch back to DEV** after PRD migration for local development
- **Verify OAuth redirect URIs** are configured for production domain
