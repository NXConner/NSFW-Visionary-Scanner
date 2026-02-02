# MorphoScan Pro — Remaining Work (Project-Wide)

**Last updated**: 2026-01-31

This document is the **single actionable checklist** of what still needs to be done across the entire repository to reach a true **public release** (web + mobile + monetization + ops).

For deeper supporting docs, see:

- `docs/tracking/CONSOLIDATED_DOCS_MASTER.md` (canonical finish plan)
- `docs/guides/testing/PRODUCTION_TESTING_GUIDE.md` (device QA matrix)
- `docs/guides/integrations/payments/STRIPE_SETUP_GUIDE.md` (payments)
- `docs/guides/integrations/notifications/FCM_SETUP.md` (push)
- `docs/guides/build/MOBILE_BUILD_GUIDE.md` (Capacitor builds)
- `docs/security/baseline/SECURITY_BASELINE.md` + `docs/security/rls/RLS_AUDIT_CHECKLIST.md` (security/RLS)
- `docs/guides/deployment/DEPLOYMENT_CHECKLIST.md` (store + marketing + infra checklist)

---

## Current status snapshot (repo gates)

- **Lint**: ⏳ Not verified in this update
- **Format**: ⏳ Not verified in this update
- **Typecheck**: ⏳ Not verified in this update
- **Unit tests**: ⏳ Not verified in this update
- **E2E tests**: ⏳ Not verified in this update
- **Prod build**: ⏳ Not verified in this update

> Run automation: `pwsh -File scripts/complete-remaining.ps1`

---

## P0 — Must-do before any real public release

### 1) Secrets + environment hardening (prod + staging)

- [ ] **Confirm no secrets are committed**
  - [ ] `.env` is **not** committed
  - [ ] `android/app/google-services.json` is local-only
  - [ ] `ios/App/App/GoogleService-Info.plist` is local-only
  - [ ] `android/gradle.properties` is local-only
- [ ] **Provision secrets via your hosting/secrets manager** (see `docs/security/secrets/secrets-manager.md`)
  - [ ] `VITE_SUPABASE_URL`
  - [ ] `VITE_SUPABASE_PUBLISHABLE_KEY`
  - [ ] `VITE_APP_ENV` (`staging`/`production`)
  - [ ] `VITE_APP_VERSION` (`sfw`/`nsfw`/`hybrid`) + `VITE_DISTRIBUTION_CHANNEL` (`store`/`direct`)
  - [ ] `VITE_CLIENT_ENCRYPTION_SALT` (rotate per env)
  - [ ] `SUPABASE_SERVICE_ROLE_KEY` (**server-only**)
  - [ ] `DATABASE_URL` (**server-only**)
- [ ] **Confirm production-only switches are correct**
  - [ ] PWA service worker behavior is correct on real domains (see `src/pwa/register.ts`)
  - [ ] No dev server URL is set for production Capacitor builds (see `capacitor.config.ts`)

### 2) Supabase production readiness (security + data protection)

- [ ] **Auth settings (manual)**
- [ ] Enable leaked password protection (see `docs/security/baseline/SECURITY_BASELINE.md`)
  - [ ] Lock down redirect URL allowlist to real domains only
  - [ ] Enable MFA for admin/staff accounts (recommended)
- [ ] **RLS + policies audit**
- [ ] Run through `docs/security/rls/RLS_AUDIT_CHECKLIST.md` for all PII/health/payment/device tables
  - [ ] Confirm storage buckets are private where appropriate and require signed URLs
- [ ] **Migrations**
  - [ ] Apply `supabase/migrations/*.sql` to the production project
  - [ ] Verify `npm run db:types:check` passes against production schema (or staging mirror)
- [ ] **Backups + retention**
  - [ ] Confirm backup/restore procedure
  - [ ] Validate account deletion + retention cleanup jobs (edge functions) behave correctly

### 2b) NSFW production readiness (if NSFW/hybrid build)

- [ ] **Apply new migrations**
  - [ ] `20260201090000_nsfw_consent_policies.sql` (consent + bookmarks)
- [ ] **Consent policy review**
  - [ ] Review consent copy with legal/compliance
  - [ ] Update policy text/versions if required
- [ ] **Content import**
  - [ ] Import NSFW videos via `/admin/nsfw` (CSV templates)
  - [ ] Import NSFW topics + library items via `/admin/nsfw`
- [ ] **Storage & delivery**
  - [ ] Confirm signed URL delivery + expiry for NSFW videos
  - [ ] Confirm DRM/expiry behavior for offline downloads
- [ ] **Privacy tier enforcement**
  - [ ] Validate privacy tier defaults for NSFW community + partner features
  - [ ] Confirm incognito behavior + panic lock on real devices

### 3) Payments (Stripe) for subscriptions + DLC (if monetizing)

Canonical doc: `docs/guides/integrations/payments/STRIPE_SETUP_GUIDE.md`

- [ ] **Stripe keys + webhook secrets set in server-side secrets**
  - [ ] `STRIPE_SECRET_KEY` (server-only)
  - [ ] `STRIPE_WEBHOOK_SECRET` (server-only)
  - [ ] `VITE_STRIPE_PUBLISHABLE_KEY` (client)
- [ ] **Webhook endpoint configured in Stripe**
  - [ ] Endpoint: `https://<your-supabase-project>.supabase.co/functions/v1/stripe-webhook`
  - [ ] Events: `checkout.session.completed`, `customer.subscription.*`, `charge.refunded`, `charge.dispute.*` (plus any others you rely on)
