# Song Pig Dev/Staging Environment Setup Guide

This guide covers the external service configurations needed for both localhost and Vercel preview deployments.

## Current Status

### Localhost (http://localhost:3000)
- [x] Email/password login works
- [x] Email/password registration works  
- [x] Google OAuth redirects correctly
- [x] Dev helpers showing
- [x] Environment variables configured

### Vercel Preview (needs configuration)
- [ ] Environment variables in Vercel Dashboard
- [ ] Supabase redirect URLs for Vercel preview
- [ ] Google OAuth origins for Vercel preview

---

## Step 1: Supabase Auth Configuration

Go to: **Supabase Dashboard → Authentication → URL Configuration**

### Redirect URLs (add all of these)

```
http://localhost:3000/auth/callback
https://*.vercel.app/auth/callback
https://ab.songpig.com/auth/callback
```

> **Note:** The wildcard `https://*.vercel.app/auth/callback` covers all Vercel preview deployments automatically.

### Site URL
Set to your production domain:
```
https://ab.songpig.com
```

---

## Step 2: Google OAuth Configuration

Go to: **Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs**

Click on your OAuth client (songpig) and update:

### Authorized JavaScript Origins

```
http://localhost:3000
https://songpig-rooms.vercel.app
https://ab.songpig.com
```

> **Note:** For Vercel previews, you may need to add the specific preview URL pattern. Vercel preview URLs follow the format: `https://songpig-rooms-git-dev-<username>.vercel.app` or `https://songpig-rooms-<hash>.vercel.app`

### Authorized Redirect URIs

This should already be set to Supabase's callback:
```
https://xkholdgzgnhelzgkklwg.supabase.co/auth/v1/callback
```

---

## Step 3: Vercel Environment Variables

Go to: **Vercel Dashboard → Project Settings → Environment Variables**

For **Preview** deployments, add these variables:

| Variable | Value | Environment |
|----------|-------|-------------|
| `NEXT_PUBLIC_APP_URL` | `https://${VERCEL_URL}` | Preview |
| `NEXT_PUBLIC_APP_ENV` | `staging` | Preview |
| `NEXT_PUBLIC_SHOW_DEV_HELPERS` | `true` | Preview |
| `NEXT_PUBLIC_ENABLE_DEV_HELPERS` | `true` | Preview |
| `NEXT_PUBLIC_SHOW_DEPLOYMENT_BANNER` | `true` | Preview |
| `NEXT_PUBLIC_SHOW_CHANGELOG_LINK` | `true` | Preview |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xkholdgzgnhelzgkklwg.supabase.co` | Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (copy from production) | Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | (copy from production) | Preview |
| `CLOUDFLARE_ACCOUNT_ID` | (copy from production) | Preview |
| `CLOUDFLARE_R2_ACCESS_KEY_ID` | (copy from production) | Preview |
| `CLOUDFLARE_R2_SECRET_ACCESS_KEY` | (copy from production) | Preview |
| `CLOUDFLARE_R2_BUCKET_NAME` | `songpig-audio` | Preview |
| `CLOUDFLARE_R2_PUBLIC_URL` | (copy from production) | Preview |

> **Tip:** In Vercel, you can reference `${VERCEL_URL}` in environment variables for dynamic preview URLs.

---

## Step 4: Verify GitHub → Vercel Connection

Ensure the correct GitHub repository is connected to Vercel:

1. Go to **Vercel Dashboard → Project → Settings → Git**
2. Verify the connected repository is `songpig-frank/songpig-rooms` (or whichever has write access)
3. Check that "Preview" deployments are enabled for non-main branches

The `dev` branch has been pushed and should trigger a preview deployment automatically.

---

## Step 5: Testing Checklist

### Localhost Tests (http://localhost:3000)
- [x] Admin login (admin/admin123) → redirects to /admin
- [x] Artist login (jean/jean123) → redirects to /dashboard
- [x] Reviewer login (bob/bob123) → redirects to /dashboard
- [x] Google OAuth → redirects to Google sign-in
- [x] Dev helpers visible on login page

### Vercel Preview Tests
After configuration, test on the Vercel preview URL:
- [ ] Admin login → redirects to /admin
- [ ] Artist login → redirects to /dashboard  
- [ ] Reviewer login → redirects to /dashboard
- [ ] Google OAuth → completes sign-in flow
- [ ] Google OAuth signup with Artist role
- [ ] Google OAuth signup with Reviewer role
- [ ] Welcome banners display correctly
- [ ] localStorage session persists

---

## Troubleshooting

### "redirect_uri_mismatch" Error
This means the Supabase or Google OAuth redirect URLs don't match the current domain. Add the exact URL pattern to both services.

### "Invalid origin" Error from Google
Add the Vercel preview URL to Google OAuth's Authorized JavaScript Origins.

### Auth callback fails silently
Check the browser console for errors. Common issues:
- Missing `signupRole` parameter
- Session not being set correctly
- CORS issues with Supabase

### Dev helpers not showing
Verify `NEXT_PUBLIC_SHOW_DEV_HELPERS=true` is set in the environment.

---

## Files Modified

- `config/env.local.recommended` - Updated to use `ab.songpig.com`
- `config/env.staging.template` - New file with staging configuration notes
- `.env.local` - Updated for local development with correct `NEXT_PUBLIC_APP_URL`

---

## Branch Information

- **Branch:** `dev`
- **Pushed to:** `upstream` (songpig-frank/songpig-rooms)
- **Vercel Preview URL:** (check Vercel dashboard after deployment)

