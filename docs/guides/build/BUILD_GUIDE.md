# Build Guide — SFW / NSFW / Hybrid

This guide explains how to build the three different app variants supported by the repo:

- **SFW** (store-safe)
- **NSFW** (direct-only)
- **Hybrid** (SFW base + DLC unlocks)

## Canonical build commands (from `package.json`)

- `npm run build:sfw:store`
- `npm run build:sfw:direct`
- `npm run build:nsfw:direct`
- `npm run build:hybrid:store`
- `npm run build:hybrid:direct`

All output to `dist/`.

## Environment variables

This repo does **not** contain `.env.example.versions`.

Use `.env.example` as the canonical template and set, at minimum:

- `VITE_APP_VERSION` = `sfw` | `nsfw` | `hybrid`
- `VITE_DISTRIBUTION_CHANNEL` = `store` | `direct`
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- Stripe publishable key + the required price-id variables (see `docs/guides/integrations/payments/STRIPE_SETUP_GUIDE.md`)

## Examples

SFW store build:

```bash
npm run build:sfw:store
```

NSFW direct build:

```bash
npm run build:nsfw:direct
```

Hybrid store build:

```bash
npm run build:hybrid:store
```

## Next step

After building a store variant, follow:

- `docs/guides/build/MOBILE_BUILD_GUIDE.md` (Capacitor sync + Android/iOS packaging)
