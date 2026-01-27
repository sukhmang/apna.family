# OAuth Setup Guide for Milestone 4

This guide walks you through setting up Google and Microsoft OAuth providers in Supabase.

## Prerequisites

- Supabase project created (DEV and PRD)
- Access to Google Cloud Console
- Access to Microsoft Azure Portal (optional, if using Microsoft login)

---

## Step 1: Create Google OAuth App

### 1.1 Go to Google Cloud Console

1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project (or create a new one)
3. Navigate to **APIs & Services** → **Credentials**

### 1.2 Create OAuth 2.0 Client ID

1. Click **+ CREATE CREDENTIALS** → **OAuth client ID**
2. If prompted, configure the OAuth consent screen first:
   - User Type: **External** (unless you have Google Workspace)
   - App name: **Apna Family Network**
   - User support email: Your email
   - Developer contact: Your email
   - Click **Save and Continue**
   - Scopes: Click **Save and Continue** (default scopes are fine)
   - Test users: Add your email, click **Save and Continue**
   - Click **Back to Dashboard**

3. Create OAuth Client:
   - Application type: **Web application**
   - Name: **Apna Family Network**
   - **Authorized redirect URIs**: 
     - `https://apna.family/auth/callback` (production - root domain only)
     - `http://localhost:5173/auth/callback` (local dev - root domain only)
     - `http://localhost:5174/auth/callback` (if you use a different port)
     - **Note**: Login is only available on the root domain (`apna.family`), not on subdomains. This simplifies setup!
   - Click **Create**

4. **Copy the Client ID and Client Secret** - You'll need these for Supabase

---

## Step 2: Create Microsoft Azure App (Optional)

### 2.1 Go to Azure Portal

1. Visit [Azure Portal](https://portal.azure.com/)
2. Navigate to **Azure Active Directory** → **App registrations**
3. Click **+ New registration**

### 2.2 Register Application

1. **Name**: Apna Family Network
2. **Supported account types**: 
   - Choose **Accounts in any organizational directory and personal Microsoft accounts**
3. **Redirect URI**:
   - Platform: **Web**
   - URI: `https://apna.family/auth/callback`
4. Click **Register**

### 2.3 Get Credentials

1. After registration, go to **Overview**
2. **Copy the Application (client) ID** - This is your Client ID
3. Go to **Certificates & secrets** → **+ New client secret**
4. Description: "Supabase OAuth"
5. Expires: Choose expiration (recommend 24 months)
6. Click **Add**
7. **Copy the Value** immediately (you won't see it again) - This is your Client Secret

### 2.4 Configure Redirect URIs

1. Go to **Authentication**
2. Under **Redirect URIs**, add:
   - `https://apna.family/auth/callback` (production - root domain only)
   - `http://localhost:5173/auth/callback` (local dev - root domain only)
   - `http://localhost:5174/auth/callback` (if you use a different port)
   - **Note**: Login is only available on the root domain, not on subdomains. This simplifies setup!
3. Click **Save**

---

## Step 3: Configure Supabase Auth Providers

### 3.1 Configure Google OAuth

1. Go to **Supabase Dashboard** → Your project → **Authentication** → **Providers**
2. Find **Google** in the list
3. Click to expand/enable
4. Toggle **Enable Google provider**
5. Enter:
   - **Client ID (for OAuth)**: Paste your Google Client ID
   - **Client Secret (for OAuth)**: Paste your Google Client Secret
6. Click **Save**

### 3.2 Configure Microsoft OAuth

1. In the same **Providers** page
2. Find **Azure (Microsoft)** in the list
3. Click to expand/enable
4. Toggle **Enable Azure provider**
5. Enter:
   - **Client ID (for OAuth)**: Paste your Azure Application (client) ID
   - **Client Secret (for OAuth)**: Paste your Azure Client Secret value
6. Click **Save**

### 3.3 Configure Site URL (Important!)

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `https://apna.family`
3. Add **Redirect URLs**:
   - `https://apna.family/auth/callback` (production - root domain only)
   - `http://localhost:5173/auth/callback` (local dev - root domain only)
   - `http://localhost:5174/auth/callback` (if you use a different port)
   - **Note**: Login is only available on the root domain, not on subdomains. This simplifies setup!
4. Click **Save**

---

## Step 4: Repeat for PRD Environment

After configuring DEV, repeat all steps for your **PRD** Supabase project:
- Use the same OAuth apps (Google/Microsoft)
- Add PRD redirect URLs to OAuth apps
- Configure PRD Supabase with same credentials

---

## Step 5: Test Authentication

1. Start your dev server: `npm run dev`
2. Navigate to any page
3. Look for "Sign in with Google" / "Sign in with Microsoft" buttons
4. Click to test the OAuth flow
5. Verify you're redirected back and logged in

---

## Troubleshooting

### "redirect_uri_mismatch" Error

- **Cause**: Redirect URI in OAuth app doesn't match Supabase configuration
- **Fix**: 
  - Check redirect URIs in Google Cloud Console / Azure Portal
  - Check redirect URLs in Supabase Dashboard
  - Ensure they match exactly (including http vs https, port numbers)

### "invalid_client" Error

- **Cause**: Client ID or Secret is incorrect
- **Fix**: Double-check credentials in Supabase Dashboard match OAuth app

### Callback Not Working

- **Cause**: Site URL or redirect URLs not configured in Supabase
- **Fix**: Go to Authentication → URL Configuration and verify settings

### Localhost Not Working

- **Cause**: OAuth apps might not allow localhost
- **Fix**: 
  - Add `http://localhost:5173/auth/callback` to OAuth app redirect URIs
  - Add same URL to Supabase redirect URLs
  - For Google: You may need to add localhost as a test user in OAuth consent screen

---

## Notes

- **Development**: Use `http://localhost:5173` for local testing
- **Production**: Use `https://apna.family` and `https://*.apna.family`
- **Security**: Never commit OAuth credentials to git
- **Testing**: You can test with your own Google/Microsoft account first

---

## Next Steps

After OAuth is configured:
1. Test login flow
2. Verify user email appears after login
3. Proceed to Milestone 5: Permissions & RLS