- [ ] **Price IDs populated**
  - [ ] Fill all required `VITE_STRIPE_*_PRICE_ID` env vars you intend to sell
  - [ ] In-app DLC catalog mapping completed in `/admin/dlc` (or DB)
- [ ] **E2E paid flows validated (real staging or Stripe test mode)**
  - [ ] Checkout succeeds
  - [ ] Webhook updates DB correctly
  - [ ] Entitlements unlock the correct features everywhere
  - [ ] Cancel/reactivate works
  - [ ] Billing portal works

### 4) Push notifications (optional for launch, but required if promised)

Canonical doc: `docs/guides/integrations/notifications/FCM_SETUP.md`

- [ ] **Android FCM**
  - [ ] Firebase project created and Android app registered (`com.morphoscan.pro`)
  - [ ] `android/app/google-services.json` present locally (not committed)
  - [ ] `FIREBASE_SERVICE_ACCOUNT` secret set in Supabase (full JSON)
- [ ] **iOS APNs**
  - [ ] `APNS_KEY_P8`, `APNS_KEY_ID`, `APNS_TEAM_ID`, `APNS_BUNDLE_ID` secrets set in Supabase
  - [ ] Optional: `APNS_USE_SANDBOX=true` for TestFlight/dev
- [ ] **Delivery verification**
  - [ ] Token registration works
  - [ ] Remote push delivered on at least 1 real Android + 1 real iOS device

---

## P1 — Deployment + operations (make “deploy” real)

### 5) CI/CD deployment wiring

- [ ] **Decide how you deploy the SPA**
  - [ ] Option A: static hosting (CDN) + separate backend (Supabase)
  - [ ] Option B: Docker image deployment (container platform)
- [ ] **Enable CI deploy jobs** (currently gated to avoid fake deploys)
  - [ ] Set GitHub Actions secrets:
    - [ ] `STAGING_DEPLOY_ENABLED=true`
    - [ ] `STAGING_DEPLOY_COMMAND=<one-line deploy command>`
    - [ ] `PRODUCTION_DEPLOY_ENABLED=true`
    - [ ] `PRODUCTION_DEPLOY_COMMAND=<one-line deploy command>`
- [ ] **Define rollback**
  - [ ] Versioned artifacts (docker tags or static build versions)
  - [ ] One-command rollback documented

### 6) Observability + incident readiness

- [ ] **Sentry**
  - [ ] Confirm DSN configured and environment tags are correct (dev/staging/prod)
  - [ ] Confirm no sensitive payloads are logged (PII/health content)
- [ ] **Monitoring**
  - [ ] Alerting thresholds (crash-free users, API errors, webhook failures)
  - [ ] Dashboard for payments/webhooks (success rate, latency, retries)

---

## P2 — Product polish (public-facing quality)

### 7) Accessibility (a11y)

- [ ] Run an accessibility audit across core flows:
  - [ ] Auth
  - [ ] Scanner
  - [ ] Diary
  - [ ] Settings
  - [ ] DLC store + gated flows
- [ ] Validate:
  - [ ] Keyboard navigation + visible focus
  - [ ] Screen reader labels and announcements
  - [ ] Contrast (WCAG AA)
  - [ ] Reduced motion support

### 8) Performance + reliability

- [ ] Run load test (k6): `npm run perf:load` (see `docs/guides/testing/LOAD_TESTING.md`)
- [ ] Run load test (k6): `npm run perf:load` (see `docs/guides/testing/LOAD_TESTING.md`)
- [ ] Confirm target budgets:
  - [ ] Cold start time (web + mobile)
  - [ ] Scanner performance (FPS, memory)
  - [ ] Image/video memory pressure handling on mobile
- [ ] Review bundle composition: `npm run analyze:bundle`

---

## P3 — Mobile + store release execution

### 9) Android release

Canonical doc: `docs/guides/build/MOBILE_BUILD_GUIDE.md`

- [ ] `npx cap sync android`
- [ ] Signed release AAB built (`./gradlew bundleRelease`)
- [ ] Upload to Play Console internal track, run pre-launch report
- [ ] Promote to production when sign-off complete

### 10) iOS release (macOS required)

Canonical doc: `docs/guides/build/MOBILE_BUILD_GUIDE.md`

- [ ] `npx cap sync ios`
- [ ] Archive + upload in Xcode
- [ ] TestFlight internal testing verified
- [ ] Submit for review

### 11) Store listing + compliance

- [ ] Confirm store-safe content for SFW/store builds (see `docs/product/store/app-store-listing.md`)
- [ ] Confirm store-safe content for SFW/store builds (see `docs/product/store/app-store-listing.md`)
- [ ] Verify privacy policy + terms URLs are correct and live
- [ ] Verify age rating / questionnaires match actual shipped build behavior
- [ ] Screenshot set updated and uploaded for final UI

---

## Optional: NSFW/DLC “full production” hardening

If NSFW/DLC is in-scope for the public release, treat this as **P0 for the NSFW variant**:

- `docs/archive/nsfw/NSFW_DLC_REMAINING_WORK.md` (idempotency, refunds/disputes, signed URLs, encryption, restore purchases, device binding, purchase E2E tests)
- Validate `/admin/nsfw` access control in production (admin roles only)
- Verify consent gating + policies for all NSFW modules (video/forum/topics/advanced/analytics)
