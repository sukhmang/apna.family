# OAuth Setup: Root Domain Only

## Important: Login is Only Available on Root Domain

**Login and data management is only available on the root domain:**
- ✅ `https://apna.family` (production)
- ✅ `http://localhost:5173` (local dev)
- ❌ `https://grewal.apna.family` (no login button)
- ❌ `http://grewal.localhost:5173` (no login button)

This simplifies OAuth setup significantly - you only need to register redirect URIs for the root domain!

---

## Simplified Redirect URI Setup

### Google Cloud Console

**Add these redirect URIs (only root domain):**

```
Production:
https://apna.family/auth/callback

Local Development:
http://localhost:5173/auth/callback
http://localhost:5174/auth/callback  (if you use a different port)
```

**That's it!** No need to add subdomain redirect URIs.

### Supabase Dashboard

**Add these redirect URLs:**

```
Production:
https://apna.family/auth/callback

Local Development:
http://localhost:5173/auth/callback
http://localhost:5174/auth/callback  (if you use a different port)
```

---

## How It Works

1. **User visits root domain** (`apna.family`)
2. **Sees login section** on the landing page
3. **Clicks "Sign in with Google"**
4. **Redirects to** `https://apna.family/auth/callback` after login
5. **User can then navigate** to any subdomain (`grewal.apna.family`) and their session persists
6. **On subdomains**, no login button is shown (users must log in from root domain first)

---

## Benefits

✅ **Simpler OAuth setup** - Only need root domain redirect URIs  
✅ **Centralized authentication** - All login happens in one place  
✅ **Easier to manage** - No need to add redirect URIs for each family subdomain  
✅ **Better UX** - Clear place for users to log in  

---

## Testing

1. Visit `http://localhost:5173` (or `https://apna.family` in production)
2. You should see the "Admin Access" section with login buttons
3. Visit `http://grewal.localhost:5173` (or `https://grewal.apna.family`)
4. You should **NOT** see login buttons in the navbar
5. If you're logged in from root domain, your session persists on subdomains
