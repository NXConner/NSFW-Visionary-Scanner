# Phase 1 — Analysis & Strategic Roadmap (Repo Reality-Based)

**Date**: 2026-02-12  
**Workspace**: `/workspace` (git repo)  
**Canonical product identity found in repo**: **Visionary Scanner Suite** (MorphoScan Pro + NSFW Visionary Scanner)

This Phase 1 report is intentionally **reality-based**: it describes what is implemented in this codebase today, what is still missing to ship safely, and the chosen path forward:

- **Track A (Ship current product)**: Productionize Visionary Scanner Suite (SFW/NSFW/Hybrid variants) with Stripe + Push + Store submission.

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
- **Residual placeholder/legacy links exist** (e.g., `example.com` in several UI files).
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

- **P0.6 Remove production mocks/stubs for real backend integrations**
  - Replace the **client-side mock AI response** in `src/components/AIHealthChatbot.tsx` with a real call to the **`ai-health-chat`** Edge Function.
  - Fix **client/server contract mismatches** for `ai-health-chat` (some callers send `{ message, context }` while the function expects `{ messages: [...] }` and streams SSE).
  - Replace the **`VideoCaptureTab` mock sessions** with real `multi_camera_sessions` data and persist actual recordings to Storage/DB.

- **P0.7 Align DB constraints with UI-supported options**
  - `multi_camera_sessions.quality` constraint currently excludes `"2k"` while UI + recording utilities support `"2k"`.
  - Add a forward migration to include `"2k"` and update type unions accordingly.

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
  - Next: implement real thumbnail generation and upgrade the current `compressVideo()` stub to a best-effort encoder with graceful fallback.

### P3 — Optional expansions (only after ship-safety)

- **Admin platform improvements** (content import pipelines, audit trails, abuse prevention).
- **Advanced reporting** (export enhancements, compliance, retention rules UX).
- **More themes/wallpapers** (already partially present: wallpaper storage exists; expand only after a11y + performance budgets).

---

## Phased Implementation Roadmap (table)

| Priority | Task Description                                                             | Task Type (Max-Feature/New-Feature/Refactor/Fix) | Files to Modify/Create                                                                                                                                    |
| -------: | ---------------------------------------------------------------------------- | ------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
|       P0 | Configure Stripe secrets + webhook endpoint + live price IDs                 | Fix                                              | `docs/guides/integrations/payments/STRIPE_SETUP_GUIDE.md`, Supabase secrets, `.env` (local only), `src/lib/pricing.ts`, `src/lib/stripe.ts`               |
|       P0 | End-to-end Stripe QA (subscription + DLC if used)                            | Fix                                              | `supabase/functions/stripe-webhook/index.ts`, `supabase/functions/create-checkout-session/*`, `src/components/payments/*`                                 |
|       P0 | Configure push notifications (FCM/APNs) + verify on devices                  | Fix                                              | `docs/guides/integrations/notifications/FCM_SETUP.md`, Supabase secrets, `android/app/google-services.json` (local only), `ios/*` (local only)            |
|       P0 | Run production QA checklist + fix failures                                   | Fix                                              | `docs/guides/testing/PRODUCTION_TESTING_GUIDE.md`, targeted `src/**` as issues found                                                                      |
|       P0 | Android boot loader hang fix (Capacitor scheme + build sync)                 | Fix                                              | `capacitor.config.ts`, `docs/guides/build/MOBILE_BUILD_GUIDE.md`                                                                                          |
|       P0 | Remove placeholder URLs (`example.com`) and centralize legal/support URLs    | Fix/Refactor                                     | `src/components/partnerSync/dateNights/DateNightMediaSection.tsx`, tests containing `example.com`, new `src/config/urls.ts`                                |
|       P0 | Replace AIHealthChatbot mock response with real Edge Function streaming      | Fix                                              | `src/components/AIHealthChatbot.tsx`, new `src/lib/edge/aiHealthChat.ts`, update `src/components/__tests__/AIHealthChatbot.test.tsx`                        |
|       P0 | Fix `ai-health-chat` contract mismatch across callers                        | Fix/Refactor                                     | `src/lib/liveSupportChat.ts`, any callers using `supabase.functions.invoke("ai-health-chat")`                                                             |
|       P0 | Replace VideoCaptureTab `mockSessions` with real `multi_camera_sessions`     | Fix/Refactor                                     | `src/components/videoCapture/VideoCaptureTab.tsx`, `src/lib/nsfwAdvancedFeatures/multiCamera.ts`, shared session helpers                                   |
|       P0 | Add `"2k"` support to `multi_camera_sessions.quality` constraint + types     | Fix                                              | new migration under `supabase/migrations/`, `src/lib/nsfwAdvancedFeatures/types.ts`                                                                        |
|       P1 | Accessibility audit + fixes on primary flows                                 | Fix                                              | `src/components/**`, `src/pages/**`, `eslint.config.js` (rules tuning only if needed)                                                                     |
|       P1 | Performance + bundle optimization pass (verify lazy boundaries)              | Refactor                                         | `src/pages/indexLazyTabs.ts`, heavy feature modules, `vite.config.ts`                                                                                     |
|       P2 | Social login (Google/Apple) via Supabase OAuth                               | New-Feature                                      | `src/pages/Auth.tsx`, `src/pages/AuthCallback.tsx`, `src/contexts/AuthContext.tsx`, docs update                                                           |
|       P2 | Biometric/AppLock UX completion                                              | Max-Feature                                      | `src/components/AppLock.tsx`, `src/hooks/useBiometricAuth.ts`                                                                                             |
|       P2 | Analytics Dashboard (privacy-compliant)                                      | New-Feature                                      | `src/lib/analytics.ts`, new `src/pages/AnalyticsDashboard.tsx`, admin routing if needed                                                                   |
|       P2 | DLC production hardening (idempotency/refunds/signed URLs/restore purchases) | Fix/Max-Feature                                  | `docs/archive/nsfw/NSFW_DLC_REMAINING_WORK.md`, `supabase/functions/stripe-webhook/index.ts`, new migration for webhook events table                      |
|       P3 | Mobile polish + store assets + compliance review                             | Max-Feature                                      | `docs/product/store/app-store-listing.md`, `docs/security/compliance/COMPLIANCE_DISTRIBUTION.md`, platform-specific assets                                |

---

## Immediate Next Actions (execution order)

1. **P0: Stripe secrets + webhook + price IDs**
2. **P0: Push secrets + device verification**
3. **P0: Execute production QA checklist**
4. **P0: Fix placeholder URLs / centralize outbound links**
5. **P0: Replace production mocks/stubs (AI chatbot + video capture sessions)**
6. **P0: Align DB constraints/types (multi-camera quality = include 2k)**
7. **P1: Accessibility audit + performance/bundle pass**
8. **(Optional) DLC hardening** per `docs/archive/nsfw/NSFW_DLC_REMAINING_WORK.md`
