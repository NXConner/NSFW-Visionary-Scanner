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
    [switch]$SkipPerf,
    [switch]$SkipReleaseReadiness,
    [switch]$SkipReleaseEnvValidation,
    [ValidateSet("staging", "production")]
    [string]$ReleaseEnvironment = "staging",
    [string]$ReleaseEnvFile = "",
    [switch]$Monetized,
    [switch]$RequirePush,
    [switch]$RequireNSFW
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

function Parse-DotEnvFile {
    param([Parameter(Mandatory)][string]$Path)
    $map = @{}
    if (-not (Test-Path -LiteralPath $Path)) { return $map }
    $content = Get-Content -LiteralPath $Path -Raw -ErrorAction Stop
    $lines = ($content ?? "") -split "\r?\n"
    foreach ($line in $lines) {
        $t = ($line ?? "").Trim()
        if ([string]::IsNullOrWhiteSpace($t)) { continue }
        if ($t.StartsWith("#")) { continue }
        $idx = $t.IndexOf("=")
        if ($idx -lt 1) { continue }
        $key = $t.Substring(0, $idx).Trim()
        $value = $t.Substring($idx + 1).Trim()
        if (
            ($value.StartsWith('"') -and $value.EndsWith('"')) -or
            ($value.StartsWith("'") -and $value.EndsWith("'"))
        ) {
            $value = $value.Substring(1, $value.Length - 2)
        }
        if (-not [string]::IsNullOrWhiteSpace($key)) {
            $map[$key] = $value
        }
    }
    return $map
}

function Import-EnvVarsFromFileIfMissing {
    param(
        [Parameter(Mandatory)][string]$EnvFilePath,
        [Parameter(Mandatory)][string[]]$Keys
    )
    if (-not (Test-Path -LiteralPath $EnvFilePath)) { return }
    $parsed = Parse-DotEnvFile -Path $EnvFilePath
    foreach ($k in $Keys) {
        $current = [Environment]::GetEnvironmentVariable($k, "Process")
        if (-not [string]::IsNullOrWhiteSpace($current)) { continue }
        if (-not $parsed.ContainsKey($k)) { continue }
        $v = [string]$parsed[$k]
        if ([string]::IsNullOrWhiteSpace($v)) { continue }
        [Environment]::SetEnvironmentVariable($k, $v, "Process")
    }
}

function Import-ReleaseEnvIfAvailable {
    param([Parameter(Mandatory)][string[]]$Keys)
    $candidates = @()
    if (-not [string]::IsNullOrWhiteSpace($ReleaseEnvFile)) { $candidates += $ReleaseEnvFile }
    $candidates += ".env.$ReleaseEnvironment.local"
    $candidates += ".env.staging.local"
    $candidates += ".env.production.local"

    foreach ($p in $candidates) {
        if (Test-Path -LiteralPath $p) {
            Import-EnvVarsFromFileIfMissing -EnvFilePath $p -Keys $Keys
            return
        }
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
Run-Step -Name "playwright install" -Action { npx playwright install } -Skip:$SkipE2E -SkipReason "flagged"
Run-Step -Name "e2e tests" -Action { npm run test:e2e } -Skip:$SkipE2E -SkipReason "flagged"

# Build
Run-Step -Name "prod build (nsfw direct)" -Action { npm run build:nsfw:direct } -Skip:$SkipBuild -SkipReason "flagged"

# Supabase migrations/types
if (-not $SkipSupabase) {
    $hasNpx = Get-Command npx -ErrorAction SilentlyContinue
    if ($null -eq $hasNpx) {
        Add-Result -Bucket "Manual" -Message "npx not found; install Node.js tooling to run Supabase checks"
        Write-Host "  ⚠️  npx not found (manual)" -ForegroundColor Yellow
    } else {
        # If a release env file exists, use it to populate SUPABASE_* env vars for this session.
        Import-ReleaseEnvIfAvailable -Keys @(
            "SUPABASE_ACCESS_TOKEN",
            "SUPABASE_PROJECT_REF"
        )

        # db push (remote) requires credentials.
        if ($env:SUPABASE_ACCESS_TOKEN -and $env:SUPABASE_PROJECT_REF) {
            Run-Step -Name "supabase db push" -Action { npm run db:push } -Skip:$false
        } else {
            Add-Result -Bucket "Manual" -Message "Set SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF and run npm run db:push"
            Write-Host "  ⚠️  Missing SUPABASE_ACCESS_TOKEN / SUPABASE_PROJECT_REF (manual)" -ForegroundColor Yellow
        }

        # Local types check requires Docker + a running local Supabase stack.
        $hasDocker = Get-Command docker -ErrorAction SilentlyContinue
        if ($null -eq $hasDocker) {
            Add-Result -Bucket "Manual" -Message "Install Docker to run local Supabase type checks (npm run db:start, then npm run db:types:check)"
            Write-Host "  ⚠️  Docker not found (manual)" -ForegroundColor Yellow
        } else {
            & npx supabase status | Out-Null
            if ($LASTEXITCODE -ne 0) {
                Add-Result -Bucket "Manual" -Message "Start local Supabase stack (npm run db:start) to run npm run db:types:check"
                Write-Host "  ⚠️  Local Supabase stack not running (manual)" -ForegroundColor Yellow
            } else {
                Run-Step -Name "db types check" -Action { npm run db:types:check } -Skip:$false
            }
        }
    }
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
Run-Step -Name "release readiness gate" -Action { npm run check:release-readiness } -Skip:$SkipReleaseReadiness -SkipReason "flagged"
if (-not $SkipReleaseEnvValidation) {
    if ([string]::IsNullOrWhiteSpace($ReleaseEnvFile)) {
        Add-Result -Bucket "Manual" -Message "Provide -ReleaseEnvFile to run release env validation (npm run release:env:validate)"
        Write-Host "  ⚠️  Release env validation skipped (missing -ReleaseEnvFile)" -ForegroundColor Yellow
    } else {
        Run-Step -Name "release env validation" -Action {
            $commandArgs = @(
                "run", "release:env:validate", "--",
                "--environment", $ReleaseEnvironment,
                "--env-file", $ReleaseEnvFile
            )
            if ($Monetized) { $commandArgs += "--monetized" }
            if ($RequirePush) { $commandArgs += "--require-push" }
            if ($RequireNSFW) { $commandArgs += "--require-nsfw" }
            & npm @commandArgs
        } -Skip:$false
    }
} else {
    Add-Result -Bucket "Skipped" -Message "release env validation (flagged)"
}

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
