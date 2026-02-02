## Security baseline (production readiness)

### Supabase Auth settings (manual, required)

- **Enable leaked password protection**: Supabase Dashboard → Auth → Settings → Passwords → enable _Leaked password protection_.
- **Redirect URL allowlist**: Dashboard → Auth → URL Configuration
  - Ensure only your real domains are allowed for production.
  - Remove preview/temporary domains from production allowlists.
- **MFA (optional but recommended)**: enable TOTP for admin/staff accounts.

### Secrets management (do not store secrets in repo)

- Store secrets in your hosting provider / Lovable secrets.
- Keep `.env` local-only; never commit it.
- Rotation checklist:
  - Rotate Supabase keys only via the Supabase dashboard.
  - Rotate Stripe webhook secret after endpoint recreation.
  - Rotate Lovable gateway key if exposed.

### CI security gates (automated)

- `npm audit --audit-level=high` must pass (CI enforces).
- CodeQL runs on PRs and pushes for JS/TS.
- Trivy filesystem scan publishes SARIF to the Security tab.

### Edge functions hardening checklist

- `verify_jwt` must be `true` for any function that reads/writes user data.
- Webhook endpoints must set `verify_jwt = false` and validate signatures internally (Stripe/webhooks).
- Rate-limit public endpoints and expensive AI endpoints.

### Data protection

- Ensure all sensitive tables have RLS enabled and policies reviewed.
- Ensure account deletion and data retention cleanup jobs are enabled and tested.
