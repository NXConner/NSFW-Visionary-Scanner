# Production Environment Setup Guide

## Overview

This guide walks you through setting up production environment variables for MorphoScan Pro.

## Quick Setup

### Option 1: Interactive Script

```powershell
.\scripts\setup-production-env.ps1
```

This interactive script will:

- Create `.env` from `.env.example`
- Guide you through required variables
- Help configure optional variables (Stripe, etc.)

### Option 2: Manual Setup

1. **Copy template:**

   ```powershell
   Copy-Item .env.example .env
   ```

2. **Edit `.env` file** with your production values

3. **Verify `.env` is in `.gitignore`:**
   ```powershell
   git check-ignore .env
   ```

## Required Variables

### Supabase Configuration

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Where to find:**

- Supabase Dashboard → Project Settings → API
- Copy "Project URL" and "anon public" key

### Application Configuration

```bash
VITE_APP_ENV=production
VITE_APP_VERSION=hybrid
VITE_DISTRIBUTION_CHANNEL=direct
```

**Options:**

- `VITE_APP_ENV`: `production`, `staging`, or `development`
- `VITE_APP_VERSION`: `sfw`, `nsfw`, or `hybrid`
- `VITE_DISTRIBUTION_CHANNEL`: `store` or `direct`

## Optional Variables

### Stripe (if monetizing)

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_PRO_PRICE_ID=price_...
VITE_STRIPE_PREMIUM_PRICE_ID=price_...
```

**Where to find:**

- Stripe Dashboard → Developers → API keys
- Stripe Dashboard → Products → Pricing

### Push Notifications

**Android (FCM):**

- Requires `android/app/google-services.json` (local file, not in git)

**iOS (APNs):**

- Requires APNs key file (`.p8`) and credentials
- Configure in Supabase Edge Functions secrets

## Server-Only Variables

These should **never** be in `.env` (client-side). Use Supabase Edge Functions secrets:

- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `FIREBASE_SERVICE_ACCOUNT` (JSON)
- `DATA_RETENTION_SECRET` (Edge Functions schedule secret)

## Social Login Providers

Configure OAuth providers in:

- Supabase Dashboard → Authentication → Providers

See: `docs/guides/integrations/auth/SOCIAL_LOGIN_SETUP.md`

## Verification

After setup, verify your configuration:

```powershell
npm run verify:production
```

This will check:

- ✅ `.env` is not committed
- ✅ Required variables are set
- ✅ Build system is ready
- ✅ Security files are ignored

## Production Secrets Management

For production, use a secrets manager instead of `.env`:

### Recommended: Doppler

1. **Install Doppler CLI:**

   ```powershell
   # Windows (via Chocolatey)
   choco install doppler
   ```

2. **Setup:**

   ```powershell
   doppler setup
   ```

3. **Run with secrets:**
   ```powershell
   doppler run -- npm run build
   doppler run -- npm run dev
   ```

### Alternative: Environment Variables in Hosting

Most hosting platforms (Vercel, Netlify, etc.) allow you to set environment variables in their dashboard.

## Security Checklist

- [ ] `.env` is in `.gitignore`
- [ ] `.env` is not committed to git
- [ ] `android/app/google-services.json` is local-only
- [ ] `android/gradle.properties` is local-only
- [ ] `*.keystore` and `*.jks` files are local-only
- [ ] Server-only secrets are in Supabase Edge Functions
- [ ] Different keys for staging/production
- [ ] Keys rotated regularly

## Troubleshooting

### Variable Not Loading

- Check variable name starts with `VITE_` for client-side
- Restart dev server after changing `.env`
- Verify `.env` file is in project root

### Build Fails

- Check all required variables are set
- Verify no typos in variable names
- Check `.env.example` for correct format

### Secrets Exposed

- Immediately rotate exposed keys
- Check git history for committed secrets
- Update `.gitignore` if needed
- Use `git-secrets` or similar tools

---

**Next:** Run `npm run verify:production` to verify your setup.
