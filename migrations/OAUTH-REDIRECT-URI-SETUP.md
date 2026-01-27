# OAuth Redirect URI Setup Guide

## Understanding the Redirect URI

The app uses **dynamic redirect URIs** based on `window.location.origin`. This means:
- From `http://grewal.localhost:5173` → redirects to `http://grewal.localhost:5173/auth/callback`
- From `http://wong.localhost:5174` → redirects to `http://wong.localhost:5174/auth/callback`
- From `https://grewal.apna.family` → redirects to `https://grewal.apna.family/auth/callback`

**You don't need to hardcode specific subdomains** - the code handles that automatically!

However, you **do need to register** the redirect URI patterns in:
1. Google Cloud Console (OAuth client)
2. Supabase Dashboard (URL Configuration)

---

## Recommended Setup

### Google Cloud Console

**⚠️ Important**: Google **does NOT support wildcards** (`*`) in redirect URIs. You must add each subdomain explicitly.

**Add these redirect URIs:**

```
Production (add each family subdomain):
https://apna.family/auth/callback
https://grewal.apna.family/auth/callback
https://wong.apna.family/auth/callback
https://fann.apna.family/auth/callback
https://mann.apna.family/auth/callback
https://virk.apna.family/auth/callback
(Add more as you add families)

Local Development:
http://localhost:5173/auth/callback
http://grewal.localhost:5173/auth/callback
http://wong.localhost:5173/auth/callback
http://fann.localhost:5173/auth/callback
http://mann.localhost:5173/auth/callback
http://virk.localhost:5173/auth/callback
(Add more subdomains as needed)
```

**For different ports**, add each subdomain for that port:
- `http://localhost:5174/auth/callback`
- `http://grewal.localhost:5174/auth/callback`
- `http://wong.localhost:5174/auth/callback`
- etc.

**Tip**: When you add a new family, remember to add its redirect URI here too!

### Supabase Dashboard

**Advantage**: Supabase supports better wildcards!

**Add these redirect URLs:**

```
Production:
https://apna.family/auth/callback
https://*.apna.family/auth/callback

Local Development (wildcard covers everything):
http://*.localhost:*/auth/callback  ← This covers ALL subdomains and ALL ports!
```

**Alternative** (if wildcard doesn't work):
- Add specific ports like Google: `http://*.localhost:5173/auth/callback`, etc.

---

## Quick Setup Checklist

### Google Cloud Console (No Wildcards Allowed!)
- [ ] `https://apna.family/auth/callback` (production root)
- [ ] `https://grewal.apna.family/auth/callback` (production subdomain)
- [ ] `https://wong.apna.family/auth/callback` (production subdomain)
- [ ] Add other families as needed (fann, mann, virk, etc.)
- [ ] `http://localhost:5173/auth/callback` (local root)
- [ ] `http://grewal.localhost:5173/auth/callback` (local subdomain)
- [ ] `http://wong.localhost:5173/auth/callback` (local subdomain)
- [ ] Add other local subdomains as needed
- [ ] If using different ports, add each subdomain for that port too

### Supabase Dashboard
- [ ] `https://apna.family/auth/callback`
- [ ] `https://*.apna.family/auth/callback`
- [ ] `http://*.localhost:*/auth/callback` (wildcard for all localhost)

---

## How It Works

1. **User clicks "Sign in with Google"** from `http://grewal.localhost:5173/baljit`
2. **Code generates redirect URI**: `http://grewal.localhost:5173/auth/callback` (from `window.location.origin`)
3. **Google checks**: Is `http://grewal.localhost:5173/auth/callback` in the authorized list?
   - ✅ If `http://grewal.localhost:5173/auth/callback` is registered → **Matches!**
   - ❌ If not registered → **Error: redirect_uri_mismatch** (Google doesn't support wildcards)
4. **After login**: Google redirects to `http://grewal.localhost:5173/auth/callback`
5. **Supabase checks**: Is this URL in the allowed list?
   - ✅ If `http://*.localhost:*/auth/callback` is registered → **Matches!**
6. **App processes callback**: User is logged in

---

## Testing Different Ports

If you start the dev server on a different port (e.g., `npm run dev` uses port 5175):

1. **Add to Google Cloud Console** (no wildcards!):
   - `http://localhost:5175/auth/callback`
   - `http://grewal.localhost:5175/auth/callback`
   - `http://wong.localhost:5175/auth/callback`
   - (Add each subdomain you use)

2. **Supabase wildcard should already cover it** if you used `http://*.localhost:*/auth/callback`

---

## Summary

- ✅ **No hardcoding in code** - code uses `window.location.origin` (dynamic)
- ⚠️ **Google limitation** - **No wildcards allowed at all!** Must add each subdomain explicitly
- ✅ **Supabase advantage** - Can use `*.localhost:*` wildcard to cover everything
- 📝 **Action required** - Add each family subdomain to Google Cloud Console as you use them
