# Visionary Scanner Suite
**MorphoScan Pro (SFW/store)** • **NSFW Visionary Scanner (direct)** • **Hybrid (direct)**

Privacy-first, cross-platform health self-assessment and tracking suite built with **Vite + React + TypeScript** and shipped as:

- **Web SPA / PWA** (offline-capable; Workbox via `vite-plugin-pwa`)
- **Native mobile apps** via **Capacitor** (`android/`, `ios/`)
- **Supabase backend** (Postgres + RLS, Storage, Edge Functions) for auth, content delivery, payments, notifications, and optional server-side analysis

> **Medical disclaimer:** This project provides educational/self-tracking tools. It is **not** a medical device and does **not** provide medical diagnoses. For medical concerns, consult a qualified healthcare professional.

---

## What this repository contains

### Frontend (client app)
- **React 18 + React Router** single-page application (`src/`)
- **shadcn/ui + Radix UI + Tailwind CSS** component system (`src/components/ui/`, `tailwind.config.ts`)
- **State/data**:
  - Local encrypted storage for sensitive user data (`useEncryptedStorage` via `src/contexts/DataContext.tsx`)
  - React Query for async data (`@tanstack/react-query`)
  - App-wide providers: Auth, Settings, Data, DLC, i18n (`src/App.tsx`)
- **Accessibility**: skip links + color-blind filters + automated audit tooling (`eslint-plugin-jsx-a11y`, `npm run a11y:audit`)
- **Internationalization**: i18n provider + multiple languages (`src/lib/i18nSystem/translations/*`)
- **Observability**: Sentry + structured logging with secret redaction (`src/lib/sentry.ts`, `src/lib/logger.ts`)

### Mobile (Capacitor)
- Capacitor config: `capacitor.config.json` (App ID `com.morphoscan.pro`, `webDir=dist`)
- Native projects:
  - Android: `android/`
  - iOS: `ios/`
- Native capabilities (via Capacitor plugins): camera, filesystem, push notifications, local notifications, splash screen, status bar

### Backend (Supabase)
- Database migrations: `supabase/migrations/*.sql` (large schema with mandatory RLS patterns)
- Edge Functions (Deno): `supabase/functions/*` (auth-protected APIs, scheduled jobs, webhooks)
- Generated DB types: `src/integrations/supabase/types.ts` (from `supabase gen types`)

### Automation & Ops
- Scripts: `scripts/` (setup, migrations, seeding, verification, release ops, audits)
- CI/CD workflows: `.github/workflows/*` (lint/test/build, Supabase type checks, security scanning, release gates, optional deploy)
- Load tests: `performance-tests/` (k6)
- E2E tests: `e2e/` (Playwright)

---

## Editions, build flavors, and content policy

This repo supports **build-time** and **runtime** gating to keep store builds compliant while enabling direct/off-platform variants.

### Build flavors
| Flavor | Intended distribution | Env | What it means |
|---|---|---|---|
| **SFW** | App Store / Play Store | `VITE_APP_VERSION=sfw` | Safe-for-work bundle; adult-only code paths are not intended to ship |
| **NSFW** | Direct distribution only | `VITE_APP_VERSION=nsfw` | Adult-only surfaces can be enabled (still gated/entitled) |
| **Hybrid** | Direct distribution | `VITE_APP_VERSION=hybrid` | Suite mode: SFW base + DLC/unlocks |

### Distribution channels
| Channel | Env | Notes |
|---|---|---|
| Store | `VITE_DISTRIBUTION_CHANNEL=store` | Store builds must not include adult-only bundle surfaces |
| Direct | `VITE_DISTRIBUTION_CHANNEL=direct` | Deep links and optional modules can be shipped |

### Hard bundle gating for adult-only code
- Build-time constant: `BUILD_ALLOW_ADULT_BUNDLE` (`src/lib/buildFlags.ts`)
- Policy switch: `VITE_CONTENT_POLICY` + host detection (`src/lib/featureFlags.ts`)

**Reference:** `docs/guides/deployment/SFW_NSFW_RELEASE_OPTIONS.md`

