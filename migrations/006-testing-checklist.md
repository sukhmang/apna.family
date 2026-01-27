# Milestone 6: Testing & Validation Checklist

## Overview

This checklist ensures all functionality works correctly after the migration from JSON to Supabase. Test systematically and check off each item.

---

## 🏠 Root Domain Testing (`apna.family` or `localhost:5173`)

### Landing Page
- [ ] Page loads without errors
- [ ] "Apna Family Network" title displays
- [ ] Subtitle "Connecting families through shared memories and stories" displays
- [ ] Family tree visualization loads (or list view)
- [ ] All families are listed/visible
- [ ] Tree controls (view toggle, language toggle, zoom) work
- [ ] Clicking on a person in the tree navigates correctly
- [ ] No console errors

### Authentication (Root Domain Only)
- [ ] "Admin Access" section is visible
- [ ] "Sign in with Google" button is visible
- [ ] "Sign in with Microsoft" button is visible
- [ ] Clicking Google login redirects to Google OAuth
- [ ] After login, redirects back to app
- [ ] "Signed in as [email]" displays
- [ ] "Can Edit" badge shows (if you have permissions)
- [ ] "Sign Out" button works
- [ ] Auth state persists after page refresh
- [ ] No console errors during auth flow

### Navigation
- [ ] Breadcrumb shows "Home" link
- [ ] Clicking "Home" stays on root domain
- [ ] Navbar displays correctly

---

## 👨‍👩‍👧‍👦 Family Portal Testing (`grewal.apna.family` or `grewal.localhost:5173`)

### Family Landing Page
- [ ] Page loads without errors
- [ ] Family name displays correctly (e.g., "The Grewals")
- [ ] Family description displays (if available)
- [ ] Family tree displays only family members (cluster optimization)
- [ ] Theme colors are applied correctly
- [ ] Family-specific theme matches database
- [ ] No console errors

### Navigation
- [ ] Breadcrumb shows: Home → Family Name
- [ ] Clicking "Home" navigates to root domain
- [ ] Clicking family name stays on family page
- [ ] Navbar displays correctly

### Authentication (Subdomain)
- [ ] **No login buttons visible** (login only on root domain)
- [ ] If logged in from root, session persists on subdomain
- [ ] "Can Edit" badge shows if you have family permissions

---

## 👤 Person/Memorial Page Testing (`grewal.apna.family/baljit`)

### Page Load
- [ ] Page loads without errors
- [ ] Person name displays correctly
- [ ] Portrait image displays (if available)
- [ ] No console errors

### Profile Section
- [ ] Full name displays
- [ ] Birth date displays (if available)
- [ ] Death date displays (if available)
- [ ] Location displays (if available)
- [ ] Biography/description displays (if available)
- [ ] All profile data from `profile_data` JSONB displays correctly

### Memories Section
- [ ] Videos display (if available)
- [ ] Stories display (if available)
- [ ] Video thumbnails load
- [ ] Clicking video opens lightbox/player
- [ ] Stories are formatted correctly

### Gallery Section
- [ ] Gallery images load
- [ ] Images are filtered by personId correctly
- [ ] Clicking image opens lightbox
- [ ] Gallery navigation works

### Events Section (if available)
- [ ] Events display correctly
- [ ] Event dates format correctly
- [ ] Event descriptions display

### Navigation
- [ ] Breadcrumb shows: Home → Family → Person Name
- [ ] Navbar section navigation works (Profile, Memories, Gallery)
- [ ] Portrait appears in navbar when scrolled
- [ ] Active section indicator works

---

## 🎥 Video Vault Testing (`grewal.apna.family/homevideos`)

- [ ] Page loads without errors
- [ ] Video grid displays
- [ ] Videos are filtered by family
- [ ] Password protection works (if enabled)
- [ ] Video thumbnails load
- [ ] Clicking video opens player
- [ ] No console errors

---

## 🔐 Authentication & Permissions Testing

### Login Flow
- [ ] Google OAuth works from root domain
- [ ] Microsoft OAuth works from root domain (if configured)
- [ ] Redirect URI is correct (no mismatch errors)
- [ ] Auth callback route works (`/auth/callback`)
- [ ] User session persists across page refreshes
- [ ] User session persists across subdomains

### Permission Display
- [ ] Super admin sees "Can Edit" badge on root domain
- [ ] Super admin sees "Can Edit" badge on all subdomains
- [ ] Family admin sees "Can Edit" badge on their family subdomain
- [ ] Family admin does NOT see "Can Edit" on other families
- [ ] Regular user (no permissions) does NOT see "Can Edit"

### RLS Enforcement (Database Level)
- [ ] Super admin can read all data ✅
- [ ] Super admin can edit all data ✅
- [ ] Family admin can read all data ✅
- [ ] Family admin can edit only their family ✅
- [ ] Family admin CANNOT edit other families ❌ (RLS blocks)
- [ ] Regular user can read all data ✅
- [ ] Regular user CANNOT edit any data ❌ (RLS blocks)

**Test RLS by trying to edit in Supabase Dashboard:**
1. Sign in as super admin → Try editing a person → Should work
2. Sign in as regular user → Try editing a person → Should fail with RLS error

---

## ⚡ Performance Testing

### Load Times
- [ ] Root domain loads in < 2 seconds
- [ ] Family portal loads in < 2 seconds
- [ ] Person page loads in < 2 seconds
- [ ] Video vault loads in < 2 seconds

