## NSFW DLC System — Remaining Work (Production-Ready Roadmap)

This document captures **what is still left** to fully complete the NSFW DLC add‑on system to production standards (monetization-safe, compliant, offline-capable, and operationally maintainable).

### Current implemented baseline (already done)

- **DB-backed DLC runtime**: `src/dlc/core/DLCManager.ts` loads packages/licenses/installations from Supabase (with offline cache fallback).
- **Age verification gating**: `dlc_age_verifications` persisted in Supabase; UI gating enforced across NSFW feature entry points.
- **NSFW access status API**: `src/lib/featureFlags.ts` exposes `getNSFWAccessStatus()` used by NSFW pages.
- **DLC catalog alignment**: migration `supabase/migrations/20251212094000_dlc_catalog_and_stripe.sql` upserts 7 canonical packages into `dlc_packages`.
- **DLC Stripe checkout session (edge)**: `supabase/functions/create-dlc-checkout-session/index.ts`.
- **Stripe webhook license grant**: `supabase/functions/stripe-webhook/index.ts` grants `dlc_licenses` on `checkout.session.completed`.
- **Private content delivery (signed URLs)**: `supabase/functions/get-dlc-signed-url/index.ts` issues short-lived signed URLs with license + device checks (privileged bypass supported).
- **Encrypted content key delivery**: `supabase/functions/get-dlc-key/index.ts` returns per-package decryption keys when authorized (requires `DLC_KEYRING_MASTER_KEY_B64` secret).
- **Key rotation tooling**: `supabase/functions/admin-rotate-dlc-key/index.ts` (admin-only) rotates package keys in `dlc_package_keyring`.
- **Resumable chunk downloads**: `src/dlc/security/SecureDownloader.ts` supports pause/resume using IndexedDB chunk persistence.
- **Build + unit tests**: `npm run test:run` and `npm run build` pass.

---

## Priority 0 — Production blockers (must do)

### 0.1 Webhook idempotency (prevent duplicate grants)

- **Goal**: Stripe retries must not create duplicate or conflicting grants.
- **Implement**:
  - Add a table like `stripe_webhook_events` to store processed `event_id`, `processed_at`, `status`, and `metadata`.
  - In `supabase/functions/stripe-webhook/index.ts`, short-circuit if event already processed.
- **Acceptance**:
  - Replaying the same Stripe event **never** creates a second license, never changes license_key unexpectedly.

### 0.2 Refunds/chargebacks/disputes handling

- **Goal**: Paid access is revoked correctly when money is reversed.
- **Implement**:
  - Handle Stripe events like `charge.refunded`, `refund.updated`, `charge.dispute.created/closed`.
  - Map Stripe payment identifiers to `dlc_licenses.payment_id` and set:
    - `refunded_at`, `refund_reason`
    - `is_active=false`, `deactivated_at=NOW()`
  - Show “access revoked” UI states (graceful degradation).
- **Acceptance**:
  - Refunded purchase reliably revokes access across devices after refresh/online validation.

### 0.3 Stripe catalog mapping (real price IDs)

- **Goal**: Each package purchase uses a real Stripe Price, not inline price_data (for analytics/tax/catalog ops).
- **Implement**:
  - Populate `dlc_packages.stripe_price_id` and optional `stripe_product_id`.
  - Update `create-dlc-checkout-session` to require/validate `stripe_price_id` in production.
- **Acceptance**:
  - All purchases flow through Stripe catalog prices; no “fallback price_data” in production mode.

---

## Priority 1 — Secure content delivery (no placeholders; enforce privacy)

### 1.1 Private storage + signed URL delivery

- **Goal**: NSFW assets are not publicly enumerable; downloads/streams are authorized.
- **Implement**:
  - Create Supabase Storage bucket(s) (e.g. `nsfw-content`) with **private** access.
  - Add edge function(s) to issue **signed URLs** per user/license:
    - Input: `content_item_id`, `package_id`, desired quality/asset
    - Validate: user auth, active license, age verification
    - Output: signed URL with short TTL
- **Acceptance**:
  - Direct bucket URLs are not accessible; signed URLs expire; unauthorized users cannot fetch assets.

### 1.2 Populate real content tables (no mocks in prod)

- **Goal**: app reads content from Supabase tables/storage, not bundled sample datasets.
- **Implement**:
  - Populate:
    - `nsfw_positions_gallery`
    - `nsfw_video_content`
    - any related rating/favorites tables used by UI
  - Ensure required columns match UI queries (indexes, RLS).
- **Acceptance**:
  - Positions/Videos render from DB with pagination/search; no dev/prod runtime reliance on local mock content.

### 1.3 Admin import pipeline (safe, repeatable)

- **Goal**: add/update content without manual SQL edits.
- **Implement**:
  - Admin-only import tool (CSV/JSON) that:
    - validates schema
    - uploads assets to storage
    - upserts table records
    - logs failures and produces a report
