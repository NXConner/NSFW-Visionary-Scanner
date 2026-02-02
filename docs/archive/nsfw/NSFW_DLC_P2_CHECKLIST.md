## P2 — NSFW/DLC Completion Checklist (Production)

> Scope: Stripe-safe monetization, private content delivery, real content population (no bundled mocks in prod), admin operations, key management, restore/devices UX, and E2E+observability.

### 0) Webhook idempotency + refunds/chargebacks/disputes revocation

- [x] **Stripe webhook idempotency ledger**
  - **DB**: `supabase/migrations/20251213000000_stripe_webhook_events.sql` (+ compat `supabase/migrations/20251215020000_stripe_webhook_events_and_device_tokens_compat.sql`)
  - **Edge**: `supabase/functions/stripe-webhook/index.ts` (short-circuit if already processed)
- [x] **Refund/chargeback/dispute revocation**
  - **Edge**: `supabase/functions/stripe-webhook/index.ts` handles `charge.refunded`, `refund.updated`, `charge.dispute.created`, `charge.dispute.closed`

### 1) Real Stripe catalog mapping for DLC (no inline `price_data` in prod)

- [x] **Persist real Stripe IDs per DLC package** (`dlc_packages.stripe_price_id` + optional `stripe_product_id`)
- [x] **Admin UI to manage mappings** (validate format, show status per package)
  - **Page**: `/admin/dlc` (`src/pages/AdminDLC.tsx`)
  - **Edge**: `supabase/functions/admin-dlc-catalog/index.ts`
- [x] **Hard enforcement in live mode**
  - **Edge**: `supabase/functions/create-dlc-checkout-session/index.ts` throws if `sk_live_*` and `stripe_price_id` missing
- [ ] **Webhook-side consistency checks** (package existence, price ↔ package mapping validation where possible)

### 2) Private storage + signed URL delivery

- [x] **Signed URL delivery edge function**
  - **Edge**: `supabase/functions/get-dlc-signed-url/index.ts`
  - Enforces: auth, active license (incl bundles), optional device binding, age verification
- [x] **App uses signed URLs for NSFW video playback + download**
  - `src/lib/nsfwVideoDelivery.ts`, `src/lib/nsfwVideoDownloads.ts`
- [x] **Signed upload URLs (admin pipeline)**
  - **Edge**: `supabase/functions/get-dlc-signed-upload-url/index.ts`
  - **Client**: `src/components/dlc/admin/signedUpload.ts`
- [x] **Audit + path hardening** (namespace enforcement, TTL bounds, deny path traversal)
  - **Namespace**: `packageId/*` enforced for signed URL + signed upload URL

### 3) Real content population (no bundled mock content in prod runtime)

- [x] **Positions gallery reads from DB** (`nsfw_positions_gallery`) with pagination/search
  - `src/components/PositionsGallery.tsx` (+ `src/components/positionsGallery/*`)
- [x] **Remove runtime dependency on GitHub-bundled position images** (`src/data/nsfwPositions/*`, `src/hooks/usePositionImages.ts`)
  - `src/hooks/usePositionImages.ts` now loads from `nsfw_positions_gallery`
- [x] **Video content reads from DB + storage paths** (`nsfw_video_content`) and always resolves via signed URLs if not HTTP
  - `src/lib/nsfwVideoDelivery.ts`, `src/lib/nsfwVideoDownloads.ts`

### 4) Admin import pipeline (safe, repeatable, auditable)

- [x] **Admin-only import UI** (CSV/JSON/manifest)
  - `/admin/dlc` import section (`src/components/dlc/admin/DLCContentImport.tsx`)
- [x] **Signed upload → storage** (private bucket)
  - Uses `get-dlc-signed-upload-url` + signed upload helper
- [x] **Service-role upsert into DB** (`nsfw_positions_gallery`, `nsfw_video_content`)
  - **Edge**: `supabase/functions/admin-import-dlc-content/index.ts`
- [x] **Import job audit logging** (job row + per-item status)
  - **DB**: `supabase/migrations/20251216170000_dlc_admin_import_pipeline.sql`

### 5) Key issuance/rotation (license-bound)

- [x] **DB schema for package key versions + rotation**
  - **DB**: `supabase/migrations/20251216172000_dlc_package_keyring.sql`
- [x] **Edge: `get-dlc-key`** (auth + active license + device + age gating)
  - **Edge**: `supabase/functions/get-dlc-key/index.ts`
- [x] **Admin rotate endpoint** (creates new key version, keeps older versions for rollback)
  - **Edge**: `supabase/functions/admin-rotate-dlc-key/index.ts`
- [x] **Client integration** (optional encrypted asset decrypt path; cache keys w/ TTL)
  - **Client helper**: `src/lib/dlcKeys.ts`

### 6) Restore purchases + device management UI

- [x] **Restore purchases button** (reload licenses from server and surface owned packages)
  - **UI**: `src/components/DLCStatus.tsx`
- [x] **Device management UI** (list/deactivate/set-primary)
  - **UI**: `src/components/dlc/user/DLCDeviceManager.tsx`
  - **Edge**: `supabase/functions/dlc-device-management/index.ts`
  - **DB compat**: `supabase/migrations/20251216171000_dlc_license_devices_primary.sql`
- [x] **Server-enforced device binding** across:
  - Signed URL delivery (`get-dlc-signed-url`)
  - Key delivery (`get-dlc-key`)
  - License verify (`verify-dlc-license`)

### 7) E2E + observability coverage

- [ ] **E2E**: restore purchases + device management flows (stable network interception)
- [x] **E2E**: admin catalog mapping + import screens render + validate
  - `e2e/admin-dlc.spec.ts`
- [x] **E2E**: NSFW hub gating renders when not detected
  - `e2e/nsfw-hub.spec.ts`
- [ ] **Observability**: structured logs for key events and denied reasons (age/device/license/refund)

---

### Notes

- Storage bucket privacy must be configured in Supabase Storage (bucket set to **private**). The app must only use signed URLs for NSFW assets.