**How to test:**
1. Open DevTools → Network tab
2. Clear cache (Cmd/Ctrl + Shift + R)
3. Load page and check "Load" time
4. Compare to previous JSON version (should be similar)

### Caching
- [ ] Navigating between pages uses cache (faster on second visit)
- [ ] Cache expires after 5 minutes (check `CACHE_TTL` in `treeLoader.js`)
- [ ] Cache works per familyId (different families have separate cache)

**How to test:**
1. Load a page (note the time)
2. Navigate away and back
3. Second load should be faster (from cache)
4. Wait 5+ minutes, reload → should fetch fresh data

### Network Requests
- [ ] No unnecessary duplicate requests
- [ ] Requests are optimized (only fetch needed data)
- [ ] Family cluster optimization works (only fetch family members)

**How to test:**
1. Open DevTools → Network tab
2. Filter by "supabase" or "rest"
3. Check that requests are minimal and efficient

---

## 📊 Data Integrity Testing

### Data Completeness
- [ ] All families from JSON are in database
- [ ] All people from JSON are in database
- [ ] All full profiles from JSON are in database
- [ ] No missing data

**How to verify:**
1. Count families in Supabase Dashboard
2. Count people in Supabase Dashboard
3. Compare to original JSON files
4. Spot check a few records manually

### Relationships
- [ ] Parent-child relationships display correctly
- [ ] Partner relationships display correctly
- [ ] Family relationships are correct
- [ ] No broken relationship links
- [ ] Family tree visualization shows correct connections

**How to verify:**
1. Check a person with known parents → parents should display
2. Check a person with known children → children should display
3. Check a person with known partners → partners should display
4. Verify family tree graph shows correct connections

### Data Format
- [ ] Dates format correctly
- [ ] JSONB data (profile_data) displays correctly
- [ ] Arrays (parents, children, partners) work correctly
- [ ] Theme colors are correct
- [ ] Settings are correct

---

## 🐛 Error Handling Testing

### Console Errors
- [ ] No JavaScript errors in console
- [ ] No React warnings
- [ ] No network errors (404s, 500s)
- [ ] No Supabase client errors

**How to check:**
1. Open DevTools → Console tab
2. Load each page type
3. Navigate between pages
4. Check for any red errors

### Error Boundaries
- [ ] ErrorBoundary catches errors gracefully
- [ ] Error messages are user-friendly
- [ ] App doesn't crash on errors

### Network Failures
- [ ] App handles Supabase connection errors gracefully
- [ ] Loading states display correctly
- [ ] Error messages are shown to user

---

## 🌐 Production Readiness

### Environment Variables
- [ ] Production Supabase URL is set
- [ ] Production Supabase anon key is set
- [ ] OAuth redirect URIs are configured for production
- [ ] Environment variables are set in Vercel

### Production URLs
- [ ] `https://apna.family` works
- [ ] `https://grewal.apna.family` works
- [ ] `https://wong.apna.family` works
- [ ] All subdomains work correctly

### OAuth in Production
- [ ] Google OAuth works in production
- [ ] Microsoft OAuth works in production (if configured)
- [ ] Redirect URIs are correct for production domain
- [ ] Auth callback works in production

### Performance in Production
- [ ] Production load times are acceptable
- [ ] No performance regressions
- [ ] CDN caching works (if applicable)

---

## 📝 Data Migration Verification

### Spot Checks
- [ ] Pick 3 random families → Verify all data matches JSON
- [ ] Pick 5 random people → Verify all data matches JSON
- [ ] Check a person with full profile → Verify profile_data is complete
- [ ] Check a person with minimal profile → Verify basic data is correct

### Edge Cases
- [ ] People without explicit familyId → Verify family_id was inferred correctly
- [ ] People with complex relationships → Verify all relationships work
- [ ] Families without head_id → Verify app handles gracefully
- [ ] Empty/null fields → Verify app handles gracefully

---

## ✅ Final Checklist

### Must Pass
- [ ] All pages load without errors
- [ ] All functionality works as before
- [ ] Authentication works
- [ ] Permissions work correctly
- [ ] RLS policies enforce security
- [ ] No data loss
- [ ] Performance is acceptable

### Nice to Have
- [ ] Performance is better than JSON version
- [ ] All edge cases handled
- [ ] Production deployment successful

---

## 🐛 Bug Reporting Template

If you find any issues, document them:

```
**Page:** [Root / Family / Person / Video Vault]
**URL:** [exact URL]
**Issue:** [description]
**Steps to Reproduce:**
1. 
2. 
3. 
**Expected:** [what should happen]
**Actual:** [what actually happens]
**Console Errors:** [any errors from console]
**Screenshot:** [if applicable]
```

---

## 🎉 Success Criteria

Milestone 6 is complete when:
- ✅ All functional tests pass
- ✅ Performance is acceptable (< 2s load times)
- ✅ No console errors
- ✅ Authentication works in production
- ✅ Permissions enforced correctly
- ✅ Data integrity verified
- ✅ Ready for family members to use

---

## Next Steps After Testing

1. **If all tests pass:** Proceed to production deployment
2. **If issues found:** Document and fix before production
3. **Optional cleanup:** Archive or delete old JSON files (see cleanup section in IMPLEMENTATION_GUIDE.md)
