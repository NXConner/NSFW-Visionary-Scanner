# Contributing

Thanks for contributing to **MorphoScan Pro**.

## Quickstart

### 1) Install dependencies

- Linux/macOS:
  ```bash
  ./scripts/install_dependencies.sh
  ```
- Windows PowerShell:
  ```powershell
  ./scripts/install_dependencies.ps1
  ```

### 2) Configure environment

```bash
cp .env.example .env
```

Populate `.env` with real values (never commit it).

### 3) Run quality gates locally

```bash
npm run lint
npm run format
npm run test:run
```

## Branching + commits

- Work on short-lived branches (see `README.md` for the repo’s branching strategy).
- Keep commits **atomic** and descriptive.
- Prefer:
  - `fix:` for bug fixes
  - `refactor:` for refactors with no behavior change
  - `feat:` for user-visible features
  - `chore:` for tooling/docs/maintenance

## Code standards

- TypeScript + React (Vite).
- Favor small modules:
  - Split UI/components and helpers once files grow large.
  - Prefer extracting logic into `src/lib/**` and typed hooks.
- Avoid placeholder/mock data in production code paths.
  - Empty states must be explicit (e.g., “Content not available yet”) instead of “fake” content.

## Formatting + linting

This repo uses:

- ESLint (flat config): `eslint.config.js`
- Prettier: `.prettierrc`
- Husky + lint-staged (pre-commit)

Run:

```bash
npm run lint
npm run format:write
```

## Testing

### Unit / integration (Vitest)

```bash
npm run test:run
```

### E2E (Playwright)

```bash
npm run test:e2e
```

> Note: E2E tests require valid `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY` (see CI workflow).

## Database, migrations, and Supabase

### Migrations

- Source of truth: `supabase/migrations/*.sql`
- CI verifies migrations lint + local apply.

### Generate Supabase TS types

Preferred (no Docker):

```bash
# Provide a DB connection string that can read schemas (public/auth)
export SUPABASE_DB_URL="postgresql://..."
npm run db:types
```

Local (requires Docker):

```bash
npm run db:start
npm run db:types
```

### Content/data readiness check

This checks whether core catalogs/tables are populated (and can enforce stricter rules in production).

```bash
npm run check:content -- --warn-only
```

## Security

- Never commit secrets or credentials.
- Anything prefixed with `VITE_` ends up in the browser bundle.
- Prefer server-side enforcement via:
  - RLS policies
  - Supabase Edge Functions (Stripe webhooks, signed URLs, key delivery)

If you believe you found a security issue, do not open a public issue; contact the maintainer privately.
