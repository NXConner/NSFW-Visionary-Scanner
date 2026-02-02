# Monetization Playbook — MorphoScan Pro

## Goal

Maximize conversion while preserving trust: one primary paywall funnel, then expansion monetization post-purchase.

## Pricing Architecture (v1)

### Primary offers

- **Pro** (subscription)
- **Premium** (subscription)

### Expansion offers (post-purchase)

- DLC unlocks (hybrid/direct)
- Marketplace purchases (premium content, routines)
- Add-ons (niche features)

## Primary Funnel (keep it simple)

1. User hits a premium feature gate
2. Paywall shows **2 paid options max**
3. User selects plan → Stripe Checkout
4. Stripe webhook updates entitlements
5. App refreshes access (client checks subscription + DLC)

## Event instrumentation

- `paywall_view`
- `checkout_started`
- `checkout_return_success`
- `checkout_return_canceled`
- `checkout_failed`

## Operational Requirements

- Stripe products/prices configured for:
  - SFW store
  - SFW direct
  - NSFW direct
  - DLC store/direct
- Webhook idempotency enabled (ledger table exists)
- Refund/chargeback flows revoke access (implemented in webhook handler)

## UX rules for higher conversion

- Trust-first: privacy/security + disclaimers near pay button
- Reduce cognitive load: fewer choices, clearer value
- Make premium value tangible: show preview of what unlocks

## Rollout plan

- Week 1: measure baseline conversion
- Week 2: simplify paywall messaging and offers
- Week 3+: test annual anchor, trial length, and bundles
