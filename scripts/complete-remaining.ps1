# Complete Remaining Work (Automation)
# Runs automated checks/builds and prints manual steps still required.

param(
    [switch]$SkipInstall,
    [switch]$SkipLint,
    [switch]$SkipFormat,
    [switch]$SkipTypecheck,
    [switch]$SkipUnitTests,
    [switch]$SkipE2E,
    [switch]$SkipBuild,
    [switch]$SkipSupabase,
    [switch]$SkipDocs,
    [switch]$SkipDlcValidation,
    [switch]$SkipAudit,
    [switch]$SkipPerf
)

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

Write-Host ""
Write-Host "=== COMPLETE REMAINING WORK (AUTOMATION) ===" -ForegroundColor Cyan
Write-Host "Repo: $repoRoot" -ForegroundColor DarkGray
Write-Host ""

$results = [ordered]@{
    Passed  = @()
    Failed  = @()
    Skipped = @()
    Manual  = @()
}

function Add-Result {
    param(
        [string]$Bucket,
        [string]$Message
    )
    $results[$Bucket] += $Message
}

function Run-Step {
    param(
        [string]$Name,
        [scriptblock]$Action,
        [switch]$Skip,
        [string]$SkipReason = ""
    )
    if ($Skip) {
        Add-Result -Bucket "Skipped" -Message "$Name (skipped: $SkipReason)"
        Write-Host "  ⏭️  $Name (skipped)" -ForegroundColor Yellow
        return
    }
    Write-Host ">> $Name" -ForegroundColor Cyan
    try {
        & $Action
        if ($LASTEXITCODE -ne 0) {
            throw "Exit code $LASTEXITCODE"
        }
        Add-Result -Bucket "Passed" -Message $Name
        Write-Host "  ✅ $Name" -ForegroundColor Green
    } catch {
        Add-Result -Bucket "Failed" -Message "$Name - $($_.Exception.Message)"
        Write-Host "  ❌ $Name" -ForegroundColor Red
    }
}

# Dependencies
if (-not $SkipInstall) {
    if (Test-Path "node_modules") {
        Add-Result -Bucket "Skipped" -Message "npm install (node_modules exists)"
    } else {
        Run-Step -Name "npm install" -Action { npm install } -Skip:$false
    }
} else {
    Add-Result -Bucket "Skipped" -Message "npm install (flagged)"
}

# Code quality
Run-Step -Name "lint" -Action { npm run lint } -Skip:$SkipLint -SkipReason "flagged"
Run-Step -Name "format check" -Action { npm run format } -Skip:$SkipFormat -SkipReason "flagged"
Run-Step -Name "typecheck" -Action { npx tsc -p tsconfig.app.json --noEmit } -Skip:$SkipTypecheck -SkipReason "flagged"

# Tests
Run-Step -Name "unit tests" -Action { npm run test:run } -Skip:$SkipUnitTests -SkipReason "flagged"
Run-Step -Name "e2e tests" -Action { npm run test:e2e } -Skip:$SkipE2E -SkipReason "flagged"

# Build
Run-Step -Name "prod build (nsfw direct)" -Action { npm run build:nsfw:direct } -Skip:$SkipBuild -SkipReason "flagged"

# Supabase migrations/types
if (-not $SkipSupabase) {
    $hasSupabaseCli = Get-Command supabase -ErrorAction SilentlyContinue
    if ($null -eq $hasSupabaseCli) {
        Add-Result -Bucket "Manual" -Message "Install Supabase CLI (npm i -g supabase) to run db push"
        Write-Host "  ⚠️  Supabase CLI not found (manual)" -ForegroundColor Yellow
    } else {
        if ($env:SUPABASE_ACCESS_TOKEN -and $env:SUPABASE_PROJECT_REF) {
            Run-Step -Name "supabase db push" -Action { npm run db:push } -Skip:$false
        } else {
            Add-Result -Bucket "Manual" -Message "Set SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF and run npm run db:push"
            Write-Host "  ⚠️  Missing SUPABASE_ACCESS_TOKEN / SUPABASE_PROJECT_REF (manual)" -ForegroundColor Yellow
        }
    }
    Run-Step -Name "db types check" -Action { npm run db:types:check } -Skip:$false
} else {
    Add-Result -Bucket "Skipped" -Message "Supabase checks (flagged)"
}

# Docs / OpenAPI
Run-Step -Name "OpenAPI generation" -Action { npm run api:openapi } -Skip:$SkipDocs -SkipReason "flagged"

# DLC validations
if (-not $SkipDlcValidation) {
    Run-Step -Name "DLC catalog validation" -Action { npm run dlc:validate-catalog } -Skip:$false
    Run-Step -Name "DLC import validation" -Action { npm run dlc:validate-import } -Skip:$false
} else {
    Add-Result -Bucket "Skipped" -Message "DLC validations (flagged)"
}

# Security / audit
Run-Step -Name "npm audit" -Action { npm run scan:vuln } -Skip:$SkipAudit -SkipReason "flagged"

# Perf / a11y (optional)
if (-not $SkipPerf) {
    Run-Step -Name "perf + a11y audits" -Action { npm run optimize:all } -Skip:$false
} else {
    Add-Result -Bucket "Skipped" -Message "perf/a11y audits (flagged)"
}

# Manual tasks reminder
Add-Result -Bucket "Manual" -Message "Configure production secrets (Supabase/Stripe/FCM)"
Add-Result -Bucket "Manual" -Message "Import NSFW videos/topics via /admin/nsfw"
Add-Result -Bucket "Manual" -Message "Mobile release steps (Android AAB, iOS TestFlight)"
Add-Result -Bucket "Manual" -Message "Store listing + compliance review"

Write-Host ""
Write-Host "=== SUMMARY ===" -ForegroundColor Cyan
Write-Host "Passed: $($results.Passed.Count)" -ForegroundColor Green
Write-Host "Failed: $($results.Failed.Count)" -ForegroundColor Red
Write-Host "Skipped: $($results.Skipped.Count)" -ForegroundColor Yellow
Write-Host "Manual: $($results.Manual.Count)" -ForegroundColor Yellow

if ($results.Failed.Count -gt 0) {
    Write-Host ""
    Write-Host "Failed steps:" -ForegroundColor Red
    $results.Failed | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}

if ($results.Manual.Count -gt 0) {
    Write-Host ""
    Write-Host "Manual steps:" -ForegroundColor Yellow
    $results.Manual | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
}

Write-Host ""
if ($results.Failed.Count -gt 0) {
    exit 1
}
exit 0
