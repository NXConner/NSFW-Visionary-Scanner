# Compliance & Distribution — MorphoScan Pro

## Purpose

Ship a store-safe men’s health & education app while preserving optional adult/“fun” capabilities via compliant distribution paths.

## Build/Distribution Model

### SFW (Store)

- Content and UI must remain **store-safe**.
- No explicit imagery or explicit descriptions.
- Avoid claims that imply diagnosis, treatment guarantees, or “medical device” positioning.

### NSFW / Adult (Direct)

- Delivered via **direct distribution** (website) and/or entitlement-gated modules.
- Adult features must be:
  - gated by age checks where applicable
  - gated by purchase/license
  - never shown or described explicitly in store metadata

### Hybrid

- Store-safe base app + optional DLC unlock delivered through compliant flows.

## Language & Claims Rules (store-safe)

Avoid:

- “medical-grade”, “clinical-grade”, “sub-millimeter accuracy”, “FDA approved”, “diagnose”, “treat”, “cure”

Prefer:

- “educational”, “wellness tracking”, “self-tracking”, “personal insights”, “not medical advice”

## Privacy Requirements

- Data minimization: do not collect sensitive content for analytics.
- Provide export/delete controls.
- Consent-based product analytics (opt-in) must be truthful.

## Adult Content Handling Rules

- No explicit content in:
  - onboarding copy
  - store listings
  - public screenshots
  - default “free” experience
- Adult content delivery:
  - serve only after entitlement check
  - use signed URLs/private storage
  - keep separation between SFW and adult build channels

## Payments & Age

- Stripe: ensure correct product mapping per channel.
- Age confirmation:
  - required for adult unlock paths
  - store-safe builds should not prompt explicit adult consent flows

## Review Checklist

- Store listing text and screenshots pass content policy check
- In-app disclaimers are present
- Adult modules are not reachable without entitlement
- No explicit strings in the store build bundle
