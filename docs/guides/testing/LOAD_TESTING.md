## Load testing

### Tool

This repo uses **k6** for load testing (`performance-tests/load-test.js`).

### Install k6

- Linux: follow k6 install docs
- macOS: `brew install k6`
- Windows: `choco install k6` (or `winget install k6.k6`)

### Run (local)

1. Start the app (you already have it running).
2. Run:

```bash
k6 run -e BASE_URL="http://localhost:4173" performance-tests/load-test.js
```

Or via npm script:

```bash
npm run perf:load
```

### Run (local dev server on 8080)

If you’re running `npm run dev` (default Vite port 8080):

```bash
k6 run -e BASE_URL="http://localhost:8080" performance-tests/load-test.js
```

### Run (preview server on 4173)

If you’re running `npm run preview` (default port 4173):

```bash
k6 run -e BASE_URL="http://localhost:4173" performance-tests/load-test.js
```

### Run against a preview/hosted URL

```bash
k6 run -e BASE_URL="https://your-host" performance-tests/load-test.js
```

### NSFW media signed URL load test

This load test targets the signed URL edge function used for NSFW media delivery.

Required environment variables:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_TEST_TOKEN` (valid user access token)
- `NSFW_PACKAGE_ID`
- `NSFW_ASSET_PATH`

PowerShell example (uses current environment values):

```powershell
k6 run `
  -e SUPABASE_URL="$env:SUPABASE_URL" `
  -e SUPABASE_ANON_KEY="$env:SUPABASE_ANON_KEY" `
  -e SUPABASE_TEST_TOKEN="$env:SUPABASE_TEST_TOKEN" `
  -e NSFW_PACKAGE_ID="$env:NSFW_PACKAGE_ID" `
  -e NSFW_ASSET_PATH="$env:NSFW_ASSET_PATH" `
  performance-tests/nsfw-media-load-test.js
```

Or via npm script (uses the same env vars):

```powershell
npm run perf:nsfw-media
```

### Output artifacts

The script writes:

- `performance-report.json` (k6 summary JSON)
- `performance-report-nsfw-media.json` (NSFW media summary)
