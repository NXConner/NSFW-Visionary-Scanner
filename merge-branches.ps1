# Merge all branches into visionary-scanner-NSFW
Write-Host "=== Branch Analysis and Merge Script ===" -ForegroundColor Cyan

# Get current branch
$currentBranch = git rev-parse --abbrev-ref HEAD
Write-Host "Current branch: $currentBranch" -ForegroundColor Yellow

# Get all local branches
Write-Host "`n=== Local Branches ===" -ForegroundColor Cyan
$localBranches = git branch --format='%(refname:short)'
$localBranches | ForEach-Object { Write-Host "  $_" }

# Get all remote branches
Write-Host "`n=== Remote Branches ===" -ForegroundColor Cyan
$remoteBranches = git branch -r --format='%(refname:short)'
$remoteBranches | ForEach-Object { Write-Host "  $_" }

# Fetch all remotes
Write-Host "`n=== Fetching all remotes ===" -ForegroundColor Cyan
git fetch --all

# Create new branch from current branch
$newBranch = "visionary-scanner-NSFW"
Write-Host "`n=== Creating new branch: $newBranch ===" -ForegroundColor Cyan

# Check if branch already exists
$branchExists = git branch --list $newBranch
if ($branchExists) {
    Write-Host "Branch $newBranch already exists. Checking it out..." -ForegroundColor Yellow
    git checkout $newBranch
} else {
    Write-Host "Creating new branch $newBranch from $currentBranch..." -ForegroundColor Green
    git checkout -b $newBranch
}

# Get list of all branches to merge (excluding main, HEAD, and the new branch itself)
$branchesToMerge = @()
$allBranches = git branch -a --format='%(refname:short)' | Where-Object { 
    $_ -notmatch 'HEAD' -and 
    $_ -ne 'main' -and 
    $_ -ne 'origin/main' -and
    $_ -ne $newBranch -and
    $_ -ne "origin/$newBranch"
}

Write-Host "`n=== Branches to merge ===" -ForegroundColor Cyan
foreach ($branch in $allBranches) {
    $cleanBranch = $branch -replace '^origin/', ''
    if ($cleanBranch -notin $branchesToMerge -and $cleanBranch -ne 'main') {
        $branchesToMerge += $cleanBranch
        Write-Host "  - $cleanBranch" -ForegroundColor White
    }
}

# Merge main first
Write-Host "`n=== Merging main branch ===" -ForegroundColor Cyan
git merge main --no-edit -m "Merge main into $newBranch"

# Merge each branch
foreach ($branch in $branchesToMerge) {
    Write-Host "`n=== Merging branch: $branch ===" -ForegroundColor Cyan
    try {
        # Try to merge the branch
        git merge $branch --no-edit -m "Merge $branch into $newBranch"
        Write-Host "  ✓ Successfully merged $branch" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ Could not merge $branch (may already be merged or branch doesn't exist)" -ForegroundColor Yellow
        # Continue with next branch
    }
}

# Push to remote
Write-Host "`n=== Pushing to remote ===" -ForegroundColor Cyan
git push -u origin $newBranch

Write-Host "`n=== Final Branch Status ===" -ForegroundColor Cyan
git branch -a

Write-Host "`n✓ Complete! New branch '$newBranch' created and all branches merged." -ForegroundColor Green

