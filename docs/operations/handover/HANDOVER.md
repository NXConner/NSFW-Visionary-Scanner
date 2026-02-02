## Handover package

### First-time setup (local)

- `npm ci`
- `cp .env.example .env` and fill real values (never commit `.env`)
- `npm run db:start`
- `npm run db:push`
- `npm run db:types`
- `npm run dev` (then refresh/restart dev server when changes land)

### Quality gates

- `npm run lint`
- `npm run format`
- `npx tsc -p tsconfig.app.json --noEmit`
- `npm run test:run`
- `npm run test:e2e`

### Release checklist (production)

- Supabase:
  - Enable leaked password protection (see `docs/security/baseline/SECURITY_BASELINE.md`)
  - Confirm RLS policies (see `docs/security/rls/RLS_AUDIT_CHECKLIST.md`)
  - Confirm Edge Functions `verify_jwt` settings (`supabase/config.toml`)
- Secrets:
  - Set `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
  - Set `SUPABASE_SERVICE_ROLE_KEY` (server-only; never expose to client)
  - Set `LOVABLE_API_KEY`
  - Set Stripe keys (if using billing)
- PWA:
  - Confirm SW registration is enabled only on real production domains
- Observability:
  - Confirm Sentry DSN is configured (if used)
