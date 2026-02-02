param(
    [Parameter(Mandatory = $true)][string]$SfwDbUrl,
    [Parameter(Mandatory = $true)][string]$NsfwDbUrl,
    [Parameter(Mandatory = $true)][string]$SfwProjectRef,
    [Parameter(Mandatory = $true)][string]$NsfwProjectRef,
    [switch]$SkipFunctions
)

$ErrorActionPreference = "Stop"

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
$functionsRoot = Join-Path $repoRoot "supabase/functions"

$sfwDb = $SfwDbUrl
$nsfwDb = $NsfwDbUrl

Write-Host ""
Write-Host "== Supabase Sync: SFW + NSFW ==" -ForegroundColor Cyan
Write-Host ""

Write-Host "Pushing migrations to SFW..." -ForegroundColor Yellow
$env:PGOPTIONS = "-c app.content_policy=sfw"
supabase db push --db-url $sfwDb --workdir $repoRoot --yes

Write-Host "Pushing migrations to NSFW..." -ForegroundColor Yellow
$env:PGOPTIONS = "-c app.content_policy=nsfw"
supabase db push --db-url $nsfwDb --workdir $repoRoot --yes
$env:PGOPTIONS = $null

if (-not $SkipFunctions) {
    if (Test-Path $functionsRoot) {
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
