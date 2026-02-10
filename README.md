# Visionary Scanner Suite

AI-assisted morphology scanning, analytics, and exporting for highly sensitive health data. This repository hosts the Vite + React + TypeScript single-page application plus the supporting tooling required for a production-ready, security-first deployment.

**Edition naming**

- **MorphoScan Pro**: SFW/store-facing build.
- **NSFW Visionary Scanner**: direct/distribution build with adult content enabled.

---

## Project Scope & Ownership

- This is a personal project owned and maintained by the repository author.
- Canonical product family: **Visionary Scanner Suite** (MorphoScan Pro + NSFW Visionary Scanner).
- The domain focus is health/NSFW scanning, analytics, and content delivery.

---

## Quickstart

1. **Install dependencies**
   ```bash
   ./scripts/install_dependencies.sh
   ```
   PowerShell alternative (Windows):
   ```powershell
   ./scripts/install_dependencies.ps1
   ```
2. **Create your environment file**
   ```bash
   cp .env.example .env
   # Update with live Supabase + security values
   ```
3. **Run the development server**
   ```bash
   npm run dev
   ```
4. **Verify linting & formatting**
   ```bash
   npm run lint
   npm run format
   ```

---

## Containerization

- **Build**: `docker build -t visionary-scanner-suite:latest .`
- **Run (single container)**: `docker run -p 4173:4173 --env-file .env visionary-scanner-suite:latest`
- **Run full stack**: `docker compose up --build`
  - `app` service serves the built SPA through `npm run preview`.
  - `db` spins up a local PostgreSQL instance that mirrors Supabase schemas for migration testing.
- Secrets are injected via `.env` (never bake real values into images). Use Docker/host secrets in production.

---

## Security Hardening

