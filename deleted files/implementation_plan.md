# Implementation Plan (Merged) — MorphoScan Pro

**Last updated:** 2025-12-28  
**Scope:** Merge/normalize existing plans + add the concrete work plan for the current branch.  

## Canonical source-of-truth pointers (existing)

- **Master doc**: `docs/tracking/CONSOLIDATED_DOCS_MASTER.md`
- **Engineering roadmap / Phase notes**: `docs/product/roadmap/PHASE_1_ANALYSIS_STRATEGIC_ROADMAP.md`
- **NSFW/DLC production hardening**: `docs/archive/nsfw/NSFW_DLC_P2_CHECKLIST.md`, `docs/archive/nsfw/NSFW_DLC_REMAINING_WORK.md`
- **Release QA**: `docs/guides/testing/PRODUCTION_TESTING_GUIDE.md`
- **Mobile builds**: `docs/guides/build/MOBILE_BUILD_GUIDE.md`
- **Stripe**: `docs/guides/integrations/payments/STRIPE_SETUP_GUIDE.md`

This file consolidates *what we’re doing now* (fixes + next steps) to avoid scattered trackers.

---

## What was fixed/added in this pass (high-signal)

### Settings — Visual effects

- Fixed the image filter pipeline rendering into a **0×0 canvas** by switching to intrinsic dimensions (`naturalWidth/naturalHeight`).
  - Files: `src/lib/imageFilters.ts`, `src/lib/visualEffectsSettings.ts`

### Positions — “make it work” + real population path

- Added an **Admin one-click auto import** that builds a real positions import payload and upserts into `nsfw_positions_gallery` via the existing edge function `admin-import-dlc-content`.
  - UI: `Admin → DLC → Content Import → Positions → Auto import now`
  - Files:
    - `src/components/dlc/admin/DLCContentImport.tsx`
    - `src/lib/positions/adminImport/*` (new)
- Removed duplicate Positions Gallery logic from the DLC module wrapper to keep one source of truth.
  - Files: `src/dlc/modules/PositionsGallery.tsx` (now delegates to `src/components/PositionsGallery.tsx`)
- Unified NSFW “advanced positions” tab data source to the canonical positions table (`nsfw_positions_gallery`) and canonical favorites table (`nsfw_positions_favorites`).
  - Files: `src/lib/nsfwAdvancedFeatures/positions.ts`, `src/components/nsfwAdvancedFeatures/tabs/PositionsTab.tsx`

### Measurements — “vs average man” upgraded

- Added population percentile ranges (P5/P50/P95) and a richer percentile gauge visualization (still privacy-safe; no sensitive distribution uploads).
  - Files:
    - `src/lib/measurementsComparison/baselines.ts`
    - `src/components/measurementsComparison/components/PopulationPercentileGauge.tsx` (new)
    - `src/components/measurementsComparison/MeasurementsComparisonCard.tsx`

### Growers vs Showers + navigation consistency

- Verified Growers-vs-Showers route exists (`/growers-vs-showers`) and ensured it uses the same global navigation UI.
- Standardized standalone route pages on `RouteTopNav` so the navigation menu is consistent across pages.
  - Files:
    - `src/pages/growersVsShowers/GrowersVsShowersPage.tsx`
    - `src/pages/DLCStorePage.tsx`
    - `src/pages/TermsOfService.tsx`
    - `src/pages/TermsOfServicePage.tsx`
    - `src/pages/PrivacyPolicy.tsx`
    - `src/pages/CreditsResources.tsx`
    - `src/pages/NSFWAddOnsLandingPage.tsx`

---

## Immediate action checklist (do this next)

### 1) Populate the Positions DB (required for “Positions” to show content)

1. Open **Admin → DLC**
2. Go to **Admin DLC — Content Import**
3. Stay on **Positions**
4. Toggle **Dry-run: ON** first → run **Dry-run auto import**
5. If results are clean (no category constraint failures), toggle **Dry-run: OFF** → run **Auto import now**

Expected outcome:
- `nsfw_positions_gallery` has a large catalog (up to ~2000 entries per run limit)
- `Positions Gallery` and the NSFW advanced positions tab both render real content

### 2) Verify “Growers vs Showers” navigation

- Use the global nav dropdown to open **Growers vs Showers** (`/growers-vs-showers`).

### 3) Quick sanity pass for the “visual effects” setting

- Toggle a filter in **Settings → Visual Effects** and capture a scan; the saved image should show the effect.

---

## Prioritized backlog (merged + de-duplicated)

### P0 — Launch safety (from existing canonical docs)

- **Production device QA** (Android/iOS physical devices): follow `docs/guides/testing/PRODUCTION_TESTING_GUIDE.md`
- **Stripe production readiness**: catalog mapping + webhook verification (`docs/guides/integrations/payments/STRIPE_SETUP_GUIDE.md`)
- **Push notifications**: FCM/APNs secrets + device verification (`docs/guides/integrations/notifications/FCM_SETUP.md`)

### P0 — NSFW/DLC correctness & operational safety

Follow `docs/archive/nsfw/NSFW_DLC_P2_CHECKLIST.md` / `docs/archive/nsfw/NSFW_DLC_REMAINING_WORK.md`, especially:

- Webhook-side consistency checks (package existence / mapping validation)
- E2E for restore purchases + device management
- Structured “denied reason” observability across age/license/device gating

### P1 — Polish & optimization

- Accessibility audit + fixes
- Performance/bundle optimization

---

## Notes on “website” sources for positions

This codebase has explicit GitHub sources configured (see `src/lib/githubImageFetcher.ts` and `src/lib/visualContentManager.ts`).  
If there are additional website sources you’ve embedded elsewhere (e.g., in `docs/dlc-content/*` or other modules), add them to the admin import pipeline as another generator source (same `admin-import-dlc-content` edge function).
