# Complete Launch Checklist

**Last Updated:** 2026-02-02  
**Status:** Pre-Launch

---

## Phase 1: APK Build Verification

### Step 1.1: Build the APK

```powershell
# Navigate to project root
cd C:\path\to\your\project

# Build web assets
npm run build

# Sync to Android
npx cap sync android

# Navigate to Android folder
cd android

# Build release APK
.\gradlew.bat assembleRelease

# Return to project root
cd ..
```

### Step 1.2: Locate the APK

```powershell
# Find the APK file
Get-ChildItem android\app\build\outputs\apk\release -Filter *.apk

# Expected output: app-release.apk or app-release-unsigned.apk
```

### Step 1.3: Install on Physical Device

**Option A: ADB (Android Debug Bridge)**

```powershell
# List connected devices
adb devices

# Install APK
adb install android\app\build\outputs\apk\release\app-release.apk
```

**Option B: Manual Transfer**

1. Copy APK to phone via USB or cloud storage
2. On phone: Settings → Security → Enable "Install from unknown sources"
3. Open the APK file on your phone
4. Tap "Install"

### Step 1.4: Test Core Functionality

- [ ] App launches without crash
- [ ] Login/signup works
- [ ] Camera access works
- [ ] Scan capture works
- [ ] Data persists after restart
- [ ] Push notifications work (if configured)

---

## Phase 2: Production Environment Setup

### Step 2.1: Supabase Production Configuration

Your project is already connected to Lovable Cloud (Supabase). The following are already configured:

| Secret                    | Status |
| ------------------------- | ------ |
| SUPABASE_URL              | ✅ Set |
| SUPABASE_ANON_KEY         | ✅ Set |
| SUPABASE_SERVICE_ROLE_KEY | ✅ Set |
| SUPABASE_DB_URL           | ✅ Set |
| SUPABASE_PUBLISHABLE_KEY  | ✅ Set |

### Step 2.2: Stripe Configuration

**Current Status:** STRIPE_SECRET_KEY is already set in your secrets.

**Additional Setup Required:**

