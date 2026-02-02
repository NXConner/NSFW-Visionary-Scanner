## API (Supabase Edge Functions)

### OpenAPI spec

- Generated file: `docs/api/swagger.json`
- Generator: `npm run api:openapi` (writes/overwrites `docs/api/swagger.json`)

### Base URL

Supabase Edge Functions are available at:

- `https://<project-ref>.supabase.co/functions/v1/<function-name>`

### Auth

- Most endpoints require `Authorization: Bearer <JWT>`
- Public endpoints (webhooks / scheduled jobs) are marked in `supabase/config.toml` with `verify_jwt = false`
