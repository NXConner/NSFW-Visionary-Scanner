# Phase 1 — Analysis & Strategic Roadmap (Repo Reality-Based)

**Date**: 2026-02-13  
**Workspace**: `/workspace` (git repo)  
**Canonical product identity found in repo**: **Visionary Scanner Suite** (MorphoScan Pro + NSFW Visionary Scanner)

This Phase 1 report is intentionally **reality-based**: it describes what is implemented in this codebase today, what is still missing to ship safely, and the chosen path forward:

- **Track A (Ship current product)**: Productionize Visionary Scanner Suite (SFW/NSFW/Hybrid variants) with Stripe + Push + Store submission.

> **Note (identity mismatch):** Some external prompts reference **“Pavement Performance Suite”**. This repository is clearly and consistently implemented/documented as **Visionary Scanner Suite / MorphoScan Pro** (scanner + health tracking + DLC/Stripe + Supabase). Aligning this repo to a pavement-analysis product would be a separate re-scope and is **not** included in this roadmap.

---

## Project Summary

### Purpose (as implemented)

Visionary Scanner Suite is a **privacy-first health tracking and “scanner” SPA** with:

- Scanning + analysis flows (including AI-assisted features)
- Health diary + progress tracking (including photos)
- Subscription + DLC gating (SFW/NSFW/Hybrid variants)
- Supabase-backed data + Edge Functions for payments/webhooks/automation
- Mobile packaging via Capacitor for Android/iOS

### Core technologies

- **Frontend**: React 18 + TypeScript, Vite, Tailwind, shadcn/ui, Radix UI
- **Data**: Supabase (Postgres + RLS), Supabase Edge Functions
- **Payments**: Stripe (client + edge functions + webhook)
- **Mobile**: Capacitor (Android/iOS)
- **PWA**: `vite-plugin-pwa` with preview-host hardening
- **Testing**: Vitest + Playwright
- **CI**: GitHub Actions (`.github/workflows/ci.yml`) incl. types check + CodeQL + Trivy
- **Observability**: Sentry + web vitals hooks exist

---

## Repo Reality Check: Identity Alignment

### What I found

- App routes and content are aligned to the Visionary Scanner Suite health/DLC feature set.
- Canonical naming: **MorphoScan Pro** (SFW/store) and **NSFW Visionary Scanner** (direct/NSFW).

---

## Current Status (from canonical docs + code)

### “What’s left” sources-of-truth

- **Release checklist**: `docs/tracking/CONSOLIDATED_DOCS_MASTER.md`
- **Production QA**: `docs/guides/testing/PRODUCTION_TESTING_GUIDE.md`
- **DLC hardening** (if shipping NSFW/DLC): `docs/archive/nsfw/NSFW_DLC_REMAINING_WORK.md`
- **Build flavors**: `docs/guides/build/BUILD_GUIDE.md`
- **Mobile**: `docs/guides/build/MOBILE_BUILD_GUIDE.md`
- **Stripe**: `docs/guides/integrations/payments/STRIPE_SETUP_GUIDE.md`
- **Push**: `docs/guides/integrations/notifications/FCM_SETUP.md`

### Practical launch blockers (highest confidence)