1. **Create Products in Stripe Dashboard:**
   - Go to [Stripe Dashboard](https://dashboard.stripe.com) → Products
   - Create your subscription tiers (Pro, Premium, etc.)
   - Copy the Price IDs

2. **Add Price IDs to your `.env` file (local development):**

   ```env
   VITE_STRIPE_PUBLISHABLE_KEY=pk_live_your_key_here
   VITE_STRIPE_PRO_PRICE_ID=price_xxxxx
   VITE_STRIPE_PREMIUM_PRICE_ID=price_xxxxx
   ```

3. **Configure Stripe Webhook:**
   - Stripe Dashboard → Developers → Webhooks
   - Add endpoint: `https://xbhjmuaxjpxqzrngubzo.supabase.co/functions/v1/stripe-webhook`
   - Select events: `checkout.session.completed`, `customer.subscription.*`
   - Copy webhook signing secret

4. **Add Webhook Secret to Lovable Cloud:**
   - Use the secrets management to add `STRIPE_WEBHOOK_SECRET`

### Step 2.3: Push Notifications (FCM)

**For Android (Firebase Cloud Messaging):**

1. **Create Firebase Project:**
   - Go to [Firebase Console](https://console.firebase.google.com)
   - Create new project or use existing
   - Add Android app with your package name: `app.lovable.0b696f8a6a684651ba80ae9256f5e910`

2. **Download Configuration:**
   - Download `google-services.json`
   - Place in `android/app/google-services.json`
   - **IMPORTANT:** This file should NOT be committed to git

3. **Get Server Key:**
   - Firebase Console → Project Settings → Cloud Messaging
   - Copy the Server Key

4. **Add to Lovable Cloud Secrets:**
   - Add secret: `FCM_SERVER_KEY` with the server key value

### Step 2.4: Environment Variables Summary

**Client-side (in code or .env):**

```env
VITE_SUPABASE_URL=https://xbhjmuaxjpxqzrngubzo.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
VITE_APP_ENV=production
VITE_APP_VERSION=sfw
VITE_DISTRIBUTION_CHANNEL=store
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

**Server-side (Lovable Cloud Secrets):**

- ✅ SUPABASE_SERVICE_ROLE_KEY
- ✅ STRIPE_SECRET_KEY
- ⏳ STRIPE_WEBHOOK_SECRET (needs setup)
- ⏳ FCM_SERVER_KEY (needs setup if using push)

---

## Phase 3: Security Hardening

### Step 3.1: Enable Leaked Password Protection

**Location:** Lovable Cloud → Auth Settings

1. Open your backend settings
2. Navigate to Authentication → Settings → Passwords
3. Enable "Leaked password protection"
4. This checks passwords against known breach databases

### Step 3.2: Lock Down Redirect URLs

**Location:** Lovable Cloud → Auth Settings → URL Configuration

1. Remove any wildcard or localhost URLs for production
2. Add only your production domains:
   - `https://your-app.lovable.app`
   - `https://your-custom-domain.com` (if applicable)

### Step 3.3: RLS Policy Audit

Run the database linter to check for security issues:

```sql
-- Check tables without RLS
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
AND tablename NOT IN (
  SELECT tablename
  FROM pg_policies
  WHERE schemaname = 'public'
);
```

**Critical Tables to Verify:**

| Table             | RLS Enabled | Policies |
| ----------------- | ----------- | -------- |
| profiles          | ✅          | ✅       |
| scans             | ✅          | ✅       |
| subscriptions     | ✅          | ✅       |
| user_achievements | ✅          | ✅       |
| dlc_purchases     | ✅          | ✅       |

### Step 3.4: Storage Bucket Security

**Verify bucket policies:**

| Bucket          | Public | RLS |
| --------------- | ------ | --- |
| scans           | No     | ✅  |
| progress-photos | No     | ✅  |
| avatars         | Yes    | ✅  |
| videos          | No     | ✅  |
| documents       | No     | ✅  |
| user-uploads    | No     | ✅  |

### Step 3.5: Enable MFA for Admin Accounts

1. For any admin users, enable MFA in their profile settings
2. Consider enforcing MFA for users with elevated roles

---

## Phase 4: Production Testing

### Step 4.1: Device Testing Matrix

**Minimum Testing Required:**

| Device Type    | OS Version | Screen Size | Status |
| -------------- | ---------- | ----------- | ------ |
| Android Phone  | 12+        | ~6"         | ⏳     |
| Android Phone  | 10-11      | ~6"         | ⏳     |
| Android Tablet | 12+        | ~10"        | ⏳     |
| iPhone         | iOS 15+    | ~6"         | ⏳     |
| iPad           | iPadOS 15+ | ~10"        | ⏳     |

### Step 4.2: Feature Testing Checklist

**Authentication:**

- [ ] Sign up with email
- [ ] Email verification received
- [ ] Sign in works
- [ ] Password reset works
- [ ] Session persists across app restart
- [ ] Logout works

**Core Features:**

- [ ] Camera capture works
- [ ] Scan processing completes
- [ ] Results display correctly
- [ ] History/timeline loads
- [ ] Data syncs across devices
- [ ] Offline mode works (if applicable)

**Payments (if applicable):**

- [ ] Subscription plans display
- [ ] Checkout flow completes
- [ ] Subscription activates
- [ ] Premium features unlock
- [ ] Subscription cancellation works

**Performance:**

- [ ] App loads in < 3 seconds
- [ ] No memory leaks after extended use
- [ ] Battery usage is reasonable
- [ ] No UI jank or lag

### Step 4.3: Automated Quality Checks

```powershell
# Run all preflight checks
npm run preflight:all

# Individual checks
npm run lint          # Code quality
npm run test:run      # Unit tests
npm run test:e2e      # End-to-end tests
npm run perf:audit    # Performance
npm run a11y:audit    # Accessibility
```

---

## Phase 5: App Store Submission

### Step 5.1: Google Play Store (Android)

**A. Generate Signed Release Bundle:**

```powershell
cd android

# Build AAB (Android App Bundle) - required for Play Store
.\gradlew.bat bundleRelease

cd ..
```

Output: `android/app/build/outputs/bundle/release/app-release.aab`

**B. Create Keystore (if not exists):**

```powershell
keytool -genkey -v -keystore morphoscan-release.keystore -alias morphoscan -keyalg RSA -keysize 2048 -validity 10000
```

**C. Sign the Bundle:**

Configure in `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file('morphoscan-release.keystore')
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias 'morphoscan'
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

**D. Play Console Submission:**

1. Go to [Google Play Console](https://play.google.com/console)
2. Create new app
3. Fill in store listing:
   - App name
   - Short description (80 chars)
   - Full description (4000 chars)
   - Screenshots (phone + tablet)
   - Feature graphic (1024x500)
   - App icon (512x512)
4. Set content rating (complete questionnaire)
5. Set pricing & distribution
6. Upload AAB to Production track
7. Submit for review

### Step 5.2: Apple App Store (iOS)

**A. Requirements:**

- Mac with Xcode installed
- Apple Developer Account ($99/year)
- Valid provisioning profiles

**B. Build IPA:**

```bash
# On Mac
cd ios
xcodebuild -workspace App.xcworkspace -scheme App -configuration Release -archivePath build/App.xcarchive archive
xcodebuild -exportArchive -archivePath build/App.xcarchive -exportPath build -exportOptionsPlist ExportOptions.plist
```

**C. App Store Connect Submission:**

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. Create new app
3. Fill in metadata:
   - App name
   - Subtitle
   - Description
   - Keywords
   - Screenshots (all device sizes)
   - App icon
4. Upload build via Xcode or Transporter
5. Submit for TestFlight (optional but recommended)
6. Submit for App Store Review

### Step 5.3: Store Assets Checklist

**Screenshots Needed:**

| Platform       | Size      | Count |
| -------------- | --------- | ----- |
| Android Phone  | 1080x1920 | 4-8   |
| Android Tablet | 1200x1920 | 4-8   |
| iPhone 6.5"    | 1284x2778 | 4-8   |
| iPhone 5.5"    | 1242x2208 | 4-8   |
| iPad 12.9"     | 2048x2732 | 4-8   |

**Graphics Needed:**

- App Icon: 512x512 (Android), 1024x1024 (iOS)
- Feature Graphic: 1024x500 (Android only)
- Promo Video: Optional but recommended

---

## Quick Reference Commands

```powershell
# Full build and sync
npm run build && npx cap sync

# Android build
cd android && .\gradlew.bat assembleRelease && cd ..

# Run quality gates
npm run preflight:all

# Check APK location
Get-ChildItem android\app\build\outputs\apk\release -Filter *.apk

# Install via ADB
adb install android\app\build\outputs\apk\release\app-release.apk
```

---

## Progress Tracker

| Phase                   | Status     | Est. Time |
| ----------------------- | ---------- | --------- |
| 1. APK Build            | ⏳ Pending | 30 min    |
| 2. Production Env       | ⏳ Pending | 2 hours   |
| 3. Security Hardening   | ⏳ Pending | 2 hours   |
| 4. Production Testing   | ⏳ Pending | 2-3 days  |
| 5. App Store Submission | ⏳ Pending | 1-2 days  |

**Total Estimated Time to Launch:** 4-6 days

---

## Need Help?

- **Build Issues:** Check `docs/guides/build/BUILD_GUIDE.md`
- **Security Questions:** Check `docs/security/baseline/SECURITY_BASELINE.md`
- **Stripe Setup:** Check `docs/guides/integrations/payments/STRIPE_SETUP_GUIDE.md`
- **FCM Setup:** Check `docs/guides/integrations/notifications/FCM_SETUP.md`
