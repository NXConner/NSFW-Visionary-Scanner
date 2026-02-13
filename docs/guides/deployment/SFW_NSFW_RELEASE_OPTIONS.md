# SFW and NSFW Release Options (Single Supabase vs Dual Supabase)

This document explains two supported ways to ship a Safe-For-Work (SFW) app store build
and a separate NSFW build. Both options use the existing build flavors:

- SFW (store build): VITE_APP_VERSION=sfw, VITE_DISTRIBUTION_CHANNEL=store
- NSFW (direct build): VITE_APP_VERSION=nsfw, VITE_DISTRIBUTION_CHANNEL=direct

This is a personal project and is not related to any pavement or pavement performance suite.

---

## Decision Matrix

| Option | Description                                          | App Store Safety | Operational Complexity | Risk of NSFW Leakage |
| ------ | ---------------------------------------------------- | ---------------- | ---------------------- | -------------------- |
| A      | Single Supabase, hard build-time gating + strict RLS | Medium           | Low                    | Medium               |
| B      | Dual Supabase (SFW + NSFW projects)                  | High             | Medium                 | Low                  |

Recommendation: Option B is safest for app store compliance. Option A is acceptable if you
implement every control below and keep SFW builds free of NSFW code/assets/strings.

---

## Option A: Single Supabase with Strict Separation

### Requirements (must do all)

1. Build-time gating removes NSFW routes/components from SFW bundles.
2. RLS blocks all NSFW tables for users without nsfw_access entitlement.
3. NSFW storage bucket is private with signed URLs only.
4. Edge functions verify entitlement before returning NSFW data.

### Step 1: Build-Time Separation (Hard)

Use the existing build scripts:

```powershell
# SFW (app stores)
npm run build:sfw:store

# NSFW (direct distribution)
npm run build:nsfw:direct
```

Rules for SFW build:

- Do not import NSFW routes/components.
- Do not ship NSFW assets or strings in the SFW bundle.
- Do not expose NSFW menus, tabs, or deep links.

### Step 2: Entitlements (RLS Gate)

Use roles and user_roles to grant NSFW access.
If roles are missing, use an idempotent upsert.

```sql
-- Ensure nsfw_access role exists (idempotent)
insert into public.roles (name, description)
values ('nsfw_access', 'NSFW content entitlement')
on conflict (name) do update set description = excluded.description;
```

Assign entitlements only to NSFW users:

```sql
-- Example (idempotent) assignment for a specific user
insert into public.user_roles (user_id, role)
values ('<user-uuid>', 'nsfw_access')
on conflict (user_id, role) do nothing;
```

### Step 3: RLS Policy Pattern (NSFW Tables)

Apply to every NSFW table:

```sql
-- Example policy for a user-owned NSFW table
create policy "nsfw_user_access"
on public.nsfw_table_name
for select
using (
  auth.uid() = user_id
  and exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'nsfw_access'
  )
);
```

Do NOT allow `USING (true)` on NSFW tables.

### Step 4: Storage Buckets (NSFW)

- Use a private bucket (example: `nsfw-content`).
- Enforce signed URLs only.
- Allow access only to users with `nsfw_access`.

```sql
-- Example storage policy (pseudocode; adjust to your schema)
create policy "nsfw_bucket_read"
on storage.objects
for select
using (
  bucket_id = 'nsfw-content'
  and exists (
    select 1
    from public.user_roles ur
    where ur.user_id = auth.uid()
      and ur.role = 'nsfw_access'
  )
);
```

### Step 5: Edge Functions (NSFW APIs)

For any NSFW function:

- `verify_jwt = true`
- Check entitlement before returning NSFW data or signed URLs.

### Step 6: Verification Checklist

- SFW bundle contains no NSFW routes/assets/strings.
- NSFW tables blocked for non-entitled users by RLS.
- NSFW storage bucket is private and signed URLs are required.
- NSFW edge functions reject missing entitlements.
- SFW build uses store app ID and SFW listing assets.

---

## Option B: Dual Supabase Projects (SFW + NSFW)

This is the safest for app store compliance.

### Step 1: Create Two Supabase Projects

- Project A (SFW): only SFW users and data.
- Project B (NSFW): NSFW users and data.

### Step 2: Configure Environment Variables

Do not overwrite .env. Use separate files locally and inject in CI/CD.

```powershell
# Example local setup (do not commit these files)
Copy-Item .env.example .env.sfw
Copy-Item .env.example .env.nsfw
```

Populate each with the correct project URL and anon key:

- .env.sfw -> SFW Supabase
- .env.nsfw -> NSFW Supabase

### Step 3: Build and Deploy Each Flavor

```powershell
# SFW
setx VITE_APP_VERSION "sfw"
setx VITE_DISTRIBUTION_CHANNEL "store"
npm run build:sfw:store

# NSFW
setx VITE_APP_VERSION "nsfw"
setx VITE_DISTRIBUTION_CHANNEL "direct"
npm run build:nsfw:direct
```

Use separate app IDs and listing assets.

### Step 4: Storage and Secrets

- Separate storage buckets per project.
- Separate Stripe products/prices for SFW vs NSFW.
- Separate Sentry DSNs if used.

---

## App Store Submission Notes (SFW)

- SFW build must contain no NSFW content or entry points.
- Age rating must match SFW content only.
- Use SFW-only screenshots, descriptions, and keywords.

---

## Direct Distribution Notes (NSFW)

- Require age verification before any NSFW content renders.
- Keep NSFW content behind signed URLs + entitlement checks.
- Do not distribute via app stores.

---

## RLS and Security References

- RLS audit checklist: docs/security/rls/RLS_AUDIT_CHECKLIST.md
- RLS test script: npm run test:rls:partner-sync
- Secrets guidance: docs/security/secrets/secrets-manager.md

---

## Summary

Option A (single Supabase) is possible but only if you enforce:
build-time gating + strict RLS + storage controls + edge function checks.
Option B (dual Supabase) is safest for app store compliance.
