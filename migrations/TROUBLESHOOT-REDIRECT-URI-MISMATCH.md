# Troubleshooting: redirect_uri_mismatch Error

## Quick Checklist

If you're getting `Error 400: redirect_uri_mismatch`, check these in order:

### 1. ✅ Verify Redirect URIs Match Exactly

**Important:** Supabase uses a two-step redirect flow:
1. Google redirects to Supabase's callback URL first
2. Then Supabase redirects to your app's callback URL

**Google Cloud Console:**
- Go to [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials
- Find your OAuth 2.0 Client ID
- Check "Authorised redirect URIs" section
- Must have BOTH:
  - `https://nncmnnwyummsrgosrroy.supabase.co/auth/v1/callback` (Supabase's callback - **REQUIRED**)
  - `http://localhost:5173/auth/callback` (Your app's callback - for local dev)

**Supabase Dashboard:**
- Go to Authentication → URL Configuration
- Check "Redirect URLs" section
- Must have: `http://localhost:5173/auth/callback` (exact match, no trailing slash)

**Both must match exactly:**
- Same protocol (`http` vs `https`)
- Same hostname (`localhost` vs `127.0.0.1`)
- Same port (`5173`)
- Same path (`/auth/callback`)
- No trailing slashes

### 2. ✅ Verify OAuth Client Credentials Match

**Critical:** The Client ID and Client Secret in Supabase must match the ones in Google Cloud Console.

**Check Supabase:**
1. Go to Authentication → Providers → Google
2. Note the Client ID shown there

**Check Google Cloud Console:**
1. Go to APIs & Services → Credentials
2. Find your OAuth 2.0 Client ID
3. Compare the Client ID

**They must be identical!** If they don't match:
- Copy the Client ID from Google Cloud Console
- Copy the Client Secret from Google Cloud Console
- Paste both into Supabase Dashboard → Authentication → Providers → Google
- Click "Save"

### 3. ✅ Check Browser Console for Actual Redirect URI

1. Open browser DevTools (F12)
2. Go to Console tab
3. Click "Sign in with Google"
4. Look for the debug logs (they start with 🔍)
5. Check what redirect URI is actually being sent

The logs will show:
- `Current origin:` - Should be `http://localhost:5173`
- `Redirect URI:` - Should be `http://localhost:5173/auth/callback`
- `Redirect URI sent to Google:` - This is what Google actually receives

### 4. ✅ Clear Browser Cache and Cookies

Sometimes Google caches old redirect URI configurations:

1. Clear browser cache for `localhost`
2. Clear cookies for `localhost`
3. Try in an incognito/private window
4. Try a different browser

### 5. ✅ Wait for Propagation

Google says changes can take "five minutes to a few hours" to propagate:

1. After adding/updating redirect URIs in Google Cloud Console
2. Wait at least 5-10 minutes
3. Try again

### 6. ✅ Verify Supabase Project URL

Make sure your `.env.local` points to the correct Supabase project:

```bash
# Check which Supabase project you're using
grep VITE_SUPABASE_URL .env.local
```

The Supabase project URL should match the one where you configured:
- OAuth providers (Google Client ID/Secret)
- Redirect URLs

### 7. ✅ Check OAuth Consent Screen

1. Go to Google Cloud Console → APIs & Services → OAuth consent screen
2. Make sure your app is in "Testing" or "Published" mode
3. If in "Testing", add your email as a test user
4. Make sure the app name and other details are filled in

### 8. ✅ Verify No Typos

Common typos:
- `http://localhost:5173/auth/callback` ✅
- `http://localhost:5173/auth/callback/` ❌ (trailing slash)
- `https://localhost:5173/auth/callback` ❌ (https instead of http)
- `http://127.0.0.1:5173/auth/callback` ❌ (IP instead of localhost)
- `http://localhost:5173/auth/callbacks` ❌ (plural)

### 9. ✅ Check Network Tab

1. Open DevTools → Network tab
2. Click "Sign in with Google"
3. Look for the OAuth request
4. Check the `redirect_uri` parameter in the request
5. Compare it to what's in Google Cloud Console

---

## Most Common Fix

**90% of the time, the issue is:**

1. **OAuth Client ID/Secret mismatch** between Supabase and Google Cloud Console
   - Fix: Copy credentials from Google Cloud Console → Paste into Supabase Dashboard → Save

2. **Redirect URI not added to Google Cloud Console**
   - Fix: Add `http://localhost:5173/auth/callback` to "Authorised redirect URIs"

3. **Typo or mismatch** (trailing slash, http vs https, etc.)
   - Fix: Check both places have exact same URI

---

## Still Not Working?

If you've checked all of the above:

1. **Check the browser console logs** - The debug logs will show exactly what redirect URI is being sent
2. **Try a different port** - Add `http://localhost:5174/auth/callback` to both places and test
3. **Check Supabase logs** - Go to Supabase Dashboard → Logs → Auth Logs to see if there are any errors
4. **Verify the OAuth flow** - The redirect URI should be `http://localhost:5173/auth/callback` (no modifications)

---

## Debug Output Example

When you click "Sign in with Google", you should see in the console:

```
🔍 OAuth Debug Info:
  - Current origin: http://localhost:5173
  - Redirect URI: http://localhost:5173/auth/callback
  - Full URL: http://localhost:5173/
  - Supabase OAuth URL: https://nncmnnwyummsrgosrroy.supabase.co/auth/v1/authorize?...
  - Redirect URI sent to Google: http://localhost:5173/auth/callback
  - ⚠️  Does this match your Google Cloud Console config?
```

If the "Redirect URI sent to Google" doesn't match what's in Google Cloud Console, that's your problem!
