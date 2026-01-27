# Testing OAuth Flow - Step by Step

## Quick Test Checklist

Use this checklist to verify your OAuth setup is working:

### 1. Check Browser Console Logs

1. Open your app at `http://localhost:5173`
2. Open DevTools (F12) → Console tab
3. Click "Sign in with Google"
4. Look for the debug logs (they start with `🔍 OAuth Debug Info`)

**What to look for:**
- ✅ `redirectTo parameter: http://localhost:5173/auth/callback`
- ✅ `redirect_uri` in the OAuth URL matches `http://localhost:5173/auth/callback`
- ❌ If they don't match, that's your problem!

### 2. Check Network Tab

1. Open DevTools → Network tab
2. Click "Sign in with Google"
3. Look for a request to `accounts.google.com` or `supabase.co`
4. Click on the request → Headers or Payload tab
5. Find the `redirect_uri` parameter

**What to check:**
- The `redirect_uri` value should be `http://localhost:5173/auth/callback`
- Compare it to what's in Google Cloud Console

### 3. Verify Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. APIs & Services → Credentials
3. Find your OAuth 2.0 Client ID
4. Check "Authorised redirect URIs"

**Must have BOTH:**
```
https://your-project-id.supabase.co/auth/v1/callback
http://localhost:5173/auth/callback
```

**Important:** The Supabase callback URL (`https://your-project-id.supabase.co/auth/v1/callback`) is what Google actually redirects to first. You can find this URL in:
- Supabase Dashboard → Authentication → Providers → Google
- Look for "Callback URL (for OAuth)" - copy that exact URL

**Common mistakes:**
- ❌ `http://localhost:5173/auth/callback/` (trailing slash)
- ❌ `https://localhost:5173/auth/callback` (https instead of http)
- ❌ `http://127.0.0.1:5173/auth/callback` (IP instead of localhost)

### 4. Verify Supabase Configuration

1. Go to Supabase Dashboard → Authentication → URL Configuration
2. Check "Redirect URLs"

**Must have:**
```
http://localhost:5173/auth/callback
```

### 5. Test Propagation Delay

Google says changes can take "five minutes to a few hours" to propagate:

1. **If you just added/updated redirect URIs:**
   - Wait 5-10 minutes
   - Try again
   - If still not working, wait up to 1 hour

2. **Clear browser cache:**
   - Clear cookies for `localhost`
   - Try in incognito/private window
   - Try a different browser

### 6. Verify OAuth Client Credentials

1. **Google Cloud Console:**
   - Copy Client ID: `YOUR_CLIENT_ID_HERE`
   - Copy Client Secret: `YOUR_CLIENT_SECRET_HERE`

2. **Supabase Dashboard:**
   - Go to Authentication → Providers → Google
   - Verify Client ID matches exactly
   - Verify Client Secret matches exactly
   - Click "Save" if you made changes

### 7. Check OAuth Consent Screen

1. Go to Google Cloud Console → APIs & Services → OAuth consent screen
2. Make sure:
   - App is in "Testing" or "Published" mode
   - Your email is added as a test user (if in Testing mode)
   - App name and details are filled in

---

## Debugging Output Example

When you click "Sign in with Google", you should see:

```
============================================================
🔍 OAuth Debug Info - Google Sign In
============================================================
📍 Current Page Info:
  - Origin: http://localhost:5173
  - Hostname: localhost
  - Port: 5173
  - Protocol: http:
  - Full URL: http://localhost:5173/

🎯 Redirect Configuration:
  - redirectTo parameter: http://localhost:5173/auth/callback
  - Expected in Google Console: http://localhost:5173/auth/callback

✅ Supabase Generated OAuth URL:
  - Full URL: https://your-project-id.supabase.co/auth/v1/authorize?...

📋 URL Breakdown:
  - Base URL: https://your-project-id.supabase.co/auth/v1/authorize
  - Query Params:
    🔴 redirect_uri: http://localhost:5173/auth/callback

⚠️  VERIFICATION CHECK:
  - This redirect_uri must EXACTLY match one in Google Cloud Console
  - Check: https://console.cloud.google.com/apis/credentials
  - Look for: "Authorised redirect URIs" section

✅ Expected in Google Console: http://localhost:5173/auth/callback
🔍 Actual in OAuth URL: http://localhost:5173/auth/callback

✅ MATCH! Redirect URI matches expected value
```

---

## If Still Not Working

### Option 1: Check Network Request

1. Open DevTools → Network tab
2. Filter by "google" or "oauth"
3. Click "Sign in with Google"
4. Find the request to Google
5. Check the `redirect_uri` parameter in the request
6. Compare it to Google Cloud Console

### Option 2: Try Different Port

1. Add `http://localhost:5174/auth/callback` to Google Cloud Console
2. Add `http://localhost:5174/auth/callback` to Supabase
3. Start dev server on port 5174: `npm run dev -- --port 5174`
4. Test from `http://localhost:5174`

### Option 3: Check Supabase Callback URL

In Supabase Dashboard → Authentication → Providers → Google, you'll see:

**Callback URL (for OAuth):**
```
https://your-project-id.supabase.co/auth/v1/callback
```

This is Supabase's callback URL. Google redirects to this first, then Supabase redirects to your app.

**Important:** This Supabase callback URL should also be in Google Cloud Console's "Authorised redirect URIs" if Supabase requires it. However, typically you only need your app's callback URL.

### Option 4: Contact Support

If nothing works:
1. Take screenshots of:
   - Google Cloud Console redirect URIs
   - Supabase redirect URLs
   - Browser console debug output
   - Network tab showing the actual request
2. Check Supabase logs: Dashboard → Logs → Auth Logs
3. Check for any error messages

---

## Quick Fix Checklist

Run through this quickly:

- [ ] Client ID in Supabase matches Google Cloud Console
- [ ] Client Secret in Supabase matches Google Cloud Console
- [ ] `http://localhost:5173/auth/callback` in Google Cloud Console (exact match, no trailing slash)
- [ ] `http://localhost:5173/auth/callback` in Supabase (exact match, no trailing slash)
- [ ] Waited 5-10 minutes after making changes
- [ ] Cleared browser cache/cookies
- [ ] Tried incognito window
- [ ] Checked browser console for debug logs
- [ ] Verified redirect_uri in OAuth URL matches Google Console

If all checked and still not working, the debug logs will show exactly what's being sent!
