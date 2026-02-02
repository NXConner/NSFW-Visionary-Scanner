# NSFW Remaining Work (2025-12-25)

This document lists **everything remaining** to fully harden, complete, and productionize the NSFW feature set and the new DLC/addon architecture added on 2025-12-25.

Related docs (already present):

- `docs/archive/nsfw/NSFW_DLC_REMAINING_WORK.md`
- `docs/tracking/PROJECT_REMAINING_WORK.md`
- `docs/archive/nsfw/NSFW_DLC_P2_CHECKLIST.md`

---

## 1) Critical blockers (must do before “real” NSFW scanner is complete)

### 1.1 NSFW on-device model dependency (currently missing)

- **Problem**: The environment could not install `@tensorflow-models/nsfwjs` (registry returned 404 / auth issues). The code intentionally degrades to `unknown` classification when the model isn’t available.
- **Goal**: Make on-device classification real and reliable in web + Capacitor builds.
- **Work**
  - Choose one of:
    - **Option A (preferred)**: pin a known-good NSFW model package that exists in npm and works with TFJS in Vite + Capacitor.
    - **Option B**: ship a bundled model file (weights) inside the app and load it from local assets (best for offline + store compliance).
    - **Option C**: server-side classification via Supabase Edge Function **only for direct builds** (not store builds), with strict privacy controls.
  - Add a test harness + performance budget (model load time, inference time).
- **Files**
  - `src/addons/nsfw-scanner/scanner/nsfwDetection.ts`
  - `src/addons/nsfw-scanner/settings/NsfwScannerSettingsCard.tsx`
  - `package.json` (+ lock)

---

## 2) NSFW Session Lock (hardening + UX polish)

### 2.1 Make session lock re-lock on inactivity/visibility changes (NSFW scope)

- **Current**: session lock is TTL-based on “last unlocked at”.
- **Add**
  - Activity listeners (mousemove/keydown/touch) to extend session.
  - Lock when app backgrounded / tab hidden.
  - “Lock now” button in Settings + NSFW Hub.
- **Files**
  - `src/lib/nsfwSessionLock.ts`
  - `src/components/nsfw/NsfwSessionGate.tsx`
  - `src/components/settings/panels/NsfwPrivacyControlsCard.tsx`
  - `src/components/nsfwDashboard/NSFWDashboard.tsx`

### 2.2 Use `requireBiometricIfAvailable`

- **Current**: setting exists but is not enforced.
- **Add**
  - If biometric is available and setting enabled: require biometric; fallback to PIN only if biometric not available.
- **Files**
  - `src/components/nsfw/NsfwSessionGate.tsx`
  - `src/lib/nsfwPrivacySettings.ts`

---

## 3) Incognito / redaction coverage (expand beyond NSFW videos)

### 3.1 Apply incognito/redaction settings across all NSFW surfaces

- **Current**: NSFW videos browse tab supports blur titles/thumbs and incognito hiding.
- **Add**
  - **Forum**: redact thread titles/previews in incognito mode.
  - **Topics Library**: redact titles + body previews in incognito mode (open reveals).
  - **Analytics**: redact graphs/labels in incognito mode (blur until tap).
  - **NSFW Hub**: minimize NSFW words when incognito is enabled.
- **Files**
  - `src/lib/nsfwPrivacySettings.ts`
  - `src/components/nsfwCommunityForum/*`
  - `src/components/nsfwTopics/NSFWTopicsLibrary.tsx`
  - `src/components/NSFWSexualWellnessAnalytics.tsx`
  - `src/components/nsfwDashboard/NSFWDashboard.tsx`

---

## 4) NSFW Scanner DLC “policy” completion (feature completeness)

### 4.1 Scanner policy should influence UI + storage consistently

- **Current**
  - Blocks saving if explicit detected and policy forbids.
  - Shows classification in scanner side panel.
- **Add**
  - Add a clear “why blocked” UI inside the scanner flow (not only toast).
  - Provide “retry with different thresholds” quick action (links to Settings card).
  - Store classification metadata (label/confidence) **only if user opts-in** (privacy).
- **Files**
  - `src/components/ScannerSection.tsx`
  - `src/components/scanner/ScannerSidePanel.tsx`
  - `src/addons/nsfw-scanner/settings/NsfwScannerSettingsCard.tsx`
  - `src/addons/nsfw-scanner/settings/storage.ts`

### 4.2 Add an audit log entry for policy blocks (local only)

- **Goal**: user can see “blocked due to policy” in Activity History (without storing the image).
- **Files**
  - `src/components/AuditTrail.tsx` (or relevant activity log subsystem)
  - `src/lib/nsfwSessionLock.ts` / new helper module

---

## 5) DLC/addon system productionization

### 5.1 Formalize addon manifests + versioning strategy

- **Add**
  - semantic versioning rules
  - compatibility matrix with `minAppVersion`
  - “addon registry” UI (admin-only) to list loaded addons, versions, and runtime status
