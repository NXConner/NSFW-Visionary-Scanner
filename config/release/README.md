# Release Secret Templates

Template file:

- `config/release/release.secrets.template.env`

Usage:

1. Copy template to a private local file (example: `.env.staging.local`).
2. Fill values.
3. Provision secrets:

```bash
npm run release:secrets:provision -- --environment staging --env-file .env.staging.local --repo OWNER/REPO
```

4. Run remote migration and checks:

```bash
npm run release:remote:ops -- --env-file .env.staging.local --apply --types-check
```
