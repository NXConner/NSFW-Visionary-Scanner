# Consolidated Docs Master — What’s Left + Finish Plan

**Purpose**: Single source-of-truth for completing everything still implied by the current `docs/` folder.

**Important**: `docs/` previously mixed product names/eras (**MorphoScan Pro**, **GrowthTracker**, **Visionary Scanner**). This master plan treats **Visionary Scanner Suite** as canonical, with **MorphoScan Pro** (SFW/store) and **NSFW Visionary Scanner** (direct/NSFW) as the supported editions.

**Docs housekeeping (already started)**: historical/duplicate docs were moved to `deleted files/no-longer-needed/docs/archive/2025-12-16/` for manual review/removal.

---

## 1) Canonical docs (keep these current)

- **Release plan / remaining work**: `docs/tracking/CONSOLIDATED_DOCS_MASTER.md`
- **Mobile builds**: `docs/guides/build/MOBILE_BUILD_GUIDE.md`
- **Build flavors**: `docs/guides/build/BUILD_GUIDE.md`
- **Stripe setup**: `docs/guides/integrations/payments/STRIPE_SETUP_GUIDE.md`
- **Push notifications**: `docs/guides/integrations/notifications/FCM_SETUP.md`
- **Secrets management**: `docs/security/secrets/secrets-manager.md`
- **Store listing copy**: `docs/product/store/app-store-listing.md`

---

## 2) Executable release checklist (run top-to-bottom)

### 0) Preflight (one-time setup)

- [ ] Confirm canonical app identifiers are consistent:
  - Android: `com.morphoscan.pro` (`android/app/build.gradle`)
  - iOS: `com.morphoscan.pro` (`ios/App/App/Info.plist`)
  - Capacitor: `com.morphoscan.pro` (`capacitor.config.ts`)
- [ ] Ensure local secret/config files exist but are **not committed**:
  - `android/app/google-services.json` (ignored by git)
  - `ios/App/App/GoogleService-Info.plist` (ignored by git)
  - `android/gradle.properties` (ignored by git)
  - `.env` (never commit)
- [ ] Confirm `.env.example` contains **no real keys** (placeholders only).
- [ ] Confirm release build is using production endpoints/keys.

### 1) Engineering readiness (P0 from prior audits)

These items were previously tracked in `deleted files/no-longer-needed/docs/tracking/WHATS_LEFT.md` and are required before trusting builds/tests.

- [ ] Fix build-breaking import regression:
  - `src/pages/indexTabContent.tsx` uses `<LazyProfileSection />` but import may be missing.
- [ ] Restore WebKit/Safari-safe build behavior (if regressed):
  - Review `vite.config.ts` target/chunking and avoid problematic chunk splits for `@supabase`/`@stripe`.
- [ ] Restore startup robustness:
  - Ensure `src/main.tsx` cannot hard-crash boot leaving the loader stuck.
- [ ] Remove invalid client-side CSP/meta directives:
  - Ensure `src/lib/security.ts` does not set `upgrade-insecure-requests` with an empty value.
- [ ] E2E stability:
  - Restore Playwright hardening if removed in `playwright.config.ts`.
  - Restore loader waits and first-launch modal bypass in E2E specs where needed.
- [ ] Restore deleted test safety-net (if still missing):
  - Unit tests: wallpaper storage + feature flags + settings + scanner smoke + fakeIndexedDB
  - E2E: core navigation
- [ ] ESLint / pre-commit must pass (`lint-staged` enforces `--max-warnings=0`).

### 2) Stripe monetization (payments + webhooks)

Canonical doc: `docs/guides/integrations/payments/STRIPE_SETUP_GUIDE.md`

- [ ] Create Stripe products/prices for the variants you ship (SFW/NSFW/Hybrid).
- [ ] Populate the required `VITE_STRIPE_*_PRICE_ID` env vars with **real** `price_...` values.
- [ ] Configure Stripe webhook endpoint:
  - `https://<your-supabase-project>.supabase.co/functions/v1/stripe-webhook`
