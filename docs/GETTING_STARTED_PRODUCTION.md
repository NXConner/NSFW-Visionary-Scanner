# 🚀 Getting Started with Production Deployment

**Quick Start Guide for Phase 1: Production Environment Setup**

---

## ✅ Prerequisites Check

Before starting, verify you have:

- [ ] Access to Supabase Dashboard
- [ ] Stripe account (if monetizing)
- [ ] Google Play Developer account (for Android)
- [ ] Apple Developer account (for iOS, if applicable)
- [ ] Project directory accessible

---

## 🎯 Step 1: Environment Setup (30-60 minutes)

### Option A: Interactive Script (Recommended)

```powershell
# Navigate to project
cd "C:\Users\n8ter\Desktop\scanner app\visionary-scanner-suite"

# Run setup script
.\scripts\setup-production-env.ps1
```

The script will:

- ✅ Create `.env` from `.env.example`
- ✅ Guide you through required variables
- ✅ Help configure optional variables
- ✅ Verify `.env` is in `.gitignore`

### Option B: Manual Setup

1. **Copy environment template:**

   ```powershell
   Copy-Item .env.example .env
   ```

2. **Edit `.env` file** with your production values

3. **Verify `.env` is ignored:**
   ```powershell
   git check-ignore .env
   # Should output: .env
   ```

---

## 🔑 Required Environment Variables

### 1. Supabase Configuration

**Where to find:**

- Go to [Supabase Dashboard](https://app.supabase.com)
- Select your project (or create new)
- Go to Settings → API

**Required:**

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 2. Application Configuration

```bash
VITE_APP_ENV=production
VITE_APP_VERSION=hybrid          # Options: sfw, nsfw, hybrid
VITE_DISTRIBUTION_CHANNEL=direct # Options: store, direct
```

### 3. Optional: Stripe (If Monetizing)

**Where to find:**

- Go to [Stripe Dashboard](https://dashboard.stripe.com)
- Developers → API keys
- Products → Pricing

```bash
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_STRIPE_PRO_PRICE_ID=price_...
VITE_STRIPE_PREMIUM_PRICE_ID=price_...
```

---

## 🗄️ Step 2: Supabase Production Setup (1-2 hours)

### 2.1 Create/Configure Project

1. **Go to Supabase Dashboard**
   - [https://app.supabase.com](https://app.supabase.com)
   - Create new project or select existing

2. **Note Project Details:**
   - Project URL: `https://xxxxx.supabase.co`
   - Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Project Reference ID

### 2.2 Run Database Migrations

**Option A: Using Supabase CLI**

```powershell
# Install Supabase CLI if needed
npm install -g supabase

# Link to project
supabase link --project-ref your-project-ref

# Push migrations
supabase db push
```

**Option B: Using Dashboard**

1. Go to SQL Editor in Supabase Dashboard
2. Run migrations from `supabase/migrations/` in order
3. Verify all tables created

### 2.3 Configure Storage Buckets

1. **Go to Storage in Supabase Dashboard**
2. **Create buckets:**
   - `scans` - Scanner images
   - `progress-photos` - Progress photos
   - `avatars` - User avatars
   - `videos` - Video content
   - `documents` - Document storage

3. **Set RLS Policies:**
   - Each bucket should have appropriate RLS policies
   - Users can only access their own files

### 2.4 Deploy Edge Functions

1. **Go to Edge Functions in Supabase Dashboard**
2. **Deploy functions from `supabase/functions/`:**

   ```powershell
   # If using CLI
   supabase functions deploy function-name
   ```

3. **Configure Secrets:**
   - Set function secrets in Dashboard
   - Add Stripe keys, service role keys, etc.

---

## 💳 Step 3: Stripe Setup (If Monetizing) (30-60 minutes)

### 3.1 Create/Configure Account

1. **Go to Stripe Dashboard**
   - [https://dashboard.stripe.com](https://dashboard.stripe.com)
   - Complete account setup
   - Switch to **Live Mode**

### 3.2 Get API Keys

1. **Navigate to:** Developers → API keys
2. **Copy:**
   - Publishable key (starts with `pk_live_`)
   - Secret key (starts with `sk_live_`) - **Keep secret!**

### 3.3 Create Products & Prices

1. **Go to:** Products → Add Product
2. **Create subscription tiers:**
   - Pro tier
   - Premium tier
3. **Note Price IDs** (starts with `price_`)

### 3.4 Configure Webhooks

1. **Go to:** Developers → Webhooks
2. **Add endpoint:**
   ```
   https://your-project.supabase.co/functions/v1/stripe-webhook
   ```
3. **Select events:**
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. **Copy webhook signing secret**

---

## ✅ Step 4: Verification (15 minutes)

### 4.1 Verify Environment

```powershell
# Run production readiness check
npm run verify:production
```

**Expected:** 16/16 checks passing

### 4.2 Test Production Build

```powershell
# Build for production
npm run build

# Preview build
npm run preview
```

**Check:**

- [ ] Build completes without errors
- [ ] App loads in browser
- [ ] No console errors
- [ ] Supabase connection works

### 4.3 Test Supabase Connection

1. **Open app in browser** (from preview)
2. **Try to sign in/sign up**
3. **Verify:**
   - Authentication works
   - Database connection works
   - Storage access works

---

## 📋 Quick Checklist

### Environment Setup

- [ ] `.env` file created
- [ ] Supabase URL configured
- [ ] Supabase keys configured
- [ ] App version set
- [ ] Distribution channel set
- [ ] Stripe keys configured (if applicable)

### Supabase Setup

- [ ] Production project created
- [ ] Migrations run
- [ ] Storage buckets created
- [ ] RLS policies configured
- [ ] Edge functions deployed
- [ ] Function secrets configured

### Stripe Setup (If Applicable)

- [ ] Account created and verified
- [ ] Live mode enabled
- [ ] API keys obtained
- [ ] Products created
- [ ] Prices configured
- [ ] Webhooks configured

### Verification

- [ ] Production readiness check passes
- [ ] Production build successful
- [ ] Preview works correctly
- [ ] Supabase connection verified
- [ ] Authentication tested

---

## 🎯 Next Steps

Once Phase 1 is complete:

1. **Phase 2: Production Build & Testing**
   - Build production version
   - Test on devices
   - Verify all features

2. **Phase 3: App Store Preparation**
   - Prepare assets
   - Create listings
   - Submit for review

See `docs/NEXT_STEPS_ACTION_PLAN.md` for complete guide.

---

## 🆘 Need Help?

### Documentation

- **Detailed Setup:** `docs/guides/setup/PRODUCTION_ENV_SETUP.md`
- **Action Plan:** `docs/NEXT_STEPS_ACTION_PLAN.md`
- **Quick Reference:** `docs/QUICK_REFERENCE.md`

### Common Issues

**Environment variables not working:**

- Ensure `.env` is in project root
- Restart dev server after changes
- Check variable names start with `VITE_`

**Supabase connection fails:**

- Verify URL and keys are correct
- Check project is active
- Verify network connectivity

**Build fails:**

- Check all required variables are set
- Verify TypeScript compiles
- Check for linting errors

---

## ✨ Success Criteria

Phase 1 is complete when:

- ✅ `.env` file configured with production values
- ✅ Supabase production project set up
- ✅ Database migrations applied
- ✅ Storage buckets configured
- ✅ Edge functions deployed
- ✅ Stripe configured (if applicable)
- ✅ Production readiness check passes
- ✅ Production build works
- ✅ Preview shows working app

---

**Ready to start?** Run `.\scripts\setup-production-env.ps1` to begin!

---

_Last Updated: December 26, 2025_
