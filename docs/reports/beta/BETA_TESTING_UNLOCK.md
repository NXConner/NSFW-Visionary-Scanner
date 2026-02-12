# Beta unlock (no payments) — Admin runbook

This project supports **non-paid beta testing** by granting:

- **Premium subscription tier** (removes paywalls)
- **All DLC licenses** (unlocks all DLC content, still respecting age verification gates)

This is implemented via:

- `public.beta_testers` table (allowlist + expiry)
- Edge Function `admin-beta-access` (admin-only grant/revoke/list)

## Prerequisites

- Database migrations applied (includes `beta_testers`).
- Edge Functions deployed (includes `admin-beta-access`).
- You have an **admin** or **super_admin** role in `public.user_roles`.
- The target tester **already exists in Supabase Auth** (email/password or magic link sign-up is fine).

## Grant beta access (recommended)

Call the Edge Function with your own admin JWT as `Authorization: Bearer <token>`.

Request body:

```json
{
  "action": "grant",
  "email": "tester@example.invalid",
  "expiresInDays": 90,
  "maxDevices": 10,
  "notes": "Beta cohort A"
}
```

Expected result:

- Row upserted into `public.beta_testers`
- `public.user_subscriptions` upserted as `active` + `premium`
- `public.dlc_licenses` upserted for **every active** `public.dlc_packages` row with `payment_provider = 'beta'`

## Revoke beta access

```json
{
  "action": "revoke",
  "email": "tester@example.invalid",
  "notes": "Beta ended"
}
```

Effects:

- Sets `beta_testers.enabled = false`
- Sets `user_subscriptions.status = 'canceled'`
- Deactivates only licenses where `payment_provider = 'beta'`

## List beta testers

```json
{
  "action": "list"
}
```

## UI behavior

- Users with active beta access see a **“Beta Access Enabled”** notice on the Pricing page and purchases are suppressed there.
- DLC unlocks happen through the normal DLC entitlement system (licenses), so the rest of the app behaves “as if purchased”.
