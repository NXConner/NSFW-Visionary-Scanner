## NSFW Parity Report (MorphoScan Pro)

Compared against `NXConner/NSFW-Visionary-Scanner` (cloned locally under `external-repos/` for analysis).

### High-level result

- **Most major features already existed** in this codebase (and in many places were more advanced), especially around **DLC modularization**, **NSFW gating**, **secure signed URLs**, **offline-first caching**, and **Stripe + webhook idempotency**.
- The external repo contained **three Supabase Edge Functions** that were **missing here** and were required by existing UI/lib code in this repo (notably `seductive-ai-chat`).
- The external repo also contained a functional baseline for **multi-camera recording upload flow** (record → chunk upload → merge) which was missing/placeholder here.

### What was added to match/cover missing capabilities

#### 1) Added missing Supabase Edge Functions (external repo parity)

- **Added** `supabase/functions/seductive-ai-chat/index.ts`
  - Secure implementation: requires auth, **age verification**, and **DLC entitlement** (`ai_companion`) unless `ALLOW_UNLICENSED_SEDUCTIVE_AI=true`.
  - Uses OpenAI (`OPENAI_API_KEY`) or Anthropic (`ANTHROPIC_API_KEY`) if configured.
  - Matches the existing client integration in `src/lib/nsfwAdvancedFeatures/seductiveAI.ts`.

- **Added** `supabase/functions/video-editing/index.ts`
  - Creates `video_edits` rows using the **existing schema** (recording-based, not the external repo’s older `video_id` format).
  - Secure implementation: requires auth + age verification + recording ownership.

- **Added** `supabase/functions/merge-video-chunks/index.ts`
  - Secure implementation: requires auth and enforces file namespace prefix of `${user.id}/...`.
  - Merges `${file_path}.chunk.N` objects into the final object, then removes chunks.

#### 2) Implemented client-side multi-camera recording upload (record → upload → persist)

- **Added** `src/lib/mediaUpload/videoChunkUpload.ts`
  - Uploads a large video `Blob` in chunks to storage, invokes `merge-video-chunks`, returns final path + public URL.

- **Added** `src/hooks/useVideoRecording.ts`
  - Multi-camera recording via `MediaRecorder` (audio on first camera only).
  - Uploads each camera recording using chunk upload + server merge.

- **Upgraded** `src/components/nsfwAdvancedFeatures/tabs/RecordingTab.tsx`
  - Now records actual video streams and uploads them.
  - Persists per-camera upload metadata into `camera_streams` (best-effort).
  - Includes an upload progress UI.

#### 3) Hardened video DLC mapping (removed fragile path inference as primary)

- **Updated** `src/lib/nsfwVideoDelivery.ts` and `src/lib/nsfwVideoDownloads.ts`
  - Resolves DLC package via `nsfw_video_content.dlc_pack_id -> dlc_packages.id -> dlc_packages.package_id`.
  - Falls back to path inference only when required.

- **Added migration** `supabase/migrations/20251214143000_nsfw_video_dlc_pack_fk.sql`
  - Adds FK + index: `nsfw_video_content.dlc_pack_id -> dlc_packages.id`.

#### 4) Clean-up to keep this repo healthy

- **Updated** `.gitignore` to ignore `external-repos/` so the comparison clone is not committed.
- **Updated** `eslint.config.js` to ignore `external-repos/**` to prevent lint failures.

#### 5) Ported remaining reusable UI utilities (non-critical parity items)

- **Added** `src/lib/mediaUpload/*` (generic uploads)
  - `uploadFile`, `uploadFiles`, `uploadVideo` with safe user-scoped paths
  - Uses chunk upload + `merge-video-chunks` automatically for large videos
  - Optional client-side image compression (JPEG/WebP) when enabled

- **Added** `src/components/MediaUploader.tsx`
  - Reusable UI uploader (default/compact/dropzone variants) backed by `src/lib/mediaUpload/*`

- **Added** `src/lib/storageUtils.ts` + **Added** `src/components/StorageUsage.tsx`
  - Best-effort per-user storage usage by listing bucket contents under `<userId>/`
  - Tier-based limits using `user_roles.role`

- **Added** `src/lib/videoScreenshots.ts` + **Added** `src/components/VideoPlayer.tsx`
  - Screenshot capture + persistence to `video_screenshots` (records are tied to `video_recordings.id`)
  - Enhanced video player UI with seek/skip/volume/fullscreen + screenshot gallery

### Environment variables introduced/required

#### Supabase Edge Function env

- **`OPENAI_API_KEY`**: enables OpenAI responses in `seductive-ai-chat`.
- **`ANTHROPIC_API_KEY`**: enables Anthropic responses in `seductive-ai-chat`.
- **`ALLOW_UNLICENSED_SEDUCTIVE_AI`**: if `true`, allows using `seductive-ai-chat` without DLC entitlement (still requires age verification). Default is `false`.

#### App (Vite) env

- **`VITE_USER_MEDIA_BUCKET`**: Supabase Storage bucket used for multi-camera upload artifacts.
  - Defaults to `user-media` if unset.

### Notes / non-goals

- The external repo contains several older/legacy files (ex: stub DLC implementations) which are intentionally **not reintroduced**.
- Full FFmpeg-style server-side video processing is intentionally **not implemented in Edge Functions** (still a dedicated worker/service responsibility). The `video-editing` function records edit intent and is compatible with a later processing pipeline.

### Files added/changed (this parity pass)

**Added**

- `supabase/functions/seductive-ai-chat/index.ts`
- `supabase/functions/video-editing/index.ts`
- `supabase/functions/merge-video-chunks/index.ts`
- `supabase/migrations/20251214143000_nsfw_video_dlc_pack_fk.sql`
- `src/lib/mediaUpload/videoChunkUpload.ts`
- `src/hooks/useVideoRecording.ts`
- `src/lib/mediaUpload/index.ts`
- `src/lib/mediaUpload/upload.ts`
- `src/lib/mediaUpload/types.ts`
- `src/lib/mediaUpload/path.ts`
- `src/lib/mediaUpload/imageCompress.ts`
- `src/lib/storageUtils.ts`
- `src/lib/videoScreenshots.ts`
- `src/components/MediaUploader.tsx`
- `src/components/mediaUploader/MediaUploader.tsx`
- `src/components/mediaUploader/index.ts`
- `src/components/mediaUploader/types.ts`
- `src/components/mediaUploader/utils.ts`
- `src/components/StorageUsage.tsx`
- `src/components/storage/StorageUsage.tsx`
- `src/components/VideoPlayer.tsx`
- `src/components/video/VideoPlayer.tsx`
- `src/components/video/index.ts`

**Updated**

- `.gitignore`
- `eslint.config.js`
- `src/components/nsfwAdvancedFeatures/tabs/RecordingTab.tsx`
- `src/lib/nsfwVideoDelivery.ts`
- `src/lib/nsfwVideoDownloads.ts`

### Status

- Lint/tests/build: **passing**.