---

## Feature inventory (what the app can do)

This section is driven by the actual route registry (`src/App.tsx`), tab catalog (`src/lib/navigation/navCatalog.ts`), and feature/tab routing (`src/lib/navigation/tabRouting.ts`).

### 1) Core app shell & UX foundations
- First-run onboarding tutorial (`src/components/OnboardingTutorial`)
- Email verification gate for protected app routes (`src/components/EmailVerificationGate`)
- App lock / session lock (including mobile hardening) (`src/components/AppLock`, `src/lib/__tests__/nsfwSessionLock.test.ts`)
- Offline indicator + PWA-aware startup hardening (`src/components/OfflineIndicator`, `src/pwa/*`, `src/main.tsx`)
- Command palette + global keyboard shortcuts (`src/components/commandPalette`, `src/hooks/useKeyboardShortcuts`)
- Theme system, visual effects, and user personalization (e.g., wallpapers) (`src/components/settings/WallpaperPicker.tsx`, `src/lib/visualEffectsSettings.ts`)

### 2) Scanner & measurement system (primary capability)
- Unified scanner UX (consolidated scanner experiences) (`src/components/scanner/UnifiedScannerPage.tsx`)
- Camera capture:
  - Browser `getUserMedia` + device selection (`src/scanner/capture/*`)
  - Capacitor camera integration for mobile (`src/scanner/capture/capacitorCamera.ts`)
  - Multi-angle capture support (`src/scanner/capture/multiAngleCapture.ts`)
  - Permissions hardening (including Android-specific handling) (`src/scanner/capture/androidPermissions.ts`)
- Real-time overlays and guidance:
  - AR-style measurement guides, prompts, detection points (`src/scanner/overlays/ar/*`)
  - Overlay rendering layers + presets (`src/scanner/overlays/rendering/*`, `src/scanner/overlays/guides/*`)
  - Live quality scoring (`src/scanner/quality/*`, `src/components/scanner/telemetry/useLiveQualityMetrics.ts`)
- Deterministic/local processing pipeline (web worker):
  - Preprocess → edge detection → contour extraction → curve fit → curvature → length/girth estimation → confidence scoring
  - Pipeline: `src/scanner/processing/pipeline.ts`
  - Steps: `src/scanner/processing/steps/*`
  - Worker: `src/scanner/processing/worker/*`
- Calibration profiles + device capability modeling (`src/scanner/calibration/*`, `src/scanner/utils/platform/*`)
- Scan history and results routes:
  - `/scanner/capture`, `/scanner/history`, `/scanner/results`, `/scanner/settings` (`src/App.tsx`, `src/scanner/ui/routes/*`)

### 3) Progress, tracking, and analytics
- Progress hub (charts, trends, comparisons) (`src/components/hubs/ProgressHub.tsx`, `recharts`)
- Encrypted local diary + calendar view (`src/components/HealthDiarySection.tsx`, `src/contexts/DataContext.tsx`)
- Progress photos and comparison tooling (`src/components/ProgressPhotos.tsx`, `src/components/PEProgressPhotos.tsx`)
- Habit tracking and reminders (`src/components/HabitTracker.tsx`, `src/lib/healthTracking/*`)
- Advanced reporting + export workflows (PDF + structured exports) (`src/components/AdvancedReportingSystem.tsx`, `jspdf`)
- Medical-grade export formats:
  - HL7 FHIR bundle export (`src/lib/medicalExport.ts`)
  - CDA document export (`src/lib/medicalExport.ts`)

### 4) Learning, guidance, and support surfaces
- Educational centers, guides, interactive learning (`src/components/EducationCenter.tsx`, `src/components/InteractiveLearning.tsx`)
- Emergency guidance system (`src/components/EmergencyGuidance.tsx`)
- Provider locator (`src/components/PhysicianLocator.tsx`)
- AI-assisted educational/help content surfaces (UI-level) (`src/components/AIHealthChatbot.tsx`, `src/components/AIHealthInsights.tsx`)

