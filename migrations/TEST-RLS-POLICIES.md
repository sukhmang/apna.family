# Testing RLS Policies

## Quick Verification

After running `005-rls-policies.sql`, verify that RLS is working correctly:

### 1. Check RLS is Enabled

Run this in Supabase Dashboard → SQL Editor:

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('families', 'people', 'user_permissions');
```

**Expected Result:**
- All three tables should show `rowsecurity = true`

### 2. Check Policies are Created

```sql
SELECT tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('families', 'people', 'user_permissions')
ORDER BY tablename, policyname;
```

**Expected Result:**
- `families`: 3 policies (SELECT, UPDATE, ALL)
- `people`: 4 policies (SELECT, UPDATE, INSERT, DELETE)
- `user_permissions`: 2 policies (SELECT, ALL)

### 3. Test Public Read Access (Unauthenticated)

1. Sign out of the app
2. Visit any page (root domain or family subdomain)
3. **Expected:** Data should still load (public read access works)

### 4. Test Super Admin Edit Access

1. Sign in as super admin
2. Verify you see "Can Edit" badge
3. **Expected:** You should be able to edit any family/person data

### 5. Test RLS Blocks Unauthorized Edits

**Option A: Using Supabase Dashboard (Easiest)**

1. Go to Supabase Dashboard → Table Editor → `people`
2. Try to edit a row (change a name, etc.)
3. **Expected:** If you're logged in as super_admin, edit should work
4. If you're not logged in or don't have permission, you should get an error

**Option B: Using Browser Console**

1. Open browser console (F12)
2. Sign in as super admin
3. Run this test query:
   ```javascript
   // This should work (you're super admin)
   const { data, error } = await supabase
     .from('people')
     .update({ first_name: 'Test' })
     .eq('id', 'some-person-id')
     .select()
   
   console.log('Update result:', { data, error })
   ```
4. **Expected:** Update should succeed (no RLS error)

### 6. Test Regular User Cannot Edit

1. Create a test user permission (or use a different account):
   ```sql
   -- This user has NO permissions
   -- They should NOT be able to edit
   ```
2. Sign in with that user
3. Try to edit data
4. **Expected:** RLS should block the edit, you should see an error in console

---

## Common Issues

### "new row violates row-level security policy"

**Cause:** RLS policy is blocking the operation

**Fix:**
- Check that user has correct permission in `user_permissions` table
- Verify the RLS policy logic matches your permission structure
- Check that `auth.jwt() ->> 'email'` matches the user's email

### "permission denied for table"

**Cause:** RLS is enabled but no policy allows the operation

**Fix:**
- Verify policies are created (run the check query above)
- Check that policies cover the operation you're trying (SELECT, INSERT, UPDATE, DELETE)

### Policies not working

**Cause:** Policies might not be created correctly

**Fix:**
- Re-run `005-rls-policies.sql`
- Check for any errors in the SQL execution
- Verify policies exist using the check query above

---

## Next Steps

Once RLS is verified:
- ✅ Milestone 5 is complete!
- ✅ Move to Milestone 6: Testing & Validation
- ✅ Test all functionality end-to-end
- ✅ Verify performance is acceptable