- **External secrets not present in repo** (must be configured):
  - Stripe: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`
  - Push: `FIREBASE_SERVICE_ACCOUNT`, `APNS_*`
- **Manual production QA is not completed** (device matrix, performance, a11y).
- **Store submission and signing are manual** (keystore/certs are local-only).
- **Residual placeholder/legacy links exist** (ex: partner-sync “links” input placeholder; some copy still refers to TBD/placeholder values).
- **Remaining “implementation placeholder” UI blocks exist** (scanner capture advanced settings sheet; advanced scanner sessions list loading).
- **Debug console logging remains in production components** (navigation + mobile init handlers); should be routed through `logger` and gated by environment.
- **Android APK boot hangs on loader if Capacitor assets/scheme are misconfigured** (ensure `CAPACITOR_BUILD=1`, `androidScheme=https`, and re-sync before Gradle build).

---

## Improvement & Completion Plan (single prioritized list)

### P0 — Ship-safety (must complete before public release)

- **P0.1 Stripe production readiness**
  - Set Stripe secrets in Supabase.
  - Configure webhook endpoint + events.
  - Populate real `price_*` IDs (matrix in `.env.example` and `docs/guides/integrations/payments/STRIPE_SETUP_GUIDE.md`).
  - Validate end-to-end: subscribe → entitlement → cancel/reactivate → billing portal; DLC purchase if applicable.

- **P0.2 Push notifications end-to-end**
  - Configure Firebase project + local `google-services.json`.
  - Set Supabase secrets for FCM (Android) and APNs (iOS).
  - Verify device registration + delivery on physical devices.

- **P0.3 Production QA execution**
  - Execute `docs/guides/testing/PRODUCTION_TESTING_GUIDE.md` on physical devices.
  - Record failures, fix, re-run until “no critical bugs”.

- **P0.4 App store submission readiness**
  - Confirm bundle IDs/app IDs are consistent (`com.morphoscan.pro`).
  - Android signing + AAB build; upload to Play Console.
  - iOS archive + upload; TestFlight verification.

- **P0.5 Remove placeholder/unsafe links**
  - Replace or remove `example.com` and other placeholders from UI and tests.
  - Centralize “support/privacy/terms” URLs in a single config module to prevent drift.

- **P0.6 Privileged access guarantee (admin + super_admin)**
  - Ensure **admin** and **super_admin** are treated as **lifetime premium**, bypass all gates (email verification, age gates, DLC locks) and stay unlocked across refreshes/devices.
  - Confirm DB roles (`user_roles`) remain the source-of-truth, with **email allowlist fallback** for core accounts to avoid “locked flash” and offline issues.
  - Validate privileged behavior in: nav visibility, DLC gating, email verification gate, NSFW session lock, admin routes.

- **P0.7 Replace remaining “implementation placeholder” UI blocks**
  - Implement the scanner capture **Advanced Settings** sheet content (remove “would go here” placeholder; embed real settings panel).
  - Implement loading and listing for **Advanced Scanner Features** sessions (3D sessions + batch sessions) instead of the “Load sessions would go here” stub.

- **P0.8 Observability hardening**
  - Remove `console.log` noise in production code paths; replace with structured `logger` calls with environment gating.
  - Ensure sensitive data is never logged (emails, tokens, encryption keys).

### P1 — Phase 8 polish (performance, bundle, accessibility)

- **P1.1 Performance optimization**
  - Lighthouse/Core Web Vitals budgets (cold start, route transitions).
  - Reduce expensive initial render work; keep aggressive boot hardening.

- **P1.2 Bundle size optimization**
  - Audit heavy modules (3D, TFJS, charts) and ensure lazy boundaries are effective.
  - Confirm no accidental eager imports of TFJS/three in base routes.

- **P1.3 Accessibility audit**
  - Fix focus management, semantic headings, ARIA labels, contrast issues.
  - Ensure keyboard navigation works for all dialogs/menus/tabs.

### P2 — “Maximum potential” improvements to existing features

These features exist; here’s their **max potential** state and what to do next:

- **Authentication**
  - Max: Social login (Google/Apple), MFA for admins, better session UX, device/session management UI.
  - Next: implement OAuth provider buttons + callback flows; ensure linking existing accounts.

- **App Lock / Biometrics**
  - Max: biometric-first unlock with PIN fallback, configurable lock timers, tamper detection, secure key storage per platform.
  - Next: finish biometric UX polish and error states; ensure device compatibility.

- **Analytics / Observability**
  - Max: privacy-preserving event model + performance dashboards + error funnels, admin-only operational dashboards.
  - Next: unify “analytics” (product) vs “telemetry” (ops) and ensure opt-in where required.

- **DLC / Entitlements**
  - Max: single source-of-truth for gating, idempotent webhooks, refunds/disputes revoke, restore purchases, device limits managed by user, secure private content delivery with signed URLs.
  - Next: follow `docs/archive/nsfw/NSFW_DLC_REMAINING_WORK.md` priority order if shipping DLC.

- **Offline / Sync**
  - Max: resilient offline queue + conflict strategy + retry/backoff + clear UI states and error recovery.
  - Next: ensure all core CRUD flows have deterministic offline behavior and reconciling.

- **Video tooling (recording + editing)**
  - Max: thumbnails, previews, streaming-safe playback, client-side compression fallback, and reliable chunk merge pipeline.
  - Next: expand test coverage for chunk merge + upload recovery + thumbnail upload permissions across browsers and Capacitor WebView.

### P3 — Optional expansions (only after ship-safety)

- **Admin platform improvements** (content import pipelines, audit trails, abuse prevention).
- **Advanced reporting** (export enhancements, compliance, retention rules UX).
- **More themes/wallpapers** (already partially present: wallpaper storage exists; expand only after a11y + performance budgets).

---

## Phased Implementation Roadmap (table)

| Priority | Task Description                                                             | Task Type (Max-Feature/New-Feature/Refactor/Fix) | Files to Modify/Create                                                                                                                                  |
| -------: | ---------------------------------------------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
|       P0 | Configure Stripe secrets + webhook endpoint + live price IDs                 | Fix                                              | `docs/guides/integrations/payments/STRIPE_SETUP_GUIDE.md`, Supabase secrets, `.env` (local only), `src/lib/pricing.ts`, `src/lib/stripe.ts`             |
|       P0 | End-to-end Stripe QA (subscription + DLC if used)                            | Fix                                              | `supabase/functions/stripe-webhook/index.ts`, `supabase/functions/create-checkout-session/*`, `src/components/payments/*`                               |
|       P0 | Configure push notifications (FCM/APNs) + verify on devices                  | Fix                                              | `docs/guides/integrations/notifications/FCM_SETUP.md`, Supabase secrets, `android/app/google-services.json` (local only), `ios/*` (local only)          |
|       P0 | Run production QA checklist + fix failures                                   | Fix                                              | `docs/guides/testing/PRODUCTION_TESTING_GUIDE.md`, targeted `src/**` as issues found                                                                    |
|       P0 | Android boot loader hang fix (Capacitor scheme + build sync)                 | Fix                                              | `capacitor.config.ts`, `docs/guides/build/MOBILE_BUILD_GUIDE.md`                                                                                        |
|       P0 | Privileged access: admin + super_admin = lifetime premium + gate bypass      | Fix                                              | `src/contexts/AuthContext.tsx`, `src/hooks/useUserRoles.ts`, `src/dlc/context/DLCContext.tsx`, `src/components/EmailVerificationGate.tsx`, RLS policies |
|       P0 | Remove placeholder URLs and make placeholders user-safe                      | Fix/Refactor                                     | `src/components/partnerSync/dateNights/DateNightMediaSection.tsx`, `src/config/urls.ts`                                                                 |
|       P0 | Scanner capture “Advanced Settings” sheet: replace placeholder with real UI  | Fix                                              | `src/scanner/ui/routes/ScannerCaptureScreen.tsx` (and/or new `src/scanner/ui/components/*`)                                                             |
|       P0 | Advanced Scanner Features: implement session loading (3D + batch)            | Fix                                              | `src/components/AdvancedScannerFeatures.tsx`, `src/lib/advancedScannerFeatures/api.ts`                                                                  |
|       P0 | Remove production `console.log` noise (route through logger; env-gated)      | Refactor                                         | `src/lib/navigation/navRun.ts`, `src/components/navigation/NavigationDropdown.tsx`, `src/lib/capacitor/*`, `src/dlc/context/DLCContext.tsx`             |
|       P1 | Accessibility audit + fixes on primary flows                                 | Fix                                              | `src/components/**`, `src/pages/**`, `eslint.config.js` (rules tuning only if needed)                                                                   |
|       P1 | Performance + bundle optimization pass (verify lazy boundaries)              | Refactor                                         | `src/pages/indexLazyTabs.ts`, heavy feature modules, `vite.config.ts`                                                                                   |
|       P2 | Social login (Google/Apple) via Supabase OAuth                               | New-Feature                                      | `src/pages/Auth.tsx`, `src/pages/AuthCallback.tsx`, `src/contexts/AuthContext.tsx`, docs update                                                         |
|       P2 | Biometric/AppLock UX completion                                              | Max-Feature                                      | `src/components/AppLock.tsx`, `src/hooks/useBiometricAuth.ts`                                                                                           |
|       P2 | Analytics Dashboard (privacy-compliant)                                      | New-Feature                                      | `src/lib/analytics.ts`, new `src/pages/AnalyticsDashboard.tsx`, admin routing if needed                                                                 |
|       P2 | DLC production hardening (idempotency/refunds/signed URLs/restore purchases) | Fix/Max-Feature                                  | `docs/archive/nsfw/NSFW_DLC_REMAINING_WORK.md`, `supabase/functions/stripe-webhook/index.ts`, new migration for webhook events table                    |
|       P3 | Mobile polish + store assets + compliance review                             | Max-Feature                                      | `docs/product/store/app-store-listing.md`, `docs/security/compliance/COMPLIANCE_DISTRIBUTION.md`, platform-specific assets                              |

---

## Immediate Next Actions (execution order)

1. **P0: Stripe secrets + webhook + price IDs**
2. **P0: Push secrets + device verification**
3. **P0: Execute production QA checklist**
4. **P0: Fix placeholder URLs / centralize outbound links**
5. **P0: Privileged access guarantee (admin/super_admin lifetime unlock)**
6. **P0: Replace remaining “would go here” UI placeholders (scanner capture + advanced scanner sessions)**
7. **P0: Remove production console logging noise (logger + env gating)**
8. **P1: Accessibility audit + performance/bundle pass**
9. **(Optional) DLC hardening** per `docs/archive/nsfw/NSFW_DLC_REMAINING_WORK.md`
