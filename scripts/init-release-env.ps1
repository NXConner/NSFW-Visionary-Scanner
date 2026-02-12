<#
  init-release-env.ps1
  Creates a private, untracked env file for staging/production.

  - Does NOT touch `.env` (per repo security rules).
  - Will not overwrite an existing output file unless -Force is provided.
  - In -Update mode, preserves any existing keys/values already in the file and
    only adds/fills missing derived/generated keys (so provider-issued secrets you
    paste manually are not lost).
  - Attempts to recover a legacy Supabase anon key (JWT) from archived build artifacts
    or git history when no key is provided; also supports modern sb_publishable_* keys.
  - Generates internal secrets that can safely be created locally (salt/keyring/retention).

  Usage:
    pwsh -File scripts/init-release-env.ps1 -Environment staging
    pwsh -File scripts/init-release-env.ps1 -Environment staging -ProjectRef <ref> -SupabasePublishableKey <sb_publishable_or_anon_key>

  Notes:
    Provider-issued secrets (Stripe, Firebase, APNS, Supabase access token, DB credentials)
    cannot be derived from the repo; add them manually after generation.
#>

[CmdletBinding()]
param(
    [ValidateSet("staging", "production")]
    [string]$Environment = "staging",

    [string]$ProjectRef = "",

    [ValidateSet("sfw", "nsfw", "hybrid")]
    [string]$AppVersion = "nsfw",

    [ValidateSet("store", "direct")]
    [string]$DistributionChannel = "direct",

    [string]$OutFile = "",

    [string]$SupabasePublishableKey = "",

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
    $lines = $Content -split "\r?\n"
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

function Is-PlaceholderValue {
    param([string]$Value)
    $t = ($Value ?? "").Trim()
    if ([string]::IsNullOrWhiteSpace($t)) { return $true }
    $lower = $t.ToLowerInvariant()
    return (
        $lower -eq "change_me" -or
        $lower -eq "change-me" -or
        $lower -eq "replace_me" -or
        $lower -eq "replace-me" -or
        $lower -eq "your_project_ref" -or
        $lower -eq "your_supabase_anon_key" -or
        $lower -eq "pk_test_replace_me" -or
        $lower -eq "sk_test_replace_me" -or
        $lower -eq "whsec_replace_me"
    )
}

function Is-SupabasePublishableKeyValue {
    param([string]$Value)
    $t = ($Value ?? "").Trim()
    if ([string]::IsNullOrWhiteSpace($t)) { return $false }
    return $t.StartsWith("sb_publishable_")
}

function Find-DotEnvKeyIndex {
    param(
        # A dotenv file commonly contains blank lines; allow empty-string elements.
        [Parameter(Mandatory)]
        [AllowEmptyCollection()]
        [AllowEmptyString()]
        [string[]]$Lines,
        [Parameter(Mandatory)][string]$Key
    )
    $pattern = "^\s*{0}\s*=" -f [regex]::Escape($Key)
    for ($i = 0; $i -lt $Lines.Length; $i += 1) {
        $line = $Lines[$i]
        if ($null -eq $line) { continue }
        $trimStart = $line.TrimStart()
        if ($trimStart.StartsWith("#")) { continue }
        if ($line -match $pattern) { return $i }
    }
    return -1
}

function Upsert-DotEnvKey {
    param(
        # Preserve blank lines in-place (common in env templates).
        [Parameter(Mandatory)]
        [AllowEmptyCollection()]
        [AllowEmptyString()]
        [string[]]$Lines,
        [Parameter(Mandatory)][string]$Key,
        [Parameter(Mandatory)][string]$Value,
        [switch]$OnlyIfMissing
    )
    $idx = Find-DotEnvKeyIndex -Lines $Lines -Key $Key
    if ($idx -ge 0) {
        if ($OnlyIfMissing) { return ,$Lines }
        $Lines[$idx] = "$Key=$Value"
        return ,$Lines
    }
    return ,($Lines + @("$Key=$Value"))
}

function Insert-LinesAfterMarker {
    param(
        # Preserve blank lines; insertion operates on the raw line array.
        [Parameter(Mandatory)]
        [AllowEmptyCollection()]
        [AllowEmptyString()]
        [string[]]$Lines,
        [Parameter(Mandatory)][string]$MarkerRegex,
        [Parameter(Mandatory)][string[]]$InsertLines
    )
    if ($InsertLines.Length -eq 0) { return ,$Lines }
    $idx = -1
    for ($i = 0; $i -lt $Lines.Length; $i += 1) {
        if (($Lines[$i] ?? "") -match $MarkerRegex) { $idx = $i; break }
    }
    if ($idx -lt 0) {
        # Append with a small separator block if marker is missing.
        return ,($Lines + @("", "# Added by scripts/init-release-env.ps1 -Update") + $InsertLines)
    }
    $head = @()
    if ($idx -ge 0) { $head = $Lines[0..$idx] }
    $tail = @()
    if (($idx + 1) -le ($Lines.Length - 1)) { $tail = $Lines[($idx + 1)..($Lines.Length - 1)] }
    return ,($head + $InsertLines + $tail)
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

$projectRef = if (-not [string]::IsNullOrWhiteSpace($ProjectRef)) { $ProjectRef.Trim() } else { Get-SupabaseProjectRef }
$supabaseUrl = "https://$projectRef.supabase.co"

$deployEnableKey = if ($Environment -eq "staging") { "STAGING_DEPLOY_ENABLED" } else { "PRODUCTION_DEPLOY_ENABLED" }
$deployCommandKey = if ($Environment -eq "staging") { "STAGING_DEPLOY_COMMAND" } else { "PRODUCTION_DEPLOY_COMMAND" }
# Safe default: disable deploy gating until a real deploy command is configured.
$deployEnabledDefault = "false"
$deployCommandDefault = if ($AppVersion -eq "nsfw") {
    # NSFW only supports direct builds in package.json scripts.
    "npm run build:nsfw:direct"
}
else {
    "npm run build:$AppVersion`:$DistributionChannel"
}

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
$existingContent = ""
if ($Update -and (Test-Path -LiteralPath $outPath)) {
    try {
        $existingContent = Read-TextFile -Path $outPath
        $existing = Parse-DotEnv -Content $existingContent
    }
    catch {
        $existing = @{}
    }
}

$existingAnon = ""
if ($existing.ContainsKey("VITE_SUPABASE_PUBLISHABLE_KEY")) { $existingAnon = [string]$existing["VITE_SUPABASE_PUBLISHABLE_KEY"] }
elseif ($existing.ContainsKey("SUPABASE_ANON_KEY")) { $existingAnon = [string]$existing["SUPABASE_ANON_KEY"] }

$anonKey = if (-not [string]::IsNullOrWhiteSpace($SupabasePublishableKey)) { $SupabasePublishableKey.Trim() } else { "" }
if ([string]::IsNullOrWhiteSpace($anonKey) -and -not [string]::IsNullOrWhiteSpace($existingAnon)) {
    # Support both legacy JWT anon keys and modern sb_publishable_* keys.
    if (Is-SupabasePublishableKeyValue -Value $existingAnon) {
        $anonKey = $existingAnon
    }
    else {
        $payload = Try-DecodeJwtPayload -Jwt $existingAnon
        if ($null -ne $payload -and $payload.iss -eq "supabase" -and $payload.ref -eq $projectRef -and $payload.role -eq "anon") {
            $anonKey = $existingAnon
        }
    }
}
if ([string]::IsNullOrWhiteSpace($anonKey)) {
    $anonKey = Find-SupabaseAnonKey -ProjectRef $projectRef
}
if ([string]::IsNullOrWhiteSpace($anonKey)) {
    throw "Unable to determine Supabase publishable key for project_ref=$projectRef. Provide -SupabasePublishableKey from Supabase Dashboard > Project Settings > API."
}

# Generate internal secrets we can safely create locally.
$clientSalt = if ($existing.ContainsKey("VITE_CLIENT_ENCRYPTION_SALT") -and -not (Is-PlaceholderValue -Value ([string]$existing["VITE_CLIENT_ENCRYPTION_SALT"]))) { [string]$existing["VITE_CLIENT_ENCRYPTION_SALT"] } else { (New-RandomHex -Bytes 32) }
$dlcKeyring = if ($existing.ContainsKey("DLC_KEYRING_MASTER_KEY_B64") -and -not (Is-PlaceholderValue -Value ([string]$existing["DLC_KEYRING_MASTER_KEY_B64"]))) { [string]$existing["DLC_KEYRING_MASTER_KEY_B64"] } else { (New-RandomBase64 -Bytes 32) }
$retentionSecret = if ($existing.ContainsKey("DATA_RETENTION_SECRET") -and -not (Is-PlaceholderValue -Value ([string]$existing["DATA_RETENTION_SECRET"]))) { [string]$existing["DATA_RETENTION_SECRET"] } else { (New-RandomBase64 -Bytes 32) }

$providerSecretPlaceholders = @(
    "SUPABASE_ACCESS_TOKEN",
    "SUPABASE_DB_URL",
    "SUPABASE_DB_PASSWORD",
    "STRIPE_SECRET_KEY",
    "STRIPE_WEBHOOK_SECRET",
    "VITE_STRIPE_PUBLISHABLE_KEY",
    "STRIPE_PRO_PRICE_ID",
    "STRIPE_PREMIUM_PRICE_ID",
    "FIREBASE_SERVICE_ACCOUNT",
    "APNS_KEY_P8",
    "APNS_KEY_ID",
    "APNS_TEAM_ID"
)

if ($Update -and (Test-Path -LiteralPath $outPath) -and -not [string]::IsNullOrWhiteSpace($existingContent)) {
    # Non-destructive update mode: preserve existing lines (including quoting/escapes) and
    # only add/fill missing derived/generated keys. Provider-issued secrets already present
    # remain untouched.
    $lines = $existingContent -split "\r?\n"

    # Compute default deploy command based on the effective app/distribution settings.
    $effectiveAppVersion = $AppVersion
    if (
        -not $PSBoundParameters.ContainsKey("AppVersion") -and
        $existing.ContainsKey("VITE_APP_VERSION") -and
        -not (Is-PlaceholderValue -Value ([string]$existing["VITE_APP_VERSION"]))
    ) {
        $effectiveAppVersion = [string]$existing["VITE_APP_VERSION"]
    }
    $effectiveDistribution = $DistributionChannel
    if (
        -not $PSBoundParameters.ContainsKey("DistributionChannel") -and
        $existing.ContainsKey("VITE_DISTRIBUTION_CHANNEL") -and
        -not (Is-PlaceholderValue -Value ([string]$existing["VITE_DISTRIBUTION_CHANNEL"]))
    ) {
        $effectiveDistribution = [string]$existing["VITE_DISTRIBUTION_CHANNEL"]
    }
    $deployCommandDefaultUpdate = if ($effectiveAppVersion -eq "nsfw") {
        "npm run build:nsfw:direct"
    }
    else {
        "npm run build:$effectiveAppVersion`:$effectiveDistribution"
    }

    # Derived/core keys: fill only if missing/placeholder (do not overwrite user edits).
    foreach ($kv in @(
        @{ Key = "VITE_SUPABASE_URL"; Value = $supabaseUrl },
        @{ Key = "VITE_SUPABASE_PUBLISHABLE_KEY"; Value = $anonKey },
        @{ Key = "VITE_SUPABASE_PROJECT_ID"; Value = $projectRef },
        @{ Key = "SUPABASE_PROJECT_REF"; Value = $projectRef },
        @{ Key = "SUPABASE_URL"; Value = $supabaseUrl },
        @{ Key = "SUPABASE_ANON_KEY"; Value = $anonKey },
        @{ Key = "NSFW_CONTENT_BUCKET"; Value = "nsfw-content" },
        @{ Key = "APNS_BUNDLE_ID"; Value = "com.morphoscan.pro" }
    )) {
        $k = [string]$kv.Key
        $v = [string]$kv.Value
        if (-not $existing.ContainsKey($k) -or (Is-PlaceholderValue -Value ([string]$existing[$k]))) {
            $lines = Upsert-DotEnvKey -Lines $lines -Key $k -Value $v
            $existing[$k] = $v
        }
    }

    # App config keys: only overwrite if user explicitly provided the parameter; otherwise fill if missing.
    if ($PSBoundParameters.ContainsKey("AppVersion")) {
        $lines = Upsert-DotEnvKey -Lines $lines -Key "VITE_APP_VERSION" -Value $AppVersion
    }
    elseif (-not $existing.ContainsKey("VITE_APP_VERSION") -or (Is-PlaceholderValue -Value ([string]$existing["VITE_APP_VERSION"]))) {
        $lines = Upsert-DotEnvKey -Lines $lines -Key "VITE_APP_VERSION" -Value $AppVersion
    }

    if ($PSBoundParameters.ContainsKey("DistributionChannel")) {
        $lines = Upsert-DotEnvKey -Lines $lines -Key "VITE_DISTRIBUTION_CHANNEL" -Value $DistributionChannel
    }
    elseif (-not $existing.ContainsKey("VITE_DISTRIBUTION_CHANNEL") -or (Is-PlaceholderValue -Value ([string]$existing["VITE_DISTRIBUTION_CHANNEL"]))) {
        $lines = Upsert-DotEnvKey -Lines $lines -Key "VITE_DISTRIBUTION_CHANNEL" -Value $DistributionChannel
    }

    if (-not $existing.ContainsKey("VITE_APP_ENV") -or (Is-PlaceholderValue -Value ([string]$existing["VITE_APP_ENV"]))) {
        $lines = Upsert-DotEnvKey -Lines $lines -Key "VITE_APP_ENV" -Value $Environment
    }

    # Internal secrets: fill only if missing/placeholder.
    foreach ($kv in @(
        @{ Key = "VITE_CLIENT_ENCRYPTION_SALT"; Value = $clientSalt },
        @{ Key = "DLC_KEYRING_MASTER_KEY_B64"; Value = $dlcKeyring },
        @{ Key = "DATA_RETENTION_SECRET"; Value = $retentionSecret }
    )) {
        $k = [string]$kv.Key
        $v = [string]$kv.Value
        if (-not $existing.ContainsKey($k) -or (Is-PlaceholderValue -Value ([string]$existing[$k]))) {
            $lines = Upsert-DotEnvKey -Lines $lines -Key $k -Value $v
            $existing[$k] = $v
        }
    }

    # Deploy gating defaults: insert only if missing/placeholder (do not overwrite).
    foreach ($kv in @(
        @{ Key = $deployEnableKey; Value = $deployEnabledDefault },
        @{ Key = $deployCommandKey; Value = $deployCommandDefaultUpdate }
    )) {
        $k = [string]$kv.Key
        $v = [string]$kv.Value
        if (-not $existing.ContainsKey($k) -or (Is-PlaceholderValue -Value ([string]$existing[$k]))) {
            $lines = Upsert-DotEnvKey -Lines $lines -Key $k -Value $v
            $existing[$k] = $v
        }
    }

    # Provider-issued secrets: ensure placeholder keys exist so the file is fillable in-place.
    $missingProviderLines = @()
    foreach ($k in $providerSecretPlaceholders) {
        if (-not $existing.ContainsKey($k)) {
            $missingProviderLines += "$k="
            $existing[$k] = ""
        }
    }
    if ($missingProviderLines.Length -gt 0) {
        $lines = Insert-LinesAfterMarker -Lines $lines -MarkerRegex '^\s*#\s*Remaining release-only secrets must be added manually:\s*$' -InsertLines $missingProviderLines
    }

    # Write UTF-8 (no BOM) with trailing newline.
    $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
    $finalText = ($lines -join "`n").TrimEnd(([char[]]"`r`n")) + "`n"
    [System.IO.File]::WriteAllText($outPath, $finalText, $utf8NoBom)

    try {
        if ($IsLinux -or $IsMacOS) {
            & chmod 600 $outPath 2>$null | Out-Null
        }
    }
    catch {
        # Non-fatal; permissions hardening best-effort.
    }

    Write-Host "[init-release-env] Updated $resolvedOutFile (preserved existing provider secrets)" -ForegroundColor Green
    Write-Host "[init-release-env] Supabase ref detected: $projectRef" -ForegroundColor DarkGray
    Write-Host "[init-release-env] Supabase publishable key available (length: $($anonKey.Length))" -ForegroundColor DarkGray
    exit 0
}

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
    "# Provider-issued secrets (fill in manually; safe to keep in this private file):",
    "SUPABASE_ACCESS_TOKEN=",
    "SUPABASE_DB_URL=",
    "SUPABASE_DB_PASSWORD=",
    "",
    "STRIPE_SECRET_KEY=",
    "STRIPE_WEBHOOK_SECRET=",
    "VITE_STRIPE_PUBLISHABLE_KEY=",
    "",
    "# At least one *_PRICE_ID is required for monetized releases:",
    "STRIPE_PRO_PRICE_ID=",
    "STRIPE_PREMIUM_PRICE_ID=",
    "",
    "FIREBASE_SERVICE_ACCOUNT=",
    "APNS_KEY_P8=",
    "APNS_KEY_ID=",
    "APNS_TEAM_ID=",
    ""
)

# Write UTF-8 (no BOM) with trailing newline.
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText(
    $outPath,
    (($lines -join "`n").TrimEnd(([char[]]"`r`n")) + "`n"),
    $utf8NoBom
)

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
Write-Host "[init-release-env] Supabase publishable key available (length: $($anonKey.Length))" -ForegroundColor DarkGray
