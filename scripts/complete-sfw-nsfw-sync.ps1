param(
    [string]$SfwDbUrl = $env:SFW_DB_URL,
    [string]$NsfwDbUrl = $env:NSFW_DB_URL,
    [string]$SfwProjectRef = $env:SFW_PROJECT_REF,
    [string]$NsfwProjectRef = $env:NSFW_PROJECT_REF,
    [switch]$SkipFunctions,
    [switch]$SkipDbPush
)

$ErrorActionPreference = "Stop"

function Require-Value {
    param(
        [string]$Name,
        [string]$Value
    )
    if ([string]::IsNullOrWhiteSpace($Value)) {
        throw "$Name is required."
    }
    if ($Value -match "<.+>" -or $Value -match "PASSWORD" -or $Value -match "YOUR-PASSWORD") {
        throw "$Name contains placeholder text. Provide the real value."
    }
}

function Assert-Command {
    param([string]$Name)
    if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
        throw "$Name is required on PATH."
    }
}

function Invoke-DbPush {
    param(
        [string]$DbUrl,
        [string]$Policy,
        [string]$Label
    )
    Write-Host ""
    Write-Host "Pushing migrations to $Label..." -ForegroundColor Yellow
    $env:PGOPTIONS = "-c app.content_policy=$Policy"
    supabase db push --db-url $DbUrl --workdir $repoRoot --yes --include-all
    if ($LASTEXITCODE -ne 0) {
        throw "supabase db push failed for $Label."
    }
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$functionsRoot = Join-Path $repoRoot "supabase/functions"

if ([string]::IsNullOrWhiteSpace($SfwProjectRef)) { $SfwProjectRef = "thajylrvfzjmerqqkmjv" }
if ([string]::IsNullOrWhiteSpace($NsfwProjectRef)) { $NsfwProjectRef = "xbhjmuaxjpxqzrngubzo" }

Assert-Command "supabase"

Require-Value "SFW_DB_URL" $SfwDbUrl
Require-Value "NSFW_DB_URL" $NsfwDbUrl
Require-Value "SFW_PROJECT_REF" $SfwProjectRef
Require-Value "NSFW_PROJECT_REF" $NsfwProjectRef

Write-Host ""
Write-Host "== Complete SFW/NSFW Sync ==" -ForegroundColor Cyan
Write-Host "Repo: $repoRoot"
Write-Host "SFW Ref: $SfwProjectRef"
Write-Host "NSFW Ref: $NsfwProjectRef"

if (-not $SkipDbPush) {
    Invoke-DbPush -DbUrl $SfwDbUrl -Policy "sfw" -Label "SFW"
    Invoke-DbPush -DbUrl $NsfwDbUrl -Policy "nsfw" -Label "NSFW"
}

$env:PGOPTIONS = $null

if (-not $SkipFunctions) {
    if (-not (Test-Path $functionsRoot)) {
        Write-Host "No functions directory found. Skipping functions deploy." -ForegroundColor Yellow
    } else {
        Write-Host ""
        Write-Host "Deploying edge functions to SFW..." -ForegroundColor Yellow
        Get-ChildItem -Directory $functionsRoot | ForEach-Object {
            supabase functions deploy $_.Name --project-ref $SfwProjectRef --workdir $repoRoot --use-api --yes
        }

        Write-Host "Deploying edge functions to NSFW..." -ForegroundColor Yellow
        Get-ChildItem -Directory $functionsRoot | ForEach-Object {
            supabase functions deploy $_.Name --project-ref $NsfwProjectRef --workdir $repoRoot --use-api --yes
        }
    }
}

Write-Host ""
Write-Host "Sync complete." -ForegroundColor Green
