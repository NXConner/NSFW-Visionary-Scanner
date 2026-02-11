# External Release Tasks Runbook (staging + production)

This runbook covers the remaining manual/external steps:

1. Apply Supabase migrations + run an RLS/storage audit
2. Provision secrets (Supabase Edge + hosting + GitHub Actions)
3. Import real NSFW content via `/admin/nsfw`
4. Wire CI deploy + rollback plan

---

## Quickstart (no local `.env` required)

Use an environment file outside git (example: `.env.staging.local`) and run:

Template: `config/release/release.secrets.template.env`

```bash
# 1) Provision GitHub + Supabase secrets from env file
npm run release:secrets:provision -- --environment staging --env-file .env.staging.local --repo OWNER/REPO

# 2) Dry-run migrations, optional apply, optional remote types check
npm run release:remote:ops -- --env-file .env.staging.local --types-check
npm run release:remote:ops -- --env-file .env.staging.local --apply --types-check
```

---

## 1) Supabase staging/prod: apply migrations + audit

### 1.1 Apply migrations (recommended: dry-run first)

**Preferred input:** `SUPABASE_DB_URL` (full Postgres URL, percent-encoded if needed).

#### Bash

```bash
# Dry-run (prints migrations that WOULD apply)
SUPABASE_DB_URL="postgresql://..." npm run db:migrate:remote -- --dry-run

# Apply (push migrations)
SUPABASE_DB_URL="postgresql://..." npm run db:migrate:remote

# Alternative (no env export): pass credentials by CLI flags
npm run db:migrate:remote -- --dry-run --db-url="postgresql://..." --project-ref="your-project-ref"
npm run db:migrate:remote -- --db-url="postgresql://..." --project-ref="your-project-ref"
```

#### PowerShell

```powershell
# Dry-run
$env:SUPABASE_DB_URL = "postgresql://..."
npm run db:migrate:remote -- --dry-run

# Apply
npm run db:migrate:remote

# Alternative (no env export): pass credentials by CLI flags
npm run db:migrate:remote -- --dry-run --db-url="postgresql://..." --project-ref="your-project-ref"
npm run db:migrate:remote -- --db-url="postgresql://..." --project-ref="your-project-ref"
```

### 1.2 RLS/storage audit (Supabase SQL editor)

After migrations are applied, run:

- `docs/security/rls/RLS_STORAGE_AUDIT_QUERIES.sql`

Minimum expectations for production readiness:

- Buckets `nsfw-content`, `recordings`, `screenshots`, `user-uploads` are `public = false`
- No direct `storage.objects` policies grant access to `nsfw-content`

### 1.3 Optional: verify generated types match remote schema

If Supabase CLI is authenticated (`SUPABASE_ACCESS_TOKEN` or `supabase login`):

```bash
SUPABASE_PROJECT_REF="your-project-ref" npm run db:types:remote:check
```

---

## 2) Provision secrets (Supabase Edge + hosting + CI)

### 2.1 Supabase Edge Function secrets

Set these in **Supabase Dashboard → Project Settings → Edge Functions → Secrets** (or via CLI `supabase secrets set ...`):

**Stripe**

- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `STRIPE_PRO_PRICE_ID` (used by subscription functions)
- `STRIPE_PREMIUM_PRICE_ID` (used by subscription functions)

**DLC / content signing**

- `DLC_KEYRING_MASTER_KEY_B64`
- `NSFW_CONTENT_BUCKET` (optional; default: `nsfw-content`)

**Email**

- `RESEND_API_KEY`
- `EMAIL_FROM` (sender address)

**Retention jobs / cron endpoints**

- `DATA_RETENTION_SECRET`

**AI providers (only if enabling AI features)**

- `LOVABLE_API_KEY`
- `OPENAI_API_KEY` (optional)
- `ANTHROPIC_API_KEY` (optional)
- `CUSTOM_AI_ENDPOINT` / `CUSTOM_AI_API_KEY` (optional)

**Push notifications (only if enabling push)**

- `FIREBASE_SERVICE_ACCOUNT` (full JSON)
- `APNS_KEY_P8` / `APNS_KEY_ID` / `APNS_TEAM_ID` / `APNS_BUNDLE_ID`
- `APNS_USE_SANDBOX` (optional)

Other optional runtime toggles referenced by edge functions:

- `CONTENT_POLICY`
- `ENABLE_MEDICAL_AI_CHAT`
- `ENABLE_GENITAL_HEALTH_AI`
- `ALLOW_UNLICENSED_SEDUCTIVE_AI`
- `SEDUCTIVE_AI_*` (rate limits + model settings)
- `APP_URL` (used by billing portal return URL)

### 2.2 Hosting (frontend) environment variables

These must be configured on your hosting platform (Vercel/Netlify/etc.):

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_APP_ENV`
- `VITE_APP_VERSION`

See `.env.example` for the full client build inventory.

### 2.3 GitHub Actions secrets (deploy wiring)

For CI deploy jobs (see `.github/workflows/ci.yml`):

**Staging**

- `STAGING_DEPLOY_ENABLED` = `true`
- `STAGING_DEPLOY_COMMAND` = your deploy command

**Production**

- `PRODUCTION_DEPLOY_ENABLED` = `true`
- `PRODUCTION_DEPLOY_COMMAND` = your deploy command

Automation command:

```bash
npm run release:secrets:provision -- --environment production --env-file .env.production.local --repo OWNER/REPO
```

---

## 3) Import real NSFW content via `/admin/nsfw`

### 3.1 Pre-reqs

- Create the admin account (recommended): `n8ter8@gmail.com`
- Ensure it has `super_admin` (or `admin`) role in `user_roles`
- Deploy edge functions:
  - `admin-import-dlc-content`
  - `admin-rollback-dlc-import`
  - `get-dlc-signed-upload-url`
  - `get-dlc-signed-url`

### 3.2 Import flow

In the app, open:

- `/admin/nsfw` → **Content Import**

Use the provided templates:

- `docs/product/dlc/dlc-content/templates/videos.csv`
- `docs/product/dlc/dlc-content/templates/topics.csv`
- `docs/product/dlc/dlc-content/templates/positions.csv`

Recommended safe process:

1. Run with **Dry-run ON** to validate shape + mappings
2. Turn **Dry-run OFF** and import
3. If needed, run rollback using the job id shown in the results panel

---

## 4) CI deploy wiring + rollback plan

### 4.1 Wiring

Deploy is controlled via secrets (no deploy occurs unless enabled + command provided):

- `STAGING_DEPLOY_ENABLED` + `STAGING_DEPLOY_COMMAND`
- `PRODUCTION_DEPLOY_ENABLED` + `PRODUCTION_DEPLOY_COMMAND`

For the manual deployment workflow (`.github/workflows/manual-deploy.yml`), set (per environment preferred):

- `SUPABASE_DB_URL` (recommended)
- `SUPABASE_DB_PASSWORD` (optional fallback)
- `SUPABASE_PROJECT_REF`
- `SUPABASE_ACCESS_TOKEN`

### 4.2 Rollback (application)

Recommended rollback strategy:

1. Re-deploy the last known-good commit SHA (same deploy command, older ref)
2. If you deploy Docker images, roll back by pinning the prior immutable image tag
3. Document the incident and follow up with a fix-forward patch

### 4.3 Rollback (database)

Supabase migrations are forward-only by default.

Rollback options:

- **Preferred:** write a new migration that reverts the change
- **Emergency:** Supabase point-in-time recovery / restore from backup (then redeploy)
