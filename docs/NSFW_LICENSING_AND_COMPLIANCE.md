# NSFW Licensing & 2257 Compliance

This document describes the licensing tracker, ingestion validation, and 2257-style record-keeping
workflow for NSFW video content.

## Overview

The system adds:

- **Licensors & licenses** (contract metadata, rights, territory, scope).
- **2257 custodians** (custodian of records for compliance).
- **Performer records** (age verification + consent references).
- **2257 records** (per-content compliance record with status).
- **Content performer links** (who appears in what content).

All objects are **admin-only** (RLS), and ingestion rejects unlicensed content.

## Data Model (Core Tables)

- `nsfw_content_licensors`
- `nsfw_content_licenses`
- `nsfw_2257_custodians`
- `nsfw_performer_records`
- `nsfw_2257_records`
- `nsfw_content_performers`
- `nsfw_video_content` (new columns: `license_id`, `license_status`, `compliance_status`)

## Recommended Workflow

1. **Create a Licensor**
   - Admin → NSFW → Licensing → Licensors
2. **Create a License**
   - Assign `license_key` (stable, unique).
   - Define scope: content types, platforms, explicit allowance, term dates, 2257 requirement.
3. **Add Custodian + Performer Records**
   - Admin → NSFW → 2257 Compliance
4. **Create 2257 Record**
   - Assign `record_key` (stable, unique).
   - Optional: pre-link to content or leave empty (linked on import).
5. **Link Performers to Content**
   - Admin → NSFW → 2257 Compliance → Content Links

## Video Import Requirements

The video import pipeline requires **license validation**. For explicit or demonstrative content,
compliance records are mandatory.

### CSV / JSON fields (Videos)

Required (existing):

- `title`, `description`, `category`

Required (new):

- `license_key` **or** `license_id`

Required when `content_rating` is `demonstrative` or `explicit`:

- `compliance_record_key` **or** `compliance_record_id`

Optional:

- `content_slug`
- `source_import_key`
- `content_rating`
- `difficulty_level`
- `video_url_sd`, `video_url_hd`, `video_url_4k`
- `thumbnail_url`, `preview_gif_url`
- `tags`, `key_points`, `warnings`, `prerequisites`
- `is_premium`, `is_featured`, `requires_dlc`, `dlc_pack_id`
- `is_approved`, `is_active`

## License Validation Rules

During import, each video item must pass:

- License exists and is **active**
- License term is valid (start/end dates)
- License allows **video** content type
- License allows the chosen `content_rating`

If any check fails, the item is rejected.

## Compliance Validation Rules

For `demonstrative` or `explicit` content:

- A matching 2257 record is required
- Record status cannot be `revoked`
- If the record is already linked to a different content item, import fails

## Example Keys

- License key: `lic-education-pack-2026`
- Record key: `2257-vid-2026-0001`

## Notes

- Compliance and licensing data is **admin-only** by design.
- Always keep contract files and IDs in secure storage (reference via storage path + SHA256).
- For US distribution, ensure `requires_2257 = true` for explicit content licenses.
