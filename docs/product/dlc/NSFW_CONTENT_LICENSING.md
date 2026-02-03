# NSFW Content Licensing & Compliance Guide

This guide defines the **required licensing artifacts**, **review steps**, and **metadata** for
shipping NSFW DLC content. It is designed to prevent unlicensed media from entering production.

## Required artifacts (per asset)

- Signed performer/model release(s) covering:
  - explicit content consent
  - distribution rights
  - duration/term of use
  - geography/territory restrictions
- Rights holder license agreement (studio/producer/creator)
- Proof of age (18+) for all performers (kept securely; not stored in the app DB)
- Content ownership chain (who created, who owns, who licensed)
- Content rating determination (`educational`, `demonstrative`, `explicit`)
- Open-source license text (if using open-source illustrations)

## Required metadata (store in internal systems)

- Rights holder name + contact
- License type (exclusive / non-exclusive)
- License start/end dates (or perpetual)
- Allowed distribution channels (direct web, store-safe, partners)
- Allowed use cases (education, marketing, paid DLC)
- Required attribution text (if any)
- Restrictions (territories, age gates, platform limits)
- Compliance reviewer + review date

## Review workflow (minimum)

1. **Intake**: Collect raw media + contracts + releases.
2. **Verification**:
   - Validate signatures and dates.
   - Verify age documentation for every performer.
3. **Compliance review**:
   - Confirm consent language covers explicit content.
   - Confirm distribution channels align with release terms.
4. **Content QA**:
   - Validate metadata, tags, ratings, and required warnings.
   - Ensure assets are stored under the required `{packageId}/...` path.
   - Verify open-source license file is stored in `docs/product/dlc/licensing/`.
5. **Publish**:
   - Import via Admin → DLC Content Import.
   - Verify signed URL access + entitlement gating.

## Storage & delivery controls

- All NSFW media must remain in **private** storage (`nsfw-content`).
- Access is **signed URL only** via `get-dlc-signed-url`.
- Asset paths must be **namespaced under the packageId**.

## Enforcement checks (operational)

- No asset is published without a completed compliance review.
- Any asset with expired license must be removed and audit logged.
- Rights metadata must be updated before renewing or re-licensing content.

## Notes

- Do **not** upload or seed unlicensed media.
- Ensure the content rating matches the highest-intensity segment.