- **Acceptance**:
  - Content can be added/updated in bulk with deterministic, auditable results.

---

## Priority 2 — Encryption & license-bound key management

### 2.1 Decide encryption model

Choose one and implement consistently:

- **Option A (recommended)**: encrypt assets in storage; decrypt client-side with per-license keys delivered by edge function (short-lived).
- **Option B**: encrypt “package bundles” as archives and decrypt locally after validated license.

### 2.2 Key issuance/rotation

- **Goal**: keys cannot be hardcoded; revocation and rotation are possible.
- **Implement**:
  - Store key references per package (`dlc_packages.encryption_key_id`) and per license encrypted key material (or a key derivation approach).
  - Edge function **already exists**: `get-dlc-key` (`supabase/functions/get-dlc-key/index.ts`) returns a decrypt key only if:
    - user authenticated
    - license active
    - device authorized
    - age verified
  - Configure Supabase secret: `DLC_KEYRING_MASTER_KEY_B64` (base64-encoded 32-byte key) for keyring decryption.
- **Acceptance**:
  - Keys rotate without re-shipping the app; compromised licenses can be revoked.

---

## Priority 3 — Offline-first completion (sync + integrity + restore)

### 3.1 Sync download progress to DB

- **Goal**: server reflects state (useful for restore, support, multi-device).
- **Implement**:
  - Write progress updates to `dlc_downloads` and/or `dlc_download_queue` (pick one canonical source; avoid duplication).
  - On startup, reconcile DB state vs IndexedDB cached state.
- **Acceptance**:
  - Downloads resume after refresh; progress persists across sessions.

### 3.2 Integrity verification end-to-end

- **Goal**: detect corruption and tampering.
- **Implement**:
  - Ensure `dlc_packages.checksum_sha256` (or per-asset checksums) are populated.
  - Verify after download; mark installation corrupted if mismatch.
- **Acceptance**:
  - Corrupt assets are detected and re-downloaded automatically or with clear user action.

### 3.3 Restore/reinstall flows

- **Goal**: new device can restore purchases and content.
- **Implement**:
  - “Restore purchases” button → loads licenses from DB and re-downloads chosen packages/assets.
- **Acceptance**:
  - A user on a new device can regain access without support.

---

## Priority 4 — Device binding enforcement + management UX

### 4.1 Server-enforced device binding everywhere

- **Goal**: device limits cannot be bypassed.
- **Implement**:
  - Make `verify-dlc-license` (and key delivery, signed URLs) enforce:
    - device registration in `dlc_license_devices`
    - `max_devices`
    - device deactivation
- **Acceptance**:
  - Exceeding device limit is blocked reliably server-side.

### 4.2 Device management UI

- **Goal**: users can manage their own device activations.
- **Implement**:
  - Settings panel: list devices per license, deactivate device, mark “primary”.
- **Acceptance**:
  - User can free up a slot without contacting support.

---

## Priority 5 — Unified gating consistency (remove legacy patterns)

### 5.1 Remove remaining “example.com”/legacy purchase links

- Ensure **all** store CTAs use the in-app checkout flow.

### 5.2 Remove conflicting entitlement paths

- **Goal**: one source of truth for access checks.
- Consolidate:
  - subscription gating (`useFeatureAccess`) vs DLC gating (`useDLC/featureFlags`).
- **Acceptance**:
  - A DLC purchase unlocks the feature everywhere it should, without relying on subscription tier hacks.

---

## Priority 6 — Testing, CI, and observability

### 6.1 E2E purchase flow tests

- Purchase → webhook → license granted → age verify → access content.

### 6.2 Webhook tests

- Signature verification, retries, idempotency, refund events.

### 6.3 Operational dashboards/logging

- Track:
  - checkout session creation failures
  - webhook error rates
  - license grant latency
  - denied access reasons (age/device/expired)

---

## Inventory of key tables/functions involved

### Core DLC tables (package-based)

- `dlc_packages`
- `dlc_licenses`
- `dlc_license_devices`
- `dlc_installations`
- `dlc_downloads`
- `dlc_age_verifications`
- `dlc_update_sources`

### Legacy/alternate DLC tables present (needs consolidation)

- `dlc_packs`, `dlc_bundles`, `dlc_purchases`, `dlc_download_queue`, etc.

### Edge functions (current)

- `create-dlc-checkout-session` (new)
- `stripe-webhook` (updated to grant DLC licenses)
- `verify-dlc-license`, `get-dlc-content`, `check-dlc-updates`

---

## Recommended next implementation order

1. **Webhook idempotency + refunds/chargebacks** (production safety)
2. **Stripe price mapping** (real catalog IDs in `dlc_packages`)
3. **Signed URL delivery + content population pipeline**
4. **Encryption key delivery**
5. **Offline sync to DB + restore flows**
6. **Device management UI**
