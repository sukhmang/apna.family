# Quick OAuth Setup (Fix "Provider Not Enabled" Error)

If you're seeing the error: **"Unsupported provider: provider is not enabled"**, follow these steps:

## Quick Fix: Enable Providers in Supabase

### Step 1: Go to Supabase Dashboard

1. Open your Supabase project (DEV or PRD)
2. Go to **Authentication** → **Providers** (left sidebar)

### Step 2: Enable Google OAuth

1. Find **Google** in the providers list
2. Click to expand it
3. **Toggle ON** "Enable Google provider"
4. You'll see fields for:
   - **Client ID (for OAuth)**
   - **Client Secret (for OAuth)**

### Step 3: Get Google OAuth Credentials

**Option A: Quick Test (Use Supabase's Test Mode)**
- For testing, you can use Supabase's built-in test mode
- Some providers have a "Test" toggle that works without full OAuth setup

**Option B: Full Setup (Recommended)**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services** → **Credentials**
3. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
4. If prompted, configure OAuth consent screen:
   - User Type: **External**
   - App name: **Apna Family**
   - Your email for support
   - Click through to finish
5. Create OAuth Client:
   - Type: **Web application**
   - Name: **Apna Family**
   - **Authorized redirect URIs**: 
     - `https://apna.family/auth/callback` (production - root domain only)
     - `http://localhost:5173/auth/callback` (local dev - root domain only)
     - `http://localhost:5174/auth/callback` (if you use a different port)
   - **Note**: Login is only available on the root domain (`apna.family`), not on subdomains
   - Click **Create**
6. **Copy Client ID and Client Secret**
7. Paste into Supabase Dashboard → Google provider
8. Click **Save**

### Step 4: Enable Microsoft OAuth (Optional)

1. In Supabase Dashboard → **Providers**
2. Find **Azure (Microsoft)**
3. Toggle ON "Enable Azure provider"
4. Follow similar steps as Google (see full guide in `004-oauth-setup-guide.md`)

### Step 5: Configure Site URL

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `https://apna.family`
3. Add **Redirect URLs**:
   - `https://apna.family/auth/callback` (production - root domain only)
   - `http://localhost:5173/auth/callback` (local dev - root domain only)
   - `http://localhost:5174/auth/callback` (if you use a different port)
   - **Note**: Login is only available on the root domain, not on subdomains
4. Click **Save**

### Step 6: Test

1. Refresh your app
2. Click "Sign in with Google"
3. Should redirect to Google login
4. After login, redirects back to your app

---

## Troubleshooting

### Still Getting "Provider Not Enabled"?

1. **Check you're in the right project**: Make sure you're configuring the same Supabase project that your `.env.local` points to
2. **Verify toggle is ON**: The provider toggle must be green/enabled
3. **Check credentials**: Client ID and Secret must be filled in
4. **Save changes**: Click "Save" after entering credentials
5. **Wait a moment**: Sometimes takes a few seconds to propagate

### "redirect_uri_mismatch" Error?

- The redirect URI in Google Cloud Console must **exactly match** what's in Supabase
- Check both places have: `https://apna.family/auth/callback` (production) or `http://localhost:5173/auth/callback` (local dev)
- **Important**: Login is only available on the root domain (`apna.family` or `localhost`), not on subdomains like `grewal.apna.family`

### Testing Without Full OAuth Setup

If you just want to test the app flow without setting up OAuth right now:
- You can skip OAuth setup for now
- The app will work in read-only mode
- You can set up OAuth later when ready

---

## Next Steps

Once OAuth is working:
1. Test login with your email
2. Verify you see "Signed in as [your email]"
3. Proceed to Milestone 5: Permissions & RLS
