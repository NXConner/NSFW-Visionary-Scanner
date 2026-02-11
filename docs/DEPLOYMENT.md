# Deployment Guide

Complete deployment checklist for MorphoScan Pro.

## Prerequisites

- Node.js 18+ and npm
- Docker (for local database and containerized deployment)
- Access to Lovable Cloud secrets

## Local Development Setup

### First-time Setup (PowerShell)

```powershell
Set-Location /workspace
.\scripts\install_dependencies.ps1
Copy-Item .env.example .env
# Fill real env values in .env (see Environment Variables below)
npm run db:start
npm run db:reset
npm run dev
```

### First-time Setup (Bash)

```bash
cd /workspace
./scripts/install_dependencies.sh
cp .env.example .env
# Fill real env values in .env (see Environment Variables below)
npm run db:start
npm run db:reset
npm run dev
```

## Environment Variables

### Required Variables

| Variable                        | Description                             | Source                         |
| ------------------------------- | --------------------------------------- | ------------------------------ |
| `VITE_SUPABASE_URL`             | Supabase project URL                    | Lovable Cloud → Settings → API |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | Supabase anon key                       | Lovable Cloud → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY`     | Supabase service role key (server-only) | Lovable Cloud → Settings → API |

### Optional Variables

| Variable                 | Description                    | When Needed           |
| ------------------------ | ------------------------------ | --------------------- |
| `STRIPE_SECRET_KEY`      | Stripe secret key              | Payment processing    |
| `STRIPE_PUBLISHABLE_KEY` | Stripe publishable key         | Client-side payments  |
| `STRIPE_WEBHOOK_SECRET`  | Stripe webhook signature       | Webhook verification  |
| `RLS_TEST_EMAIL`         | Test user email                | RLS integration tests |
| `RLS_TEST_PASSWORD`      | Test user password             | RLS integration tests |
| `PARTNER_SYNC_SEED_FILE` | Path to partner sync seed data | Partner sync tests    |

## Quality Gates

Run all checks before deployment:

```bash
# Linting (must pass with no errors)
npm run lint

# Unit tests
npm run test:run

# End-to-end tests
npm run test:e2e

# TypeScript check
npx tsc -p tsconfig.app.json --noEmit
```

## Database Operations

```bash
# Start local Supabase (requires Docker)
npm run db:start

# Apply migrations
npm run db:push

# Reset database (destructive)
npm run db:reset

# Generate TypeScript types
npm run db:types

# Verify types are current
npm run db:types:check
```

## Production Build

```bash
# Build for production
npm run build

# Preview production build locally
npm run preview
```

## Docker Deployment

```bash
# Build Docker image
docker build -t morphoscanpro:latest .

# Run container
docker run -p 8080:8080 morphoscanpro:latest
```

## CI/CD Deployment

Deployments are automated via GitHub Actions on:

- **`main` branch**: Production deployment
- **`develop` branch**: Staging deployment

### Required GitHub Secrets

Configure these in repository Settings → Secrets:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY` (if using payments)

## Mobile App Deployment

See [Mobile Build Guide](./guides/build/MOBILE_BUILD_GUIDE.md) for:

- Android APK/AAB builds
- iOS archive builds
- Google Play Store submission
- Apple App Store submission

## Post-Deployment Checklist

- [ ] Verify environment variables are set in production
- [ ] Confirm database migrations applied
- [ ] Test authentication flow
- [ ] Verify Stripe webhooks (if applicable)
- [ ] Check PWA installation on mobile
- [ ] Monitor error tracking (Sentry)

## Troubleshooting

### Common Issues

**Build fails with chunk size warnings**

- Large chunks are expected for heavy libraries (recharts, three.js, TensorFlow)
- These are code-split and lazy-loaded; warnings don't affect functionality

**Docker daemon not running**

- Required for `npm run db:start`, `npm run db:reset`, `npm run db:types`
- Start Docker Desktop or the Docker service

**npm audit vulnerabilities**

- Upstream dependencies may have vulnerabilities
- Review with `npm audit` and update where safe
- Most are in dev dependencies and don't affect production

### Getting Help

- Check existing documentation in `docs/`
- Review `CONTRIBUTING.md` for development guidelines
- Consult `docs/operations/handover/HANDOVER.md` for detailed setup
