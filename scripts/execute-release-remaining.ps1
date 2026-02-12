# Release Remaining Work Orchestrator (PowerShell)
# Runs automated P0-P3 release tasks in sequence.

param(
    [ValidateSet("staging", "production")]
    [string]$Environment = "staging",

    [string]$EnvFile = "",
    [string]$Repo = "",

    # When true, the orchestrator will attempt to create/update the provided -EnvFile using
    # scripts/init-release-env.ps1 (safe: preserves provider-issued secrets already present).
    [bool]$AutoInitEnvFile = $true,

    [switch]$SkipReleaseReadiness,
    [switch]$SkipEnvValidation,
    [switch]$SkipSecretsProvision,
    [switch]$SkipRemoteOps,
    [switch]$ApplyMigrations,
    [switch]$SkipTypesCheck,
    [switch]$DryRun,

    [switch]$TriggerManualDeploy,
    [string]$DeployRef = "",
    [switch]$RunMigrationsInWorkflow,
    [switch]$SkipEdgeFunctions,
    [switch]$SkipAppDeploy,

    [switch]$Monetized,
    [switch]$RequirePush,
    [switch]$RequireNSFW
)

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

if ($DryRun -and $ApplyMigrations) {
    throw "DryRun and ApplyMigrations cannot both be enabled."
}

Write-Host ""
Write-Host "=== RELEASE REMAINING ORCHESTRATOR ===" -ForegroundColor Cyan
Write-Host "Environment: $Environment" -ForegroundColor DarkGray
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

function Invoke-NpmScript {
    param(
        [string]$Script,
        [string[]]$ScriptArgs = @()
    )

    $commandArgs = @("run", $Script)
    if ($ScriptArgs.Count -gt 0) {
        $commandArgs += "--"
        $commandArgs += $ScriptArgs
    }

    & npm @commandArgs
    if ($LASTEXITCODE -ne 0) {
        throw "npm run $Script failed with exit code $LASTEXITCODE"
    }
}

function Invoke-Step {
    param(
        [string]$Name,
        [scriptblock]$Action,
        [switch]$Skip,
        [string]$SkipReason = "flagged",
        # Return a non-empty string to treat the failure as "Manual" instead of "Failed".
        [scriptblock]$ManualIf
    )

    if ($Skip) {
        Add-Result -Bucket "Skipped" -Message "$Name (skipped: $SkipReason)"
        Write-Host "  ⏭️  $Name (skipped)" -ForegroundColor Yellow
        return
    }

    Write-Host ">> $Name" -ForegroundColor Cyan
    try {
        & $Action
        Add-Result -Bucket "Passed" -Message $Name
        Write-Host "  ✅ $Name" -ForegroundColor Green
    }
    catch {
        $manualReason = ""
        if ($ManualIf) {
            try {
                $manualReason = (& $ManualIf $_) ?? ""
            }
            catch {
                $manualReason = ""
            }
        }

        if (-not [string]::IsNullOrWhiteSpace($manualReason)) {
            Add-Result -Bucket "Manual" -Message "$Name - $manualReason"
            Write-Host "  ⚠️  $Name (manual)" -ForegroundColor Yellow
            Write-Host "     $manualReason" -ForegroundColor DarkGray
            return
        }

        Add-Result -Bucket "Failed" -Message "$Name - $($_.Exception.Message)"
        Write-Host "  ❌ $Name" -ForegroundColor Red
    }
}

$script:EnvFileEnsured = $false
function Ensure-EnvFile {
    if ($script:EnvFileEnsured) { return }
    if ([string]::IsNullOrWhiteSpace($EnvFile)) {
        throw "EnvFile is required for this step. Pass -EnvFile <path>."
    }

    if (-not $AutoInitEnvFile) {
        if (-not (Test-Path $EnvFile)) {
            throw "EnvFile not found: $EnvFile"
        }
        $script:EnvFileEnsured = $true
        return
    }

    $initScript = Join-Path $repoRoot "scripts/init-release-env.ps1"
    if (-not (Test-Path $initScript)) {
        throw "init-release-env script not found: $initScript"
    }
    $templateEnv = Join-Path $repoRoot "config/release/release.secrets.template.env"

    $distribution = if ($Environment -eq "production") { "store" } else { "direct" }
    if (-not (Test-Path $EnvFile)) {
        if (Test-Path $templateEnv) {
            Write-Host "  ℹ️  EnvFile not found; copying template env and auto-filling derived keys" -ForegroundColor Yellow
            Copy-Item -LiteralPath $templateEnv -Destination $EnvFile -Force
            & pwsh -NoProfile -File $initScript -Environment $Environment -OutFile $EnvFile -Update -AppVersion nsfw -DistributionChannel $distribution
            if ($LASTEXITCODE -ne 0) { throw "Failed to initialize env file from template: $EnvFile" }
        }
        else {
            Write-Host "  ℹ️  EnvFile not found; creating skeleton via scripts/init-release-env.ps1" -ForegroundColor Yellow
            & pwsh -NoProfile -File $initScript -Environment $Environment -OutFile $EnvFile -AppVersion nsfw -DistributionChannel $distribution
            if ($LASTEXITCODE -ne 0) { throw "Failed to create env file: $EnvFile" }
        }
    }
    else {
        # Non-destructive: fills derived/generated keys only; provider secrets remain unchanged.
        & pwsh -NoProfile -File $initScript -Environment $Environment -OutFile $EnvFile -Update
        if ($LASTEXITCODE -ne 0) { throw "Failed to update env file: $EnvFile" }
    }

    $script:EnvFileEnsured = $true
}

