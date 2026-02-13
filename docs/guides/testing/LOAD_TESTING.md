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

### Output artifacts

The script writes:

- `performance-report.json` (k6 summary JSON)
