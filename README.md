# MorphoScan Pro

AI-assisted morphology scanning, analytics, and exporting for highly sensitive health data. This repository hosts the Vite + React + TypeScript single-page application plus the supporting tooling required for a production-ready, security-first deployment.

---

## Quickstart

1. **Install dependencies**
   ```bash
   ./scripts/install_dependencies.sh
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

- **Build**: `docker build -t morphoscan-pro:latest .`
- **Run (single container)**: `docker run -p 4173:4173 --env-file .env morphoscan-pro:latest`
- **Run full stack**: `docker compose up --build`
  - `app` service serves the built SPA through `npm run preview`.
  - `db` spins up a local PostgreSQL instance that mirrors Supabase schemas for migration testing.
- Secrets are injected via `.env` (never bake real values into images). Use Docker/host secrets in production.

---

## Security Hardening

- **Secrets Management**: Follow `docs/secrets-manager.md` for Doppler, Vault, or AWS Secrets Manager integration. These tools should inject `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, and other sensitive values at runtime—never store them in `.env` on shared machines.
- **Dependency Vulnerability Scans**: Run `npm run scan:vuln` locally and in CI to surface `npm audit --audit-level=high` findings. Address critical items before release; document intentional suppressions.
- **Least Privilege**: Use the provided `roles` + `user_roles` tables and RLS policies. Only service-role tokens may mutate roles or audit logs.
- **Audit Trails**: Write significant security events (exports, role changes, GDPR deletes) into `public.audit_logs` for tamper-evident history.

---

## Database & Migrations

| Command                       | Purpose                                                      |
| ----------------------------- | ------------------------------------------------------------ |
| `npm run db:create -- <name>` | Scaffold a new node-pg-migrate file in `supabase/migrations` |
| `npm run db:migrate`          | Apply pending migrations using `DATABASE_URL`                |
| `npm run db:rollback`         | Roll back the last migration                                 |

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

| Variable                         | Description                                                         |
| -------------------------------- | ------------------------------------------------------------------- |
| `VITE_SUPABASE_URL`              | Supabase project URL                                                |
| `VITE_SUPABASE_PUBLISHABLE_KEY`  | Supabase anon/public key for browser clients                        |
| `VITE_SUPABASE_SERVICE_ROLE_KEY` | Secure service-role key (browser builds should **not** expose this) |
| `VITE_APP_ENV`                   | `development`, `staging`, or `production`                           |
| `VITE_APP_VERSION`               | Semver shown in diagnostics/logs                                    |
| `VITE_FEATURE_FLAGS`             | Comma-separated feature toggles                                     |
| `VITE_PRIVACY_CONTACT_EMAIL`     | Contact surfaced on the privacy dashboard                           |
| `VITE_CLIENT_ENCRYPTION_SALT`    | Additional entropy for local encryption helpers                     |
| `SUPABASE_SERVICE_ROLE_KEY`      | Server-side helper for migrations/seeding                           |
| `DATABASE_URL`                   | Postgres connection string consumed by node-pg-migrate              |
| `ADMIN_SUPER_EMAIL`              | Email that should receive the `super_admin` role during seeding     |

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

- **Framework**: React 18, TypeScript 5, Vite 5
- **UI**: Tailwind CSS, shadcn/ui, custom glassmorphism design system
- **State & Data**: React Context, TanStack Query, Supabase client, AES-GCM encrypted local storage
- **Tooling**: ESLint (flat config) + jsx-a11y, Prettier, Husky, lint-staged
- **Testing (coming in later phases)**: Vitest, Playwright, axe, k6/Artillery

---

## Contributing

1. Fork & clone the repository.
2. Create a feature branch following the strategy above.
3. Keep commits focused; include tests and documentation for each change.
4. Run `npm run lint` and `npm run format` before pushing.
5. Open a PR using the provided template; describe risks, tests, rollout steps, and any security considerations.

Respect the security-by-design posture: no plaintext secrets, enforce encryption end-to-end, document every change, and ensure accessibility + performance budgets remain within guardrails.