# 1) Release readiness gate
Invoke-Step -Name "Release readiness gate" -Skip:$SkipReleaseReadiness -Action {
    Invoke-NpmScript -Script "check:release-readiness" -ScriptArgs @(
        "--report-file", "artifacts/release-readiness-report.json"
    )
}

# 2) Validate release env file quality
Invoke-Step -Name "Release env validation" -Skip:$SkipEnvValidation -ManualIf {
    param($err)
    if ($DryRun) { return "DryRun: env file still missing provider secrets. Fill .env values then re-run without -DryRun." }
    return ""
} -Action {
    Ensure-EnvFile
    $envArgs = @(
        "--env-file", $EnvFile,
        "--environment", $Environment,
        "--report-file", "artifacts/release-env-validation.$Environment.json"
    )
    if ($Monetized) { $envArgs += "--monetized" }
    if ($RequirePush) { $envArgs += "--require-push" }
    if ($RequireNSFW) { $envArgs += "--require-nsfw" }

    Invoke-NpmScript -Script "release:env:validate" -ScriptArgs $envArgs
}

# 3) Provision GH/Supabase secrets
Invoke-Step -Name "Release secrets provisioning" -Skip:$SkipSecretsProvision -ManualIf {
    param($err)
    if ($DryRun) { return "DryRun: secrets provisioning skipped (missing tokens/keys or insufficient permissions). Populate env + rerun without -DryRun." }
    return ""
} -Action {
    Ensure-EnvFile
    $secretsArgs = @(
        "--environment", $Environment,
        "--env-file", $EnvFile
    )
    if (-not [string]::IsNullOrWhiteSpace($Repo)) {
        $secretsArgs += @("--repo", $Repo)
    }
    if ($DryRun) {
        $secretsArgs += "--dry-run"
    }
    Invoke-NpmScript -Script "release:secrets:provision" -ScriptArgs $secretsArgs
}

# 4) Remote migrations/types checks
Invoke-Step -Name "Remote release ops (migrations/types)" -Skip:$SkipRemoteOps -ManualIf {
    param($err)
    if ($DryRun) { return "DryRun: remote ops skipped (missing DB credentials / Supabase auth). Configure env then rerun." }
    return ""
} -Action {
    Ensure-EnvFile
    $remoteArgs = @(
        "--env-file", $EnvFile
    )
    if (-not $SkipTypesCheck) {
        $remoteArgs += "--types-check"
    }
    if ($ApplyMigrations) {
        $remoteArgs += "--apply"
    }
    Invoke-NpmScript -Script "release:remote:ops" -ScriptArgs $remoteArgs
}

# 5) Optional dispatch of manual-deploy workflow
Invoke-Step -Name "Dispatch manual deploy workflow" -Skip:(-not $TriggerManualDeploy) -SkipReason "TriggerManualDeploy not set" -ManualIf {
    param($err)
    $msg = ($err.Exception.Message ?? "")
    if ($msg -match "HTTP 403" -or $msg -match "Resource not accessible by integration") {
        return "GitHub token cannot dispatch workflows (HTTP 403). Re-run locally with a PAT that has repo/actions permissions, or dispatch from GitHub UI."
    }
    return ""
} -Action {
    $resolvedRef = $DeployRef
    if ([string]::IsNullOrWhiteSpace($resolvedRef)) {
        $resolvedRef = (git rev-parse --abbrev-ref HEAD).Trim()
    }

    $runMigrations = if ($RunMigrationsInWorkflow) { "true" } else { "false" }
    $deployEdgeFunctions = if ($SkipEdgeFunctions) { "false" } else { "true" }
    $deployApp = if ($SkipAppDeploy) { "false" } else { "true" }

    $ghOut = & gh workflow run "manual-deploy.yml" `
        -f "environment=$Environment" `
        -f "ref=$resolvedRef" `
        -f "migrations_dry_run=true" `
        -f "run_migrations=$runMigrations" `
        -f "deploy_edge_functions=$deployEdgeFunctions" `
        -f "deploy_app=$deployApp" 2>&1

    if ($ghOut) { $ghOut | ForEach-Object { Write-Host $_ } }

    if ($LASTEXITCODE -ne 0) {
        throw ($ghOut | Out-String)
    }

    Write-Host "  ℹ️  Use 'gh run list --workflow manual-deploy.yml --limit 1' to monitor status." -ForegroundColor Yellow
}

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
Write-Host "Manual external tasks still required:" -ForegroundColor Yellow
Write-Host "  - Run docs/security/rls/RLS_STORAGE_AUDIT_QUERIES.sql in Supabase SQL editor"
Write-Host "  - Validate Stripe webhook events + paid E2E on staging/prod"
Write-Host "  - Validate push delivery on 1 real Android + 1 real iOS device"
Write-Host "  - Execute Android/iOS store submission and compliance signoff"

Write-Host ""
if ($results.Failed.Count -gt 0) {
    exit 1
}
exit 0
