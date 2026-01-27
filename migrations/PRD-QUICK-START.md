# Quick Start: PRD Database Migration

## 🚀 Quick Migration Steps

Run these scripts in order on your **PRD** Supabase database:

### 1. Schema Setup
```sql
-- Run in PRD Supabase Dashboard → SQL Editor
-- File: migrations/001-schema-setup.sql
```
✅ Creates all tables, indexes, and triggers

### 2. Data Migration
```bash
# Update .env.local to PRD credentials first!
# Then run:
npm run migrate-to-supabase
```
✅ Migrates all families and people from JSON to PRD database

### 3. Add Super Admin
```sql
-- Run in PRD Supabase Dashboard → SQL Editor
-- File: migrations/003-add-super-admin.sql
-- Update email to your email before running
```
✅ Adds your super admin permission

### 4. Enable RLS
```sql
-- Run in PRD Supabase Dashboard → SQL Editor
-- File: migrations/005-rls-policies.sql
```
✅ Enables Row Level Security and creates policies

### 5. Fix RLS (If Needed)
```sql
-- Only run if you get "infinite recursion" errors
-- File: migrations/005-rls-policies-complete-fix.sql
```
✅ Fixes RLS recursion issue

---

## ✅ Verify Migration

After running all scripts, compare DEV and PRD:

```bash
# Set PRD credentials as environment variables or update script defaults
npm run compare-databases
```

This will show:
- Record counts (families, people, permissions)
- Family details comparison
- People by family comparison
- Permissions comparison

---

## 📋 Current PRD Status

Based on your PRD database:

✅ **Families:** 5 families (fann, grewal, mann, virk, wong)  
✅ **People:** Migrated (check count matches DEV)  
✅ **Permissions:** 1 super admin (sukhman.s.grewal@gmail.com)  

**Next Steps:**
1. Verify RLS is enabled
2. Run comparison script to ensure DEV and PRD match
3. Test authentication in production

---

## 🔄 After Migration

1. **Update Vercel environment variables** to PRD
2. **Deploy to production**
3. **Test OAuth** on `https://apna.family`
4. **Verify data loads** correctly