### 5) Partner Sync & relationship tooling (opt-in)
- Partner connection + permissions + consent (`src/components/partnerSync/*`, `src/lib/partnerSync/*`)
- Date night planning system (planner, templates, history) (`src/components/partnerSync/DateNightHub.tsx`)
- Thought pings and shared planning flows (`src/components/partnerSync/thoughtPings/*`)
- Realtime sync layer (`src/lib/partnerSync/realtime.ts`)

### 6) Accounts, privacy, and security controls
- Auth flows (email + social login surfaces) (`src/pages/Auth.tsx`, `src/components/SocialLoginButtons.tsx`)
- Privacy dashboard and enhanced privacy controls (`src/components/PrivacyDashboard.tsx`, `src/components/EnhancedPrivacyControls.tsx`)
- Data retention settings + cleanup automation (`src/components/DataRetentionSettings.tsx`, `supabase/functions/data-retention-cleanup`)
- Audit trail / activity history (`src/components/AuditTrail.tsx`, `src/lib/auditLogStorage.ts`)
- Content Security Policy generation + security headers (client-side) (`src/lib/security.ts`)

### 7) Monetization: subscriptions, DLC, add-ons, marketplace
- Stripe integration for subscriptions, checkout sessions, billing portal (`src/lib/stripe.ts`, `supabase/functions/*checkout*`, `supabase/functions/*subscription*`)
- DLC store + secure delivery:
  - DLC manager/registry/download manager (`src/dlc/core/*`)
  - License validation + activation UI (`src/dlc/core/LicenseValidator.ts`, `src/dlc/components/LicenseActivation.tsx`)
  - Secure downloader, integrity checks, content encryption (`src/dlc/security/*`)
  - Feature gating component (`src/dlc/components/FeatureGate.tsx`)
- Add-on/plugin architecture (contributions loaded at boot) (`src/addons/*`, `bootstrapAddons()` in `src/App.tsx`)
- DLC packages catalog (examples) (`src/lib/dlc-packages.ts`)

### 8) Admin tooling
- Admin dashboard and deep links:
  - `/admin`, `/admin/users`, `/admin/content`, `/admin/analytics`, `/admin/settings`, `/admin/database`
  - `/admin/dlc` for DLC management
  - `/admin/nsfw` for adult content operations (when bundled)
- DLC content import pipeline:
  - Admin UI importer: `src/components/dlc/admin/DLCContentImport.tsx`
  - Edge importer: `supabase/functions/admin-import-dlc-content/index.ts`
  - Signed upload/delivery: `supabase/functions/get-dlc-signed-upload-url`, `get-dlc-signed-url`

### 9) Optional adult-only surfaces (direct builds only)
This repo includes optional adult-only modules and admin tooling **behind build-time gates** and **runtime entitlements**.

- Adult content UI is only bundled when `BUILD_ALLOW_ADULT_BUNDLE` is true (`src/lib/buildFlags.ts`).
- Actual adult media payload is not committed; it is uploaded/imported into Supabase.

**Reference:** `docs/product/dlc/dlc-content/README.md` and `docs/product/dlc/NSFW_CONTENT_LICENSING.md`

---

## Backend API surface (Supabase Edge Functions)

Edge Functions are configured in `supabase/config.toml` and implemented under `supabase/functions/`.

### Function groups (high level)
- **Scanner APIs:** `scan-upload`, `scan-analyze`, `scan-history`
- **AI (opt-in):** `ai-health-chat`, `ai-scan-analysis`, `ai-progress-analysis`, `generate-health-insights`, `analyze-health-patterns`, `predict-health-trends`, `ai-routine-recommendations`
- **Payments (Stripe):** `stripe-webhook`, `create-*checkout-session`, `create-subscription`, `update-subscription`, `cancel-subscription`, `reactivate-subscription`, `create-billing-portal-session`
- **DLC/content delivery:** `get-dlc-content`, `get-dlc-key`, `verify-dlc-license`, `check-dlc-updates`, `get-dlc-signed-url`, `get-dlc-signed-upload-url`, `admin-dlc-catalog`, `admin-dlc-toggles`, `admin-import-dlc-content`, `admin-rotate-dlc-key`, `admin-rollback-dlc-import`
- **Notifications & comms:** `register-device-token`, `send-push-notification`, `send-email`, `send-weekly-report`, `send-health-reminder`, `send-medication-reminder`
- **Data lifecycle:** `data-retention-cleanup`, `delete-user-account`
- **Referrals:** `generate-referral-code`, `apply-referral-code`
- **Video tooling:** `merge-video-chunks`, `video-editing`
- **Infrastructure:** `rate-limit-middleware`, `verify-webhook`

