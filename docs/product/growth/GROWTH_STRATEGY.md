# Growth Strategy (Executable) — MorphoScan Pro

## Goal

Increase the probability of revenue success by improving **activation → retention → conversion**, using measurable experiments and a single source of truth for product analytics.

## North Star + Guardrails

- **North Star (Revenue)**: Paid subscribers + paid DLC/marketplace purchasers.
- **North Star (Product)**: Weekly Active Users (WAU) completing the core outcome.
- **Guardrails**:
  - Privacy: no sensitive content in analytics events.
  - Trust: no exaggerated medical claims.
  - Quality: crash-free users > 99.5%.

## Primary Funnel (v1)

### AARRR

- **Acquire**: ASO + SEO content + referral + direct traffic.
- **Activate**: onboarding completed + first “core action” completed.
- **Retain**: D1/D7/D30 retention; weekly plan adherence.
- **Revenue**: paywall viewed → checkout started → paid.
- **Referral**: partner invite + referral code usage.

### Core action (choose one and make it the hero)

Pick ONE hero outcome for the first 30 days post-launch:

- **Option A (solo)**: personalized plan created + first daily session logged
- **Option B (couples)**: partner invited + first shared challenge completed
- **Option C (progress)**: first scan or check-in logged + week-1 summary generated

## Metrics (targets)

Targets are directional; validate with real cohort baselines.

- **Activation**: onboarding completion ≥ 40%; first core action ≥ 25% of installs
- **Conversion**: paywall→checkout start 3–8%; checkout completion 40–70%
- **Retention**: D7 ≥ 12%; D30 ≥ 6%
- **Refund/chargeback**: refunds < 5%; disputes extremely rare

## Analytics: What we measure (first-party)

Source of truth: `public.app_analytics_events` (Supabase).

### Required events (v1)

- **Onboarding**:
  - `onboarding_started`
  - `onboarding_step_view`
  - `onboarding_completed`
  - `onboarding_skipped`
  - `analytics_consent_granted` / `analytics_consent_revoked`
- **Auth**:
  - `auth_sign_up_success` / `auth_sign_up_failed`
  - `auth_sign_in_success` / `auth_sign_in_failed`
  - `auth_google_start` / `auth_google_start_failed`
  - `auth_apple_start` / `auth_apple_start_failed`
- **Paywall / Pricing**:
  - `paywall_view`
  - `checkout_started`
  - `checkout_failed`
  - `checkout_return_success`
  - `checkout_return_canceled`

### Event properties rules

- Never include scan images, explicit content, free-text diary entries, or personally sensitive notes.
- Include only:
  - build/channel/version
  - plan id / tier
  - page path
  - simple boolean flags

## Weekly Experiment Loop (one experiment per week)

1. **Hypothesis** (example): “Adding couples-first onboarding increases activation by 10%.”
2. **Change**: implement in one small PR behind a feature flag.
3. **Measure**: compare cohorts (new users only).
4. **Decide**: ship/iterate/revert.

### Highest leverage experiments

- Onboarding: reduce steps, personalize outcome, add preview of premium value
- Paywall: simplify offers, test annual anchor, improve trust copy
- Retention: weekly plan reminders, “week in review” summary, streak forgiveness
- Referral: partner invite incentives

## Go-to-market channels (best-fit)

- **ASO**: store-safe SFW positioning; optimize keywords and screenshots
- **SEO**: educational content + tools/quizzes (direct builds)
- **Referral**: in-app referral + partner invite
- **Influencers/Affiliates**: compliance-safe content only

## Execution checklist

- Enable internal event capture (`app_analytics_events` migration applied)
- Confirm onboarding consent UX is accurate and optional
- Verify paywall and checkout events are recorded for authenticated users
- Review weekly dashboard: activation, conversion, churn, refunds
