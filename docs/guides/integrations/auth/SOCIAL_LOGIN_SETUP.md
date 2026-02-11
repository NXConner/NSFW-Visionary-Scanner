---
title: Social Login Setup (Google + Apple)
status: active
last_updated: 2026-02-03
---

# Social Login Setup

This guide covers enabling **Google** and **Apple** sign-in with Supabase Auth.

## Prerequisites

- Supabase project created
- Domain(s) verified for OAuth redirect
- App configured with valid redirect URLs

## Supabase Configuration

1. **Supabase Dashboard → Authentication → Providers**
2. Enable:
   - Google
   - Apple
3. Configure client IDs / secrets for each provider

### Redirect URLs

Use:

```
https://<project-ref>.supabase.co/auth/v1/callback
```

For local and preview environments:

```
http://localhost:8080/auth/callback
http://127.0.0.1:8080/auth/callback
```

## Google OAuth

1. Go to **Google Cloud Console → APIs & Services → Credentials**
2. Create OAuth client (Web)
3. Add authorized redirect URIs
4. Copy **Client ID** and **Client Secret** into Supabase provider config

## Apple OAuth

1. Create **Services ID** in Apple Developer Portal
2. Configure:
   - Redirect URL
   - Domain verification
3. Generate **Key ID** and **Private Key**
4. Enter **Client ID**, **Team ID**, **Key ID**, and **Private Key** into Supabase

## App Integration

Social login is already wired in:

- `src/contexts/AuthContext.tsx`
- `src/pages/Auth.tsx`
- `src/components/SocialLoginButtons.tsx`

## Verification

1. Open `/auth`
2. Click **Google** or **Apple**
3. Confirm redirect to `/auth/callback`
4. Verify the session is created in Supabase

## Troubleshooting

- Ensure Supabase **Site URL** is correct
- Verify all redirect URLs match exactly
- Check Apple/Google app verification status
- Confirm Supabase Auth provider is enabled
