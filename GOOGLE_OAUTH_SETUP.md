# 🔧 Google OAuth Setup Guide

## ✅ Code Fix Applied

I've updated the Google sign-in to properly handle the `returnTo` parameter.

**What changed**:
```typescript
// Before (❌)
redirectTo: `${window.location.origin}/auth/callback`

// After (✅)
redirectTo: `${window.location.origin}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`
```

Now when users sign in with Google, they'll be redirected to the correct page after authentication.

---

## 🔑 Supabase Google OAuth Configuration

For Google authentication to work, you need to configure it in Supabase:

### Step 1: Go to Supabase Dashboard

1. Open [https://supabase.com](https://supabase.com)
2. Select your **charanorganics** project
3. Click **Authentication** in the left sidebar
4. Click **Providers** tab

### Step 2: Enable Google Provider

1. Find **Google** in the list of providers
2. Toggle it **ON** (enabled)
3. You'll see fields for:
   - **Client ID** (from Google Cloud Console)
   - **Client Secret** (from Google Cloud Console)

### Step 3: Get Google OAuth Credentials

If you don't have Google OAuth credentials yet:

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project (or select existing)
3. Go to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth 2.0 Client ID**
5. Configure OAuth consent screen if prompted
6. Application type: **Web application**
7. Add **Authorized redirect URIs**:
   ```
   https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
   ```
   
   **Find your project ref**:
   - In Supabase dashboard, go to Settings → API
   - Look for "Project URL": `https://xxxxx.supabase.co`
   - The `xxxxx` part is your project ref

8. Click **Create**
9. Copy the **Client ID** and **Client Secret**

### Step 4: Add Credentials to Supabase

1. Back in Supabase → Authentication → Providers → Google
2. Paste the **Client ID**
3. Paste the **Client Secret**
4. Click **Save**

### Step 5: Configure Redirect URLs

In Supabase → Authentication → URL Configuration:

1. **Site URL**: `http://localhost:3000` (for development)
2. **Redirect URLs**: Add these:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/**
   ```

For production, add:
```
https://yourdomain.com/auth/callback
https://yourdomain.com/**
```

---

## 🧪 Test Google OAuth

### Test Flow:

1. **Open** `http://localhost:3000`
2. **Click "Profile"** (while logged out)
3. **Should redirect to** `/login?returnTo=/account`
4. **Click "Continue with Google"**
5. **Google popup appears** → Select your Google account
6. **Authorize the app**
7. **Redirects to** `/auth/callback?code=xxx&returnTo=/account`
8. **Callback exchanges code** → Sets session
9. **Redirects to** `/account` ✅
10. **You're logged in!** 🎉

---

## 🐛 Troubleshooting

### Issue: "Invalid redirect URL"

**Cause**: The redirect URL in Google Cloud Console doesn't match Supabase's callback URL.

**Fix**:
1. Go to Google Cloud Console → Credentials
2. Edit your OAuth 2.0 Client ID
3. Add the correct redirect URI:
   ```
   https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
   ```

### Issue: "OAuth provider not enabled"

**Cause**: Google provider not enabled in Supabase.

**Fix**:
1. Supabase → Authentication → Providers
2. Enable Google
3. Add Client ID and Secret

### Issue: "Redirect loop after Google sign-in"

**Cause**: The callback route isn't handling the OAuth code properly.

**Fix**: Already fixed! The `/auth/callback/route.ts` now:
- Exchanges the code for a session
- Reads the `returnTo` parameter
- Redirects to the original destination

### Issue: Google popup blocked

**Cause**: Browser is blocking popups.

**Fix**:
1. Allow popups for localhost:3000
2. Or the OAuth will redirect in the same window (which is fine)

---

## 📋 Quick Checklist

Before Google OAuth works, ensure:

- [ ] Google provider enabled in Supabase
- [ ] Client ID added to Supabase
- [ ] Client Secret added to Supabase
- [ ] Redirect URI configured in Google Cloud Console
- [ ] Site URL configured in Supabase
- [ ] `/auth/callback/route.ts` exists (✅ already created)
- [ ] `signInWithGoogle()` includes returnTo parameter (✅ just fixed)

---

## 🔄 OAuth Flow Diagram

```
User clicks "Continue with Google"
    ↓
signInWithGoogle() called
    ↓
Redirects to Google OAuth
    ↓
User authorizes
    ↓
Google redirects to: /auth/callback?code=xxx&returnTo=/account
    ↓
Callback route exchanges code for session
    ↓
Sets cookies using SSR helpers
    ↓
Redirects to: /account (from returnTo)
    ↓
Middleware detects session
    ↓
User accesses /account ✅
```

---

## 🚀 Next Steps

1. **Configure Google OAuth in Supabase** (if not done)
2. **Test Google sign-in**
3. **Verify redirect to correct page**
4. **Test session persistence**

Once Google OAuth is working, you'll have:
- ✅ Email/password login
- ✅ Google OAuth login
- ✅ Proper redirects to original destination
- ✅ Session persistence
- ✅ No login loops

---

## 📝 Production Setup

When deploying to production:

1. **Update Google Cloud Console**:
   - Add production redirect URI:
     ```
     https://[YOUR-PROJECT-REF].supabase.co/auth/v1/callback
     ```
   - Add authorized JavaScript origins:
     ```
     https://yourdomain.com
     ```

2. **Update Supabase**:
   - Site URL: `https://yourdomain.com`
   - Redirect URLs:
     ```
     https://yourdomain.com/auth/callback
     https://yourdomain.com/**
     ```

3. **Test thoroughly** before going live!

---

**Need help with Google Cloud Console setup?** Let me know which step you're stuck on! 🚀