- [ ] Configure webhook signing secret in Supabase Edge Function secrets.
- [ ] Validate end-to-end flows:
  - checkout session creation
  - webhook signature verification
  - entitlement updates (subscription + DLC)
  - cancel/reactivate + billing portal

### 3) Push notifications (FCM + APNs)

Canonical doc: `docs/guides/integrations/notifications/FCM_SETUP.md`

- [ ] Firebase project created.
- [ ] Android app registered with package name `com.morphoscan.pro` and `google-services.json` downloaded (local only).
- [ ] Firebase service account JSON created and stored in Supabase secrets (Android FCM):
  - `FIREBASE_SERVICE_ACCOUNT` = full JSON
- [ ] APNs key created and stored in Supabase secrets (iOS APNs):
  - `APNS_KEY_P8`, `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_BUNDLE_ID` (`com.morphoscan.pro`)
  - Optional `APNS_USE_SANDBOX=true` for TestFlight/dev
- [ ] Validate device token registration + real remote push delivery on both platforms.

### 4) Android release (Play Store)

Canonical doc: `docs/guides/build/MOBILE_BUILD_GUIDE.md`

- [ ] Release keystore exists and is stored securely (never commit).
- [ ] `android/gradle.properties` contains release signing properties (never commit).
- [ ] Build web assets and sync Capacitor.
- [ ] Produce signed release AAB:
  - Output: `android/app/build/outputs/bundle/release/app-release.aab`
- [ ] Upload to Google Play Console and complete required store sections.

### 5) iOS release (App Store)

Canonical doc: `docs/guides/build/MOBILE_BUILD_GUIDE.md`

- [ ] Xcode Signing & Capabilities configured for `com.morphoscan.pro`.
- [ ] Archive and upload build to App Store Connect.
- [ ] TestFlight internal testing enabled and verified.

### 6) Store listing + compliance

Canonical doc: `docs/product/store/app-store-listing.md`

- [ ] Confirm store-safe copy (watch for explicit sexual content language).
- [ ] Confirm privacy policy / terms / support / marketing URLs are correct.
- [ ] Screenshots and feature graphics prepared and uploaded.
- [ ] Age rating + content questionnaire answers consistent with actual app content.

### 7) Production QA (device matrix)

Canonical doc: `docs/guides/testing/PRODUCTION_TESTING_GUIDE.md`

- [ ] Run through authentication, scanner, diary, progress, AI, payments, offline, push, performance, and accessibility checks.
- [ ] Smoke test on minimum target OS versions for Android and iOS.

### 8) Optional: NSFW/DLC production completion (only if in scope)

Canonical doc: `docs/archive/nsfw/NSFW_DLC_REMAINING_WORK.md`

- [ ] Webhook idempotency + refunds/chargebacks/disputes
- [ ] Stripe price mapping for DLC packages
- [ ] Private storage + signed URL delivery
- [ ] Real content tables populated (no bundled mock content in prod)
- [ ] Admin import pipeline
- [ ] Key issuance/rotation
- [ ] Restore purchases + device management UI

---

## 3) Plan to finish the docs folder (next actions)

### Phase A — Normalize + dedupe (in progress)

- Keep one canonical store listing doc: `docs/product/store/app-store-listing.md`.
- Keep one canonical mobile build doc: `docs/guides/build/MOBILE_BUILD_GUIDE.md`.
- Convert redundant docs into pointers (or archive if purely historical).

### Phase B — Replace placeholders with real values

- Bundle IDs, support URLs, privacy/terms URLs.
- Stripe product/price ids mapping.
- Firebase package/bundle ids.
  - Ensure `android/app/google-services.json` and `ios/App/App/GoogleService-Info.plist` exist **locally** but are **not committed** (they are now ignored).

### Phase C — Make it executable

- One checklist that you can run end-to-end:
  - Stripe
  - Push
  - Android
  - iOS
  - Store listing
  - QA

---

## 4) Historical docs archive

- `deleted files/no-longer-needed/docs/archive/2025-12-16/` (moved out of `/docs` because it’s no longer needed for active work)
