# Setup NSFW-Visionary-Scanner Branch Script
# This script will:
# 1. Initialize git (if not already)
# 2. Add remote repository
# 3. Create and push NSFW-Visionary-Scanner branch
# 4. Set up tracking for auto-sync

Write-Host "=== Setting up NSFW-Visionary-Scanner branch ===" -ForegroundColor Cyan

# Navigate to project directory
$projectPath = "C:\Users\n8ter\Desktop\visionary-scanner-suite-visionary-scanner-NSFW"
Set-Location $projectPath

# Step 1: Initialize git if needed
Write-Host "`n[1/5] Checking git initialization..." -ForegroundColor Yellow
if (-not (Test-Path .git)) {
    Write-Host "Initializing git repository..." -ForegroundColor Green
    git init
} else {
    Write-Host "Git already initialized" -ForegroundColor Green
}

# Step 2: Configure git user (if not set)
Write-Host "`n[2/5] Configuring git user..." -ForegroundColor Yellow
$currentEmail = git config user.email
$currentName = git config user.name

if (-not $currentEmail) {
    git config user.email "n8ter8@gmail.com"
    Write-Host "Set git email: n8ter8@gmail.com" -ForegroundColor Green
}
if (-not $currentName) {
    git config user.name "NXConner"
    Write-Host "Set git name: NXConner" -ForegroundColor Green
}

# Step 3: Add remote
Write-Host "`n[3/5] Setting up remote repository..." -ForegroundColor Yellow
git remote remove origin 2>$null
git remote add origin https://github.com/NXConner/visionary-scanner-suite.git
Write-Host "Remote added: origin -> https://github.com/NXConner/visionary-scanner-suite.git" -ForegroundColor Green

# Step 4: Fetch from remote
Write-Host "`n[4/5] Fetching from remote..." -ForegroundColor Yellow
git fetch origin --no-tags
Write-Host "Fetched remote branches" -ForegroundColor Green

# Step 5: Stage all files
Write-Host "`n[5/6] Staging all files..." -ForegroundColor Yellow
git add -A
$stagedFiles = (git status --short | Measure-Object -Line).Lines
Write-Host "Staged $stagedFiles files" -ForegroundColor Green

# Step 6: Create initial commit
Write-Host "`n[6/7] Creating initial commit..." -ForegroundColor Yellow
$hasCommits = git rev-parse --verify HEAD 2>$null
if ($LASTEXITCODE -ne 0) {
    git commit -m "Initial commit: Complete NSFW Visionary Scanner codebase with all features"
    Write-Host "Created initial commit" -ForegroundColor Green
} else {
    Write-Host "Repository already has commits" -ForegroundColor Yellow
    $uncommitted = git status --porcelain
    if ($uncommitted) {
        git commit -m "Update: Latest NSFW Visionary Scanner codebase"
        Write-Host "Created update commit" -ForegroundColor Green
    }
}

# Step 7: Create and push branch
Write-Host "`n[7/7] Creating and pushing NSFW-Visionary-Scanner branch..." -ForegroundColor Yellow
git checkout -b NSFW-Visionary-Scanner 2>$null
if ($LASTEXITCODE -ne 0) {
    git checkout NSFW-Visionary-Scanner
    Write-Host "Switched to existing branch" -ForegroundColor Yellow
} else {
    Write-Host "Created new branch: NSFW-Visionary-Scanner" -ForegroundColor Green
}

# Push to remote with tracking
Write-Host "`nPushing to remote..." -ForegroundColor Yellow
git push -u origin NSFW-Visionary-Scanner

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n=== SUCCESS! ===" -ForegroundColor Green
    Write-Host "Branch 'NSFW-Visionary-Scanner' created and pushed to GitHub" -ForegroundColor Green
    Write-Host "`nYour workspace is now tracking: origin/NSFW-Visionary-Scanner" -ForegroundColor Cyan
    Write-Host "`nTo sync future changes, use:" -ForegroundColor Yellow
    Write-Host "  git add ." -ForegroundColor White
    Write-Host "  git commit -m 'Your commit message'" -ForegroundColor White
    Write-Host "  git push" -ForegroundColor White
} else {
    Write-Host "`n=== PUSH FAILED ===" -ForegroundColor Red
    Write-Host "You may need to authenticate with GitHub." -ForegroundColor Yellow
    Write-Host "Try running: git push -u origin NSFW-Visionary-Scanner" -ForegroundColor Yellow
}

Write-Host "`nCurrent branch status:" -ForegroundColor Cyan
git status

