# Setup New GitHub Repository Script
# Creates and pushes to new GitHub repository: NSFW-Visionary-Scanner

Write-Host "=== Setting up new GitHub repository: NSFW-Visionary-Scanner ===" -ForegroundColor Cyan
Write-Host ""

# Check if git is initialized
if (-not (Test-Path .git)) {
    Write-Host "Initializing git repository..." -ForegroundColor Yellow
    git init
}

# Check current remote
Write-Host "Current remote configuration:" -ForegroundColor Yellow
git remote -v
Write-Host ""

# Remove existing remote if it exists
$existingRemote = git remote | Select-String -Pattern "origin"
if ($existingRemote) {
    Write-Host "Removing existing 'origin' remote..." -ForegroundColor Yellow
    git remote remove origin
}

# Add new remote
$repoName = "NSFW-Visionary-Scanner"
$username = Read-Host "Enter your GitHub username"

Write-Host ""
Write-Host "Adding new remote: https://github.com/$username/$repoName.git" -ForegroundColor Green
git remote add origin "https://github.com/$username/$repoName.git"

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Create the repository on GitHub:" -ForegroundColor White
Write-Host "   - Go to: https://github.com/new" -ForegroundColor Gray
Write-Host "   - Repository name: $repoName" -ForegroundColor Gray
Write-Host "   - Description: NSFW Visionary Scanner - Complete Edition" -ForegroundColor Gray
Write-Host "   - Visibility: Choose Public or Private" -ForegroundColor Gray
Write-Host "   - DO NOT initialize with README, .gitignore, or license" -ForegroundColor Yellow
Write-Host "   - Click 'Create repository'" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Once the repository is created, press Enter to continue..." -ForegroundColor Yellow
Read-Host

# Check if there are uncommitted changes
$status = git status --porcelain
if ($status) {
    Write-Host ""
    Write-Host "Staging all files..." -ForegroundColor Yellow
    git add .
    
    Write-Host "Creating initial commit..." -ForegroundColor Yellow
    git commit -m "Initial commit: NSFW Visionary Scanner Complete Edition
    
- All features implemented (7 core features)
- All enhancements added (8 enhancements)
- Complete documentation (24 files)
- Production ready"
}

# Push to new repository
Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Yellow
Write-Host ""

$branch = git branch --show-current
if (-not $branch) {
    $branch = "main"
    git branch -M main
} else {
    git branch -M $branch
}

Write-Host "Pushing branch '$branch' to origin..." -ForegroundColor Yellow
git push -u origin $branch

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== Success! ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "Repository URL: https://github.com/$username/$repoName" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Your code has been pushed to GitHub!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "=== Error ===" -ForegroundColor Red
    Write-Host ""
    Write-Host "Failed to push. Common issues:" -ForegroundColor Yellow
    Write-Host "1. Repository not created on GitHub yet" -ForegroundColor Gray
    Write-Host "2. Authentication required (use GitHub CLI or SSH)" -ForegroundColor Gray
    Write-Host "3. Check your GitHub username" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To use GitHub CLI:" -ForegroundColor Yellow
    Write-Host "  gh auth login" -ForegroundColor Gray
    Write-Host "  gh repo create $repoName --public --source=. --remote=origin --push" -ForegroundColor Gray
}

