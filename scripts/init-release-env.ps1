<#
  init-release-env.ps1
  Creates a private, untracked env file for staging/production.

  - Does NOT touch `.env` (per repo security rules).
  - Will not overwrite an existing output file unless -Force is provided.
  - Attempts to recover the Supabase anon key (JWT) from archived build artifacts
    or git history, validating that it matches the repo's supabase/config.toml project_id.
  - Generates internal secrets that can safely be created locally (salt/keyring/retention).

  Usage:
    pwsh -File scripts/init-release-env.ps1 -Environment staging

  Notes:
    Provider-issued secrets (Stripe, Firebase, APNS, Supabase access token, DB credentials)
    cannot be derived from the repo; add them manually after generation.
#>

[CmdletBinding()]
param(
    [ValidateSet("staging", "production")]
    [string]$Environment = "staging",

    [ValidateSet("sfw", "nsfw", "hybrid")]
    [string]$AppVersion = "nsfw",

    [ValidateSet("store", "direct")]
    [string]$DistributionChannel = "direct",

    [string]$OutFile = "",

    [switch]$Update,

    [switch]$Force
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

$RepoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $RepoRoot

function Read-TextFile {
    param([Parameter(Mandatory)][string]$Path)
    return Get-Content -LiteralPath $Path -Raw -ErrorAction Stop
}

function Parse-DotEnv {
    param([Parameter(Mandatory)][string]$Content)
    $map = @{}
    $lines = $Content -split "(\r?\n)"
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

function Get-SupabaseProjectRef {
    $configPath = Join-Path $RepoRoot "supabase/config.toml"
    if (-not (Test-Path -LiteralPath $configPath)) {
        throw "Missing supabase/config.toml; cannot determine SUPABASE_PROJECT_REF."
    }

    $content = Read-TextFile -Path $configPath
    $m = [regex]::Match($content, '^\s*project_id\s*=\s*"([^"]+)"', [System.Text.RegularExpressions.RegexOptions]::Multiline)
    if (-not $m.Success) {
        throw "Could not parse project_id from supabase/config.toml."
    }
    return $m.Groups[1].Value.Trim()
}

function ConvertFrom-Base64Url {
    param([Parameter(Mandatory)][string]$Value)
    $b64 = $Value.Replace("-", "+").Replace("_", "/")
    switch ($b64.Length % 4) {
        2 { $b64 += "==" }
        3 { $b64 += "=" }
    }
    $bytes = [Convert]::FromBase64String($b64)
    return [System.Text.Encoding]::UTF8.GetString($bytes)
}

function Try-DecodeJwtPayload {
    param([Parameter(Mandatory)][string]$Jwt)
    try {
        $parts = $Jwt.Split(".")
        if ($parts.Length -ne 3) { return $null }
        $payloadJson = ConvertFrom-Base64Url -Value $parts[1]
        return ($payloadJson | ConvertFrom-Json -ErrorAction Stop)
    }
    catch {
        return $null
    }
}

function Find-SupabaseAnonKeyInText {
    param(
        [Parameter(Mandatory)][string]$Text,
        [Parameter(Mandatory)][string]$ProjectRef
    )

    $pattern = 'eyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}'
    $matches = [regex]::Matches($Text, $pattern)
    foreach ($m in $matches) {
        $candidate = $m.Value
        $payload = Try-DecodeJwtPayload -Jwt $candidate
        if ($null -eq $payload) { continue }
        if ($payload.iss -ne "supabase") { continue }
        if ($payload.ref -ne $ProjectRef) { continue }
        if ($payload.role -ne "anon") { continue }
        return $candidate
    }
    return ""
}

function Find-SupabaseAnonKey {
    param([Parameter(Mandatory)][string]$ProjectRef)

    # Prefer archived build bundles (these commonly contain the anon key used at build time).
    $bundlePaths = @(
        (Join-Path $RepoRoot "deleted files/android/app/src/main/assets/public/assets/index-DtOCbwg8.js"),
        (Join-Path $RepoRoot "deleted files/android/app/src/main/assets/public/assets/index-CzRJLDUR.js")
    )

    foreach ($p in $bundlePaths) {
        if (-not (Test-Path -LiteralPath $p)) { continue }
        $text = Read-TextFile -Path $p
        $anon = Find-SupabaseAnonKeyInText -Text $text -ProjectRef $ProjectRef
        if (-not [string]::IsNullOrWhiteSpace($anon)) {
            return $anon
        }
    }

    # Fallback: scan git history for `.env` revisions (no secrets are printed).
    $revsRaw = (& git rev-list --all -- ".env" 2>$null) | Out-String
    $revs = $revsRaw -split '\s+' | Where-Object { $_ -and $_.Trim().Length -gt 0 }
    foreach ($rev in $revs) {
        foreach ($r in @($rev, "$rev^")) {
            $envText = (& git show "${r}:.env" 2>$null) | Out-String
            if ([string]::IsNullOrWhiteSpace($envText)) { continue }

            $m = [regex]::Match($envText, '^\s*VITE_SUPABASE_PUBLISHABLE_KEY\s*=\s*(.+)\s*$', [System.Text.RegularExpressions.RegexOptions]::Multiline)
            if (-not $m.Success) { continue }
            $candidate = $m.Groups[1].Value.Trim()
            # Strip simple quotes if present.
            if (($candidate.StartsWith('"') -and $candidate.EndsWith('"')) -or ($candidate.StartsWith("'") -and $candidate.EndsWith("'"))) {
                $candidate = $candidate.Substring(1, $candidate.Length - 2)
            }
            $payload = Try-DecodeJwtPayload -Jwt $candidate
            if ($null -eq $payload) { continue }
            if ($payload.iss -eq "supabase" -and $payload.ref -eq $ProjectRef -and $payload.role -eq "anon") {
                return $candidate
            }
        }
    }

    return ""
}

function New-RandomBytes {
    param([Parameter(Mandatory)][int]$Count)
    $bytes = New-Object byte[] $Count
    [System.Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
    return $bytes
}

function New-RandomHex {
    param([Parameter(Mandatory)][int]$Bytes)
    return ([System.BitConverter]::ToString((New-RandomBytes -Count $Bytes)) -replace "-", "").ToLowerInvariant()
}

function New-RandomBase64 {
    param([Parameter(Mandatory)][int]$Bytes)
    return [Convert]::ToBase64String((New-RandomBytes -Count $Bytes))
}

$projectRef = Get-SupabaseProjectRef
$supabaseUrl = "https://$projectRef.supabase.co"

$deployEnableKey = if ($Environment -eq "staging") { "STAGING_DEPLOY_ENABLED" } else { "PRODUCTION_DEPLOY_ENABLED" }
$deployCommandKey = if ($Environment -eq "staging") { "STAGING_DEPLOY_COMMAND" } else { "PRODUCTION_DEPLOY_COMMAND" }
# Safe default: disable deploy gating until a real deploy command is configured.
$deployEnabledDefault = "false"
$deployCommandDefault = "npm run build:$AppVersion"

$resolvedOutFile = $OutFile
if ([string]::IsNullOrWhiteSpace($resolvedOutFile)) {
    $resolvedOutFile = ".env.$Environment.local"
}

$outPath = if ([System.IO.Path]::IsPathRooted($resolvedOutFile)) { $resolvedOutFile } else { (Join-Path $RepoRoot $resolvedOutFile) }

if ((Test-Path -LiteralPath $outPath) -and -not ($Force -or $Update)) {
    Write-Host "[init-release-env] $resolvedOutFile already exists; not overwriting (use -Update or -Force)." -ForegroundColor Yellow
    exit 0
}

$existing = @{}
if ($Update -and (Test-Path -LiteralPath $outPath)) {
    try {
        $existing = Parse-DotEnv -Content (Read-TextFile -Path $outPath)
    }
    catch {
        $existing = @{}
    }
}

$existingAnon = ""
if ($existing.ContainsKey("VITE_SUPABASE_PUBLISHABLE_KEY")) { $existingAnon = [string]$existing["VITE_SUPABASE_PUBLISHABLE_KEY"] }
elseif ($existing.ContainsKey("SUPABASE_ANON_KEY")) { $existingAnon = [string]$existing["SUPABASE_ANON_KEY"] }

$anonKey = ""
if (-not [string]::IsNullOrWhiteSpace($existingAnon)) {
    $payload = Try-DecodeJwtPayload -Jwt $existingAnon
    if ($null -ne $payload -and $payload.iss -eq "supabase" -and $payload.ref -eq $projectRef -and $payload.role -eq "anon") {
        $anonKey = $existingAnon
    }
}
if ([string]::IsNullOrWhiteSpace($anonKey)) {
    $anonKey = Find-SupabaseAnonKey -ProjectRef $projectRef
}
if ([string]::IsNullOrWhiteSpace($anonKey)) {
    throw "Unable to recover Supabase anon key for project_ref=$projectRef from archived bundles or git history."
}

# Generate internal secrets we can safely create locally.
$clientSalt = if ($existing.ContainsKey("VITE_CLIENT_ENCRYPTION_SALT") -and -not [string]::IsNullOrWhiteSpace($existing["VITE_CLIENT_ENCRYPTION_SALT"])) { [string]$existing["VITE_CLIENT_ENCRYPTION_SALT"] } else { (New-RandomHex -Bytes 32) }
$dlcKeyring = if ($existing.ContainsKey("DLC_KEYRING_MASTER_KEY_B64") -and -not [string]::IsNullOrWhiteSpace($existing["DLC_KEYRING_MASTER_KEY_B64"])) { [string]$existing["DLC_KEYRING_MASTER_KEY_B64"] } else { (New-RandomBase64 -Bytes 32) }
$retentionSecret = if ($existing.ContainsKey("DATA_RETENTION_SECRET") -and -not [string]::IsNullOrWhiteSpace($existing["DATA_RETENTION_SECRET"])) { [string]$existing["DATA_RETENTION_SECRET"] } else { (New-RandomBase64 -Bytes 32) }

$lines = @(
    "# $resolvedOutFile (private, untracked) — DO NOT COMMIT",
    "# Generated by scripts/init-release-env.ps1",
    "",
    "VITE_APP_ENV=$Environment",
    "VITE_APP_VERSION=$AppVersion",
    "VITE_DISTRIBUTION_CHANNEL=$DistributionChannel",
    "VITE_SUPABASE_URL=$supabaseUrl",
    "VITE_SUPABASE_PUBLISHABLE_KEY=$anonKey",
    "VITE_SUPABASE_PROJECT_ID=$projectRef",
    "VITE_CLIENT_ENCRYPTION_SALT=$clientSalt",
    "",
    "# Server/scripts helpers (not VITE_)",
    "$deployEnableKey=$deployEnabledDefault",
    "$deployCommandKey=$deployCommandDefault",
    "SUPABASE_PROJECT_REF=$projectRef",
    "SUPABASE_URL=$supabaseUrl",
    "SUPABASE_ANON_KEY=$anonKey",
    "NSFW_CONTENT_BUCKET=nsfw-content",
    "DLC_KEYRING_MASTER_KEY_B64=$dlcKeyring",
    "DATA_RETENTION_SECRET=$retentionSecret",
    "APNS_BUNDLE_ID=com.morphoscan.pro",
    "",
    "# Remaining release-only secrets must be added manually:",
    "# SUPABASE_ACCESS_TOKEN",
    "# SUPABASE_DB_URL or SUPABASE_DB_PASSWORD",
    "# STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, VITE_STRIPE_PUBLISHABLE_KEY, STRIPE_*_PRICE_ID",
    "# FIREBASE_SERVICE_ACCOUNT, APNS_KEY_P8, APNS_KEY_ID, APNS_TEAM_ID",
    ""
)

# Write UTF-8 (no BOM) with trailing newline.
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText($outPath, ($lines -join "`n"), $utf8NoBom)

try {
    if ($IsLinux -or $IsMacOS) {
        & chmod 600 $outPath 2>$null | Out-Null
    }
}
catch {
    # Non-fatal; permissions hardening best-effort.
}

Write-Host "[init-release-env] Created $resolvedOutFile" -ForegroundColor Green
Write-Host "[init-release-env] Supabase ref detected: $projectRef" -ForegroundColor DarkGray
Write-Host "[init-release-env] Supabase anon key recovered (length: $($anonKey.Length))" -ForegroundColor DarkGray