- **Files**
  - `src/addons/*`
  - `src/pages/AdminDLC.tsx` (or a new admin settings panel)

### 5.2 Avoid divergence between DB DLC catalog and code fallback registry

- **Problem**: DB catalog is primary, code registry is fallback; they can drift.
- **Add**
  - A validation script that compares DB `dlc_packages` rows to `src/dlc/core/dlcRegistryParts/*` and addon-registered packages.
- **Files**
  - `scripts/validate-dlc-import.ts` (extend)
  - new `scripts/validate-dlc-catalog.ts`

---

## 6) NSFW content pipelines (videos/topics/forum) “done-done” checklist

### 6.1 Videos

- Offline downloads: enforce device caps, expiration handling UI, renewal flows
- Playback: robust signed URL refresh + cache-first policy improvements
- Creator metadata: verification, reporting, removal workflow
- **Files**
  - `src/lib/nsfwVideoDelivery.ts`
  - `src/lib/nsfwVideoDownloads.ts`
  - `src/components/nsfwVideoContent/*`
  - Supabase functions: `get-dlc-signed-url`, `get-dlc-content`, `merge-video-chunks`

### 6.2 Topics

- Admin import UX: validation errors surfaced, dry-run, rollback
- Content rating tiers: `educational | demonstrative | explicit` drive UI redaction + session lock defaults
- **Files**
  - `src/components/dlc/admin/DLCContentImport.tsx`
  - `supabase/functions/admin-import-dlc-content/*`
  - `docs/dlc-content/templates/topics.csv`

### 6.3 Forum

- Moderation tools: report queues, rate limiting, auto-safety filters
- Trust tiers: verified users, anonymous posting rules
- **Files**
  - `src/components/nsfwCommunityForum/*`
  - `supabase/migrations/*` (forum tables/policies if not complete)

---

## 7) Security + compliance for NSFW distribution

### 7.1 Store vs direct distribution rules

- Make sure NSFW content never loads in store builds (already partially enforced via `featureFlags.ts`).
- Add unit tests ensuring no external NSFW sources are requested in SFW/hybrid store modes.
- **Files**
  - `src/lib/featureFlags.ts`
  - `src/lib/visualContentManager.ts`
  - Add tests under `src/lib/__tests__/`

### 7.2 “Panic exit” + safe notifications

- Panic exit button in NSFW hub and NSFW tabs.
- Safe push/email templates without explicit strings.
- **Files**
  - `src/components/nsfwDashboard/NSFWDashboard.tsx`
  - `src/components/Header.tsx` (optional global affordance)
  - `supabase/functions/send-push-notification/index.ts`
  - `supabase/functions/send-email/index.ts`

---

## 8) Testing gaps to close

### 8.1 Automated tests for new NSFW privacy controls + session gate

- Add component tests for:
  - incognito hides titles
  - blur thumbnails toggles CSS
  - session lock blocks NSFW tabs and can unlock with PIN
- **Files**
  - new: `src/components/__tests__/NsfwSessionGate.test.tsx`
  - new: `src/components/__tests__/NsfwPrivacyControlsCard.test.tsx`
  - extend: `src/components/__tests__/ScannerSection.test.tsx` (NSFW policy block)

### 8.2 E2E flows (Playwright)

- Verify:
  - no NSFW menu items without DLC
  - with DLC + age verified: NSFW hub opens
  - with session lock enabled: gate blocks and unlocks
- **Files**
  - `e2e/*` (add `nsfw-session-lock.spec.ts`, `nsfw-gating.spec.ts`)

---

## 9) UX polish / product expansion (recommended)

- Add a dedicated **NSFW Settings** page route (instead of only a card)
- Add “Entitlement map” tiles to **NSFWAddOnsLandingPage** for clearer upsell
- Add “Incognito banner” indicator in NSFW tabs when enabled
- Add per-feature “privacy mode” defaults (videos blur ON, forum titles hidden ON, etc.)

---

## 10) Quick reference: newly added/affected files (2025-12-25 work)

- NSFW privacy + lock:
  - `src/lib/nsfwPrivacySettings.ts`
  - `src/lib/nsfwSessionLock.ts`
  - `src/components/nsfw/NsfwSessionGate.tsx`
  - `src/components/settings/panels/NsfwPrivacyControlsCard.tsx`
  - `src/components/nsfwDashboard/NSFWDashboard.tsx`
  - `src/pages/indexTabContent.tsx`
  - `src/pages/NSFWDashboardPage.tsx`
  - `src/pages/NSFWTopicsPage.tsx`
  - `src/components/nsfwVideoContent/NSFWVideoContent.tsx`
  - `src/components/nsfwVideoContent/tabs/BrowseTab.tsx`

- DLC fallback completion:
  - `src/dlc/core/dlcRegistryParts/packages.ts`
  - `src/dlc/core/dlcRegistryParts/manifests.ts`

- Addon architecture:
  - `src/addons/*`
  - `src/addons/nsfw-scanner/*`
