# Release Execution Signoff (Evidence-Driven)

This guide defines how to track external release tasks with auditable evidence.

It uses:

- Step catalog: `config/release/release-signoff.steps.json`
- Signoff utility: `scripts/release-signoff.ps1`
- Session artifacts: `artifacts/release-signoff/<environment>/<session>/`

---

## 1) Initialize a signoff session

```powershell
pwsh -File scripts/release-signoff.ps1 `
  -Action init `
  -Environment staging `
  -Session "staging-2026-02-12" `
  -Operator "release-manager" `
  -IncludePayments:$true `
  -IncludePush:$true `
  -IncludeNSFW:$true
```

What this creates:

- `state.json` (machine-readable state)
- `SIGNOFF.md` (human-readable checklist + history)

---

## 2) Record evidence for each step

Use one call per completed step.

```powershell
pwsh -File scripts/release-signoff.ps1 `
  -Action record `
  -Environment staging `
  -Session "staging-2026-02-12" `
  -StepId "P0-SUPABASE-MIGRATIONS" `
  -Result pass `
  -Evidence "artifacts/release-readiness-report.json" `
  -Notes "Dry-run and apply succeeded"
```

If blocked:

```powershell
pwsh -File scripts/release-signoff.ps1 `
  -Action record `
  -Environment staging `
  -Session "staging-2026-02-12" `
  -StepId "P0-PUSH-REAL-DEVICE-DELIVERY" `
  -Result blocked `
  -Evidence "N/A" `
  -Notes "Awaiting iOS test device access"
```

---

## 3) Check status at any time

```powershell
pwsh -File scripts/release-signoff.ps1 `
  -Action status `
  -Environment staging `
  -Session "staging-2026-02-12"
```

This prints required-incomplete steps and refreshes `SIGNOFF.md`.

---

## 4) Enforce completion gate

```powershell
pwsh -File scripts/release-signoff.ps1 `
  -Action validate `
  -Environment staging `
  -Session "staging-2026-02-12"
```

- Exit `0`: all required steps passed
- Exit `1`: one or more required steps are not `pass`

---

## Recommended evidence standards

For each step, record at least one:

- Command output artifact (`artifacts/*.json`, CI run URL, logs)
- Dashboard URL + screenshot path
- Ticket/issue reference for approvals
- Test report path (Play pre-launch, TestFlight notes, etc.)

Keep evidence immutable whenever possible (artifact file, run URL, SHA-pinned log).

---

## Typical execution sequence

1. Initialize session (`init`)
2. Run automation:
   - `npm run check:release-readiness`
   - `npm run release:env:validate ...`
   - `pwsh -File scripts/execute-release-remaining.ps1 ...`
3. Record outputs per completed step (`record`)
4. Complete manual external steps and record each one
5. Run `validate` before production release decision
