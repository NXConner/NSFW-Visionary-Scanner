# Setup GitHub Repository using GitHub CLI
Write-Host "=== Setting up GitHub Repository: NSFW-Visionary-Scanner ===" -ForegroundColor Cyan
Write-Host ""

# Refresh PATH
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

# Check authentication
Write-Host "Checking GitHub authentication..." -ForegroundColor Yellow
gh auth status 2>&1 | Out-Null

if ($LASTEXITCODE -ne 0) {
    Write-Host "Not authenticated. Please authenticate:" -ForegroundColor Yellow
    gh auth login
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Authentication cancelled. Exiting." -ForegroundColor Red
        exit 1
    }
}

Write-Host "Authenticated with GitHub" -ForegroundColor Green
Write-Host ""

# Create repository and push
Write-Host "Creating repository..." -ForegroundColor Yellow
gh repo create NSFW-Visionary-Scanner --public --description "NSFW Visionary Scanner - Complete Edition" --source=. --remote=origin --push

if ($LASTEXITCODE -eq 0) {
    Write-Host "Success! Repository created and code pushed!" -ForegroundColor Green
    Write-Host "Repository URL: https://github.com/NXConner/NSFW-Visionary-Scanner" -ForegroundColor Cyan
} else {
    Write-Host "Trying manual push..." -ForegroundColor Yellow
    git push -u origin NSFW-Visionary-Scanner
}
