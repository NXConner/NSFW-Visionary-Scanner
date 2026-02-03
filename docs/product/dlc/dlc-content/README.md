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

### Seed content (original editorial)

- `seed/topics_pps_original.csv` (topics library, tiered ratings)
- `seed/education_expert_content_pps.json` (expert articles)
- `seed/positions_mit_generated.csv` (positions derived from MIT illustrations)

Import topics via Admin → DLC Content Import → Topics. Import expert content via:

```powershell
npm run dlc:import-expert-content -- --file docs/product/dlc/dlc-content/seed/education_expert_content_pps.json
```

### MIT positions (download + import)

1) Download MIT illustrations locally (not committed):

```powershell
npm run dlc:download-mit-positions
```

2) Regenerate the CSV (optional, already generated):

```powershell
npm run dlc:build-mit-positions-csv
```

3) In **Admin → DLC → Content Import → Positions**:

- Select `seed/positions_mit_generated.csv`.
- Add all downloaded files from `dlc-assets/mit-positions/` as asset uploads.
- Run a **Dry-run** first, then import.

### Optional validator (recommended)

You can validate a CSV/JSON file locally before importing:

- Script: `scripts/validate-dlc-import.ts`
- Command: `npm run dlc:validate-import -- --type positions --file path/to/file.csv`

### Licensing & compliance

Before importing any NSFW media, complete the licensing checklist:

- `docs/product/dlc/NSFW_CONTENT_LICENSING.md`
- Approved sources: `docs/product/dlc/licensing/SOURCES.md`