### OpenAPI / Swagger
- Docs: `docs/api/API.md`
- Generated spec: `docs/api/swagger.json`
- Generator: `npm run api:openapi`

---

## Repository map

```text
.
├── src/                      # React app (routes, components, scanner engine, DLC/add-ons)
├── supabase/
│   ├── migrations/           # Postgres schema + RLS policies
│   ├── functions/            # Edge Functions (Deno)
│   └── config.toml           # Function toggles + JWT verification flags
├── scripts/                  # Setup, seeding, audits, release automation
├── docs/                     # Canonical documentation (setup, security, product, ops)
├── e2e/                      # Playwright end-to-end tests
├── performance-tests/        # k6 load tests
├── android/                  # Capacitor Android project
├── ios/                      # Capacitor iOS project
├── dist/                     # Built output (tracked here)
└── .github/workflows/        # CI, release readiness, manual deploy
```

---

## Key commands (PowerShell-first)

> Many docs use PowerShell; on macOS/Linux, run equivalent shell commands.

```powershell
# Install
npm install

# Dev server (http://localhost:8080)
npm run dev

# Unit tests (Vitest) + E2E (Playwright)
npm run test:run
npm run test:e2e

# Lint/format
npm run lint
npm run format

# Production build / preview
npm run build
npm run preview
```

### Supabase (local)
```powershell
npm run db:start
npm run db:reset
npm run db:types
```

---

## Documentation index (start here)

### Setup / environment
- `.env` template: `.env.example` (do not commit real secrets)
- Setup guide: `docs/guides/setup/SETUP_GUIDE.md`
- Quick commands: `docs/QUICK_REFERENCE.md`
- Production env: `docs/guides/setup/PRODUCTION_ENV_SETUP.md`

### Mobile builds
- Mobile build guide: `docs/MOBILE_BUILD_GUIDE.md` and `docs/guides/build/MOBILE_BUILD_GUIDE.md`

### Payments (Stripe)
- `docs/STRIPE_SETUP_GUIDE.md` and `docs/guides/integrations/payments/STRIPE_SETUP_GUIDE.md`

### Security / compliance
- Baseline: `docs/security/baseline/SECURITY_BASELINE.md`
- RLS checklist: `docs/security/rls/RLS_AUDIT_CHECKLIST.md`
- Secrets manager guidance: `docs/security/secrets/secrets-manager.md`
- Data retention policy: `docs/security/retention/DATA_RETENTION_POLICY.md`

### DLC + content import (adult-only payload is not shipped)
- Import kit: `docs/product/dlc/dlc-content/README.md`
- Licensing: `docs/product/dlc/NSFW_CONTENT_LICENSING.md`

### Status / tracking
- Current status: `docs/reports/CURRENT_STATUS.md`
- Canonical tracker: `docs/tracking/PROJECT_TRACKER.md`

---

## Notes & design intent (important)

- **Local-first privacy:** sensitive tracking data is stored locally using encrypted storage helpers (see `src/contexts/DataContext.tsx` and `src/lib/security.ts`).
- **Backend-required features:** auth, DLC/content delivery, payments, notifications, admin tools, and optional server-side scan analysis depend on Supabase configuration (`VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`).
- **AI features are opt-in:** server-side AI endpoints are disabled unless explicitly enabled via Edge Function secrets/env (see `supabase/functions/*ai*`).
- **Adult-only payload is not committed:** tooling exists to import real media into Supabase; the repo ships the system, not the media.