- **Secrets Management**: Follow `docs/security/secrets/secrets-manager.md` for Doppler, Vault, or AWS Secrets Manager integration. These tools should inject `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, and other sensitive values at runtime—never store them in `.env` on shared machines.
- **Dependency Vulnerability Scans**: Run `npm run scan:vuln` locally and in CI to surface `npm audit --audit-level=high` findings. Address critical items before release; document intentional suppressions.
- **Least Privilege**: Use the provided `roles` + `user_roles` tables and RLS policies. Only service-role tokens may mutate roles or audit logs.
- **Audit Trails**: Write significant security events (exports, role changes, GDPR deletes) into `public.audit_logs` for tamper-evident history.

---

## Database & Migrations

This repo uses **Supabase CLI migrations** in `supabase/migrations/*.sql` as the single source of truth.

| Command                  | Purpose                                         |
| ------------------------ | ----------------------------------------------- |
| `npm run db:start`       | Start local Supabase stack (Docker)             |
| `npm run db:push`        | Apply migrations to local DB                    |
| `npm run db:reset`       | Reset local DB and apply migrations (no seed)   |
| `npm run db:types`       | Regenerate `src/integrations/supabase/types.ts` |
| `npm run db:types:check` | Verify types match local schema (CI gate)       |

Legacy node-pg-migrate scripts remain available as `db:*:legacy` for backward compatibility, but should not be used for new work.

1. Ensure `DATABASE_URL` points to your Supabase or local Postgres instance.
2. For local testing, `docker compose up db` exposes `postgresql://morphoscan_admin:change-me@localhost:5432/morphoscan`.
3. Supabase projects require a service-role key when running migrations remotely.

### Seeding & Super Admin Setup

1. In the Supabase dashboard, navigate to **Authentication → Users → Add user** and create `n8ter8@gmail.com`. Require email confirmation as desired, but ensure the account exists before proceeding.
2. Update `.env` with `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`, and (optionally) `ADMIN_SUPER_EMAIL` if you want to seed a different account.
3. Run `npm run seed`. The script will:
   - Upsert the `super_admin`, `clinician`, and `patient` roles.
   - Assign `super_admin` to `n8ter8@gmail.com` (or `ADMIN_SUPER_EMAIL`).
   - Insert sample diary data for quick smoke testing.
4. Rerun the seed anytime—operations are idempotent.

---

## Environment Variables

All required variables live in `.env.example`. Duplicate it to `.env` and populate with real credentials before running locally or deploying.

| Variable                        | Description                                                     |
| ------------------------------- | --------------------------------------------------------------- |
| `VITE_SUPABASE_URL`             | Supabase project URL                                            |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/public key for browser clients                    |
| `VITE_APP_ENV`                  | `development`, `staging`, or `production`                       |
| `VITE_APP_VERSION`              | Build flavor: `sfw`, `nsfw`, or `hybrid`                        |
| `VITE_DISTRIBUTION_CHANNEL`     | Pricing channel: `store` or `direct`                            |
| `VITE_FEATURE_FLAGS`            | Comma-separated feature toggles                                 |
| `VITE_PRIVACY_CONTACT_EMAIL`    | Contact surfaced on the privacy dashboard                       |
| `VITE_CLIENT_ENCRYPTION_SALT`   | Additional entropy for local encryption helpers                 |
| `SUPABASE_SERVICE_ROLE_KEY`     | Server-side helper for migrations/seeding                       |
| `ADMIN_SUPER_EMAIL`             | Email that should receive the `super_admin` role during seeding |

> Never commit `.env` or plaintext secrets. Store them in your preferred secrets manager for CI/CD and deployments.

---

## Branching Strategy

- `main`: protected, release-ready branch (CI must pass before merge).
- `develop`: optional integration branch for large multi-phase efforts.
- `feature/<phase>-<summary>`: short-lived branches per roadmap item (e.g., `feature/phase1-visual-excellence`).
- Rebase frequently, keep commits atomic, and open PRs early for review.

---

## Tooling & Scripts

| Command                | Purpose                              |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Launch Vite dev server on port 8080  |
| `npm run build`        | Production build output              |
| `npm run lint`         | ESLint (JSX a11y + TypeScript rules) |
| `npm run lint:fix`     | ESLint auto-fix                      |
| `npm run format`       | Prettier check                       |
| `npm run format:write` | Prettier write                       |

Supporting scripts:

- `./scripts/install_dependencies.sh` – Idempotent dependency bootstrapper.
- Husky pre-commit hook – Runs ESLint + Prettier through lint-staged.

---

## Tech Stack

- **Framework**: React 18, TypeScript 5, Vite 7
- **UI**: Tailwind CSS, shadcn/ui, custom glassmorphism design system
- **State & Data**: React Context, TanStack Query, Supabase client, AES-GCM encrypted local storage
- **Tooling**: ESLint (flat config) + jsx-a11y, Prettier, Husky, lint-staged
- **Testing**: Vitest, Playwright, k6 (see `docs/guides/testing/LOAD_TESTING.md`)

## Additional docs

### Quick Reference

- **Quick Reference**: `docs/QUICK_REFERENCE.md` - Command cheat sheet and common workflows
- **Production Status**: `docs/PRODUCTION_READY_SUMMARY.md` - Current production readiness status
- **Next Steps**: `docs/NEXT_STEPS_ACTION_PLAN.md` - Step-by-step deployment guide

### Setup & Configuration

- **Quick Start**: `docs/guides/setup/QUICK_START_GUIDE.md` - Get started in 5 minutes
- **Setup Guide**: `docs/guides/setup/SETUP_GUIDE.md` - Complete setup instructions
- **Production Setup**: `docs/guides/setup/PRODUCTION_ENV_SETUP.md` - Production environment configuration

### Deployment

- **Deployment Guide**: `docs/guides/deployment/DEPLOYMENT_GUIDE.md` - Production deployment
- **Deployment Checklist**: `docs/guides/deployment/DEPLOYMENT_CHECKLIST.md` - Pre-deployment checklist
- **Android Build**: `docs/ANDROID_SYNC_BUILD_INSTRUCTIONS.md` - Android build workflow

### Security

- **Security Baseline**: `docs/security/baseline/SECURITY_BASELINE.md`
- **RLS Audit**: `docs/security/rls/RLS_AUDIT_CHECKLIST.md`

### API & Testing

- **API**: `docs/api/API.md` (includes `docs/api/swagger.json` generation)
- **Testing Guide**: `docs/guides/testing/PRODUCTION_TESTING_GUIDE.md` - Production testing checklist

### Reports & Status

- **Optimization Summary**: `docs/reports/FINAL_OPTIMIZATION_SUMMARY.md` - Performance optimizations
- **Canonical Tracker**: `docs/tracking/PROJECT_TRACKER.md` - single status source entrypoint
- **Remaining Work**: `docs/tracking/PROJECT_REMAINING_WORK.md` - current launch blockers and manual steps

---

## Contributing

1. Fork & clone the repository.
2. Create a feature branch following the strategy above.
3. Keep commits focused; include tests and documentation for each change.
4. Run `npm run lint` and `npm run format` before pushing.
5. Open a PR using the provided template; describe risks, tests, rollout steps, and any security considerations.

Respect the security-by-design posture: no plaintext secrets, enforce encryption end-to-end, document every change, and ensure accessibility + performance budgets remain within guardrails.
