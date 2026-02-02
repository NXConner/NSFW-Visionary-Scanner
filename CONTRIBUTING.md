## Contributing

### Local setup

- Install dependencies: `npm ci`
- Copy environment: `cp .env.example .env` (do not commit `.env`)
- Run dev: `npm run dev`

### Quality gates (required)

- Lint: `npm run lint`
- Format: `npm run format` (and `npm run format:write` to fix)
- Typecheck: `npx tsc -p tsconfig.app.json --noEmit`
- Unit tests: `npm run test:run`
- E2E tests: `npm run test:e2e`

### Database/schema workflow (Supabase)

- Start local stack: `npm run db:start`
- Apply migrations: `npm run db:push` (or `npm run db:reset`)
- Regenerate types: `npm run db:types`
- Ensure no drift: `npm run db:types:check`

### Security rules

- Never commit secrets.
- Do not add mock/stub data paths for dev/prod.
- Prefer RLS-first designs; review `docs/security/rls/RLS_AUDIT_CHECKLIST.md`.
- Edge functions: default to `verify_jwt = true` unless the endpoint is a webhook or scheduled job.

### Pull requests

- Keep changes focused and atomic.
- Include a clear test plan.
- If you touched schema: include migration + updated `src/integrations/supabase/types.ts`.
