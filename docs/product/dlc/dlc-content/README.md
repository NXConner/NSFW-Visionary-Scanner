## DLC Content Import Kit (NSFW)

This folder contains **import templates** and guidance for populating real NSFW DLC content using the existing **Admin → DLC Content Import** UI:

- Admin UI: `src/components/dlc/admin/DLCContentImport.tsx`
- Edge importer: `supabase/functions/admin-import-dlc-content/index.ts`
- Signed upload: `supabase/functions/get-dlc-signed-upload-url/index.ts`
- Signed delivery: `supabase/functions/get-dlc-signed-url/index.ts`
- Storage bucket (private): `nsfw-content` (created by migration `supabase/migrations/20251223130000_nsfw_content_storage_bucket.sql`)

### What ships in the app vs what doesn’t

- **Ships in app**: the DLC system, store/catalog, gating, admin toggles, import tooling.
- **Does NOT ship in app**: actual NSFW media payload (images/videos) and topic library entries. Those are uploaded/imported into Supabase.

### Storage path convention (required)

When uploading assets via the admin import UI, assets are stored under:

`{packageId}/{importType}/{slugOrKey}/{timestamp}-{filename}`

Examples:

- `dlc-positions/positions/missionary/1700000000000-image.webp`
- `dlc-videos/videos/expert-intro/1700000000000-video.mp4`

This convention is enforced by the edge signing functions (assets must be under `${packageId}/...`).

### Templates

- `templates/positions.csv`
- `templates/videos.csv`
- `templates/topics.csv`

These contain headers only. Fill with real content data and then import via the Admin UI.

### Optional validator (recommended)

You can validate a CSV/JSON file locally before importing:

- Script: `scripts/validate-dlc-import.ts`
- Command: `npm run dlc:validate-import -- --type positions --file path/to/file.csv`
