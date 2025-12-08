# Deploy All Edge Functions Script
# Deploys all NSFW-related Edge Functions to Supabase

Write-Host "=== Deploying NSFW Edge Functions ===" -ForegroundColor Cyan

$functions = @(
    "seductive-ai-chat",
    "merge-video-chunks",
    "video-editing"
)

$failed = @()

foreach ($func in $functions) {
    Write-Host "`nDeploying $func..." -ForegroundColor Yellow
    
    $result = supabase functions deploy $func 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ $func deployed successfully" -ForegroundColor Green
    } else {
        Write-Host "✗ $func deployment failed" -ForegroundColor Red
        $failed += $func
        Write-Host $result
    }
}

Write-Host "`n=== Deployment Summary ===" -ForegroundColor Cyan

if ($failed.Count -eq 0) {
    Write-Host "✓ All functions deployed successfully!" -ForegroundColor Green
} else {
    Write-Host "✗ Failed to deploy: $($failed -join ', ')" -ForegroundColor Red
    Write-Host "`nMake sure you're logged in: supabase login" -ForegroundColor Yellow
    Write-Host "And linked to your project: supabase link" -ForegroundColor Yellow
}

