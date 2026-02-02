# Version Profiles (SFW / Hybrid / NSFW) + Distribution Channels (Store / Direct)

This repo supports multiple **build profiles** (what ships in the client bundle) and **deployment policies** (what the backend will serve).

There are **two independent axes**:

- **App version** (`VITE_APP_VERSION`)
  - `sfw`: store-safe baseline bundle
  - `hybrid`: SFW baseline + optional adult/DLC surfaces in direct bundles
  - `nsfw`: direct-only adult bundle
- **Distribution channel** (`VITE_DISTRIBUTION_CHANNEL`)
  - `store`: Play Store / App Store submission profile (**bundle must be store-safe**)
  - `direct`: distributed from your website (hybrid + nsfw allowed)

## What “enabled” means in this repo

- **Build-time enablement (client bundle)**: controlled primarily by `VITE_APP_VERSION` + `VITE_DISTRIBUTION_CHANNEL`.
  - Store builds are hard-gated to **exclude adult/NSFW modules and routes** at build time.
- **Runtime enablement (client UX)**: additional gating based on:
  - entitlements / DLC ownership,
  - age verification,
  - session gates,
  - content policy (`lovable` vs `direct`) and host detection.
- **Server-side enablement (Supabase Edge Functions)**: controlled via **function environment variables** (secrets). Even if a UI is visible in a direct build, the server may still return `404` unless enabled.

## Canonical build commands (already in `package.json`)

All builds output to `dist/`.

### Store builds (submission-safe)

```powershell
npm run build:sfw:store
```

> Notes:
>
> - `build:hybrid:store` exists, but for submission you should treat **store** as **SFW-only** unless you’re intentionally doing a store-safe hybrid that still excludes adult bundles.

### Direct builds (website distribution)

```powershell
# SFW direct
npm run build:sfw:direct

# Hybrid direct
npm run build:hybrid:direct

# NSFW direct
npm run build:nsfw:direct
```

## Quick profile matrix (recommended)

| Profile name      | Intended distro | Command                       | What ships in bundle                                              |
| ----------------- | --------------- | ----------------------------- | ----------------------------------------------------------------- |
| **Store SFW**     | Play/App Store  | `npm run build:sfw:store`     | SFW-only routes/modules; direct-only deep-links removed           |
| **Direct SFW**    | Website         | `npm run build:sfw:direct`    | SFW-only routes/modules; direct-only pages allowed                |
| **Direct Hybrid** | Website         | `npm run build:hybrid:direct` | SFW base + adult/DLC surfaces (still gated by DLC + age + policy) |
| **Direct NSFW**   | Website         | `npm run build:nsfw:direct`   | Adult bundle enabled (still gated by DLC + age + policy)          |

## Running locally without touching `.env`

You do **not** need to edit `.env` just to switch profiles locally. You can set process env vars in PowerShell for the current shell session:

```powershell
# Example: run dev server as Hybrid Direct (does not modify .env)
$env:VITE_APP_VERSION="hybrid"
$env:VITE_DISTRIBUTION_CHANNEL="direct"
npm run dev
```

```powershell
# Example: build Store SFW (does not modify .env)
$env:VITE_APP_VERSION="sfw"
$env:VITE_DISTRIBUTION_CHANNEL="store"
npm run build
```

> Tip: the repo already includes explicit scripts (`build:sfw:store`, etc.). Prefer those for CI/repeatability.

## Content policy: `lovable` vs `direct` (runtime policy)

There is also a runtime content policy layer used for “Lovable-safe” vs “Direct” behavior.

- **Store builds and Lovable-hosted builds are hard-forced to safe mode** (runtime + build-time).
- **Direct builds on non-Lovable hosts** can run in `direct` policy mode.
- A **super-admin-only local override UI** (Settings → Content Policy) can switch the policy for _that device/browser_ in direct builds.

Important:

- The super-admin override **does not change what shipped in the bundle**.
  - If you built `store`/`sfw`, adult modules/routes are not present and cannot be enabled by any toggle.

## Supabase Edge Function enablement (server-side)

The client profile alone is not enough—certain endpoints are **hard-gated** server-side.

### Required: `CONTENT_POLICY`

Set per Supabase project (or per environment):

- `CONTENT_POLICY=direct` for direct deployments
- `CONTENT_POLICY=lovable` (or omit) for store/lovable-safe deployments

### Medical AI gates (examples)

Enable only for direct deployments:

- `ENABLE_GENITAL_HEALTH_AI=true` enables scan analysis endpoints that are gated
- `ENABLE_MEDICAL_AI_CHAT=true` enables medical chat endpoints that are gated

### Adult chat gates (example)

- `SEDUCTIVE_AI_MODE=tame` or `SEDUCTIVE_AI_MODE=explicit`
  - store/lovable-safe policy returns `404` regardless

### Setting secrets (CLI example)

Use whichever method you already use (Supabase Dashboard or CLI). CLI example:

```powershell
# Example (replace values with your real ones)
supabase secrets set CONTENT_POLICY=direct ENABLE_MEDICAL_AI_CHAT=true ENABLE_GENITAL_HEALTH_AI=true SEDUCTIVE_AI_MODE=tame
```

## Store submission checklist (minimum)

- Build with **Store SFW** profile:
  - `npm run build:sfw:store`
- Ensure store app UX does **not** expose:
  - direct-download links for restricted variants,
  - external payment flows that violate store billing rules (if applicable),
  - adult-only navigation labels/routes.

## “How do I enable Hybrid/NSFW for a user?”

In this repo, “enable” typically means **all** of the following:

- **Direct build** shipped (Hybrid or NSFW): `VITE_DISTRIBUTION_CHANNEL=direct` + (`hybrid` or `nsfw`)
- **Policy allows it**: `direct` policy effective (not lovable/store)
- **User entitlement**: DLC/license/plan grants the feature
- **Age verification**: user completed required verification flow
- **Server is enabled**: Supabase function secrets allow those endpoints (no `404`)
