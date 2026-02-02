# Phase 1 — Analysis & Strategic Roadmap (Repo Reality-Based)

**Date**: 2025-12-24  
**Workspace**: `/workspace` (git repo)  
**Canonical product identity found in repo**: **MorphoScan Pro**  
**User-stated identity in rules**: **Pavement Performance Suite** (no supporting code found in `src/` for pavement/asphalt workflows)

This Phase 1 report is intentionally **reality-based**: it describes what is implemented in this codebase today, what is still missing to ship safely, and two clean paths forward:

- **Track A (Ship current product)**: Productionize MorphoScan Pro (SFW/NSFW/Hybrid variants) with Stripe + Push + Store submission.
- **Track B (Pivot)**: Stand up Pavement Performance Suite as a separate product surface (new domain model, workflows, UI), while keeping MorphoScan as a separate app or archiving it.

---

## Project Summary

### Purpose (as implemented)

MorphoScan Pro is a **privacy-first health tracking and “scanner” SPA** with:

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

## Repo Reality Check: Identity Mismatch

### What I found

- No code references for pavement/asphalt/sealcoating/line-striping/church parking workflows in `src/`.
- App routes and content are aligned to MorphoScan Pro’s health/DLC feature set.

### Options (recommended decision)

- **Option A — Ship MorphoScan Pro** (fastest path): treat Pavement Performance Suite as a future product and finish Phase 8 + integrations + store submission.
- **Option B — Pivot to Pavement Performance Suite** (clean architecture): keep MorphoScan as a separate branch/product; create a new domain module and UI, or a new repo/app shell, to avoid mixing regulated health content patterns with contractor workflow needs.

If you want Pavement Performance Suite to be the canonical product, Phase 1 recommends **Option B** to avoid “half-pivoting” the existing app into an unrelated domain.

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
- **Residual placeholder/legacy links exist** (e.g., `example.com` in several UI files).

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

### P3 — Optional expansions (only after ship-safety)

- **Admin platform improvements** (content import pipelines, audit trails, abuse prevention).
- **Advanced reporting** (export enhancements, compliance, retention rules UX).
- **More themes/wallpapers** (already partially present: wallpaper storage exists; expand only after a11y + performance budgets).

---

## Phased Implementation Roadmap (table)

| Priority | Task Description                                                             | Task Type (Max-Feature/New-Feature/Refactor/Fix) | Files to Modify/Create                                                                                                                                    |
| -------: | ---------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
|       P0 | Configure Stripe secrets + webhook endpoint + live price IDs                 | Fix                                              | `docs/guides/integrations/payments/STRIPE_SETUP_GUIDE.md`, Supabase secrets, `.env` (local only), `src/lib/pricing.ts`, `src/lib/stripe.ts`              |
|       P0 | End-to-end Stripe QA (subscription + DLC if used)                            | Fix                                              | `supabase/functions/stripe-webhook/index.ts`, `supabase/functions/create-checkout-session/*`, `src/components/payments/*`                                 |
|       P0 | Configure push notifications (FCM/APNs) + verify on devices                  | Fix                                              | `docs/guides/integrations/notifications/FCM_SETUP.md`, Supabase secrets, `android/app/google-services.json` (local only), `ios/*` (local only)            |
|       P0 | Run production QA checklist + fix failures                                   | Fix                                              | `docs/guides/testing/PRODUCTION_TESTING_GUIDE.md`, targeted `src/**` as issues found                                                                      |
|       P0 | Remove placeholder URLs (`example.com`) and centralize legal/support URLs    | Fix/Refactor                                     | `src/pages/Auth.tsx`, `src/components/payments/PaymentForm.tsx`, `src/components/APIWebhooks.tsx`, `src/__tests__/e2e/utils.ts`, new `src/config/urls.ts` |
|       P1 | Accessibility audit + fixes on primary flows                                 | Fix                                              | `src/components/**`, `src/pages/**`, `eslint.config.js` (rules tuning only if needed)                                                                     |
|       P1 | Performance + bundle optimization pass (verify lazy boundaries)              | Refactor                                         | `src/pages/indexLazyTabs.ts`, heavy feature modules, `vite.config.ts`                                                                                     |
|       P2 | Social login (Google/Apple) via Supabase OAuth                               | New-Feature                                      | `src/pages/Auth.tsx`, `src/pages/AuthCallback.tsx`, `src/contexts/AuthContext.tsx`, docs update                                                           |
|       P2 | Biometric/AppLock UX completion                                              | Max-Feature                                      | `src/components/AppLock.tsx`, `src/hooks/useBiometricAuth.ts`                                                                                             |
|       P2 | Analytics Dashboard (privacy-compliant)                                      | New-Feature                                      | `src/lib/analytics.ts`, new `src/pages/AnalyticsDashboard.tsx`, admin routing if needed                                                                   |
|       P2 | DLC production hardening (idempotency/refunds/signed URLs/restore purchases) | Fix/Max-Feature                                  | `docs/archive/nsfw/NSFW_DLC_REMAINING_WORK.md`, `supabase/functions/stripe-webhook/index.ts`, new migration for webhook events table                       |
|       P3 | Mobile polish + store assets + compliance review                             | Max-Feature                                      | `docs/product/store/app-store-listing.md`, `docs/security/compliance/COMPLIANCE_DISTRIBUTION.md`, platform-specific assets                                |

---

## Immediate Next Actions (execution order)

1. **P0: Stripe secrets + webhook + price IDs**
2. **P0: Push secrets + device verification**
3. **P0: Execute production QA checklist**
4. **P0: Fix placeholder URLs / centralize outbound links**
5. **P1: Accessibility audit + performance/bundle pass**
6. **(Optional) DLC hardening** per `docs/archive/nsfw/NSFW_DLC_REMAINING_WORK.md`
