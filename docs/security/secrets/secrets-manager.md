# Secrets Management Blueprint

MorphoScan Pro must never embed production secrets into the repository, Docker images, or browser-delivered bundles. Use a dedicated secrets manager (Doppler, HashiCorp Vault, or AWS Secrets Manager) to supply runtime credentials and encryption material.

## Recommended Workflow

1. **Create an environment in your secrets manager** that mirrors each deployment target (`dev`, `staging`, `prod`).
2. **Store sensitive keys** (`VITE_SUPABASE_PUBLISHABLE_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `DATABASE_URL`, `ADMIN_SUPER_EMAIL`, `VITE_CLIENT_ENCRYPTION_SALT`, etc.) and mark them as required.
3. **Inject secrets during CI/CD** by exporting them to environment variables before running `npm run build`, `npm run db:migrate`, and `npm run seed`.
4. **For local development**:
   - Install the manager's CLI (e.g., `doppler` or `vault`).
   - Authenticate once and run the app through the CLI wrapper (`doppler run -- npm run dev`).
   - Avoid committing `.env`; rely on templates (`.env.example`) for documentation only.
   - For release provisioning automation, use `npm run release:secrets:provision -- --environment <staging|production> --env-file <private-file> --repo <owner/repo>`.

## Required secret inventory (minimum)

### Client-exposed (safe to ship to browsers; still treat as sensitive)

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY` (Supabase anon/public key)
- Stripe publishable key (if used client-side)
- Any `VITE_STRIPE_*_PRICE_ID` variables (identifiers only; not secrets)

### Server-only (must never reach the browser)

- `SUPABASE_SERVICE_ROLE_KEY`
- `DATABASE_URL`
- Stripe webhook signing secret
- Stripe secret key (if used anywhere server-side)
- `FIREBASE_SERVICE_ACCOUNT` (full JSON)
- APNs auth (iOS):
  - `APNS_KEY_P8` (full .p8 content)
  - `APNS_KEY_ID`
  - `APNS_TEAM_ID`
  - `APNS_BUNDLE_ID`
  - Optional `APNS_USE_SANDBOX`
- Any AI provider keys (e.g., `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`)

### Encryption material (treat as server-managed; do not commit)

- `VITE_CLIENT_ENCRYPTION_SALT` (if required by the app, store+rotate via secrets manager; do not hardcode)

## Doppler Example

```bash
# Install CLI
brew install dopplerhq/cli/doppler

# Link project + environment
doppler setup

# Run the dev server with secrets injected
doppler run -- npm run dev
```

## HashiCorp Vault Example

```bash
vault kv put secret/morphoscan VITE_SUPABASE_URL=https://... SUPABASE_SERVICE_ROLE_KEY=...

# Retrieve and export into the environment
vault kv get -format=json secret/morphoscan | jq -r '.data.data | to_entries[] | "export \(.key)=\(.value)"' > /tmp/morphoscan-env.sh
source /tmp/morphoscan-env.sh && npm run db:migrate
```

## AWS Secrets Manager Example

```bash
aws secretsmanager create-secret \
  --name morphoscan/prod \
  --secret-string '{"VITE_SUPABASE_URL":"https://...","SUPABASE_SERVICE_ROLE_KEY":"..."}'

# Export for CI (GitHub Actions)
aws secretsmanager get-secret-value --secret-id morphoscan/prod --query SecretString --output text |
  jq -r 'to_entries[] | "\(.key)=\(.value)"' >> $GITHUB_ENV
```

## Operational Guarantees

- Rotate secrets regularly; update the secrets manager and trigger a redeploy.
- Never store service-role keys or database URLs in client bundles—use server-side middleware or edge functions.
- Log secret access through your manager's audit log to maintain compliance.
