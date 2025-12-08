# Simple Auto-Commit Script
# Runs in foreground and watches for changes

$projectPath = "C:\Users\n8ter\Desktop\visionary-scanner-suite-visionary-scanner-NSFW"
Set-Location $projectPath

Write-Host "=== Auto-Commit Watcher Started ===" -ForegroundColor Green
Write-Host "Watching: $projectPath" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop" -ForegroundColor Yellow
Write-Host ""

$checkInterval = 30  # Check every 30 seconds
$lastStatus = ""

while ($true) {
    try {
        # Stage all changes
        git add -A 2>&1 | Out-Null
        
        # Check for changes
        $status = git status --porcelain
        
        if ($status -and $status -ne $lastStatus) {
            $changedFiles = ($status | Measure-Object -Line).Lines
            $timestamp = Get-Date -Format "HH:mm:ss"
            
            Write-Host "[$timestamp] Detected $changedFiles file(s) changed" -ForegroundColor Yellow
            
            # Get list of changed files (first 5)
            $files = git diff --cached --name-only | Select-Object -First 5
            $fileList = $files -join ", "
            if ((git diff --cached --name-only | Measure-Object -Line).Lines -gt 5) {
                $fileList += " ..."
            }
            
            # Create commit message
            $commitMsg = "Auto-commit: $fileList"
            
            # Commit
            Write-Host "  Committing changes..." -ForegroundColor Cyan
            git commit -m $commitMsg 2>&1 | Out-Null
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "  ✓ Committed" -ForegroundColor Green
                
                # Push
                Write-Host "  Pushing to remote..." -ForegroundColor Cyan
                $pushOutput = git push origin NSFW-Visionary-Scanner 2>&1
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Host "  ✓ Pushed to GitHub" -ForegroundColor Green
                } else {
                    Write-Host "  ⚠ Push failed: $pushOutput" -ForegroundColor Red
                }
            } else {
                Write-Host "  ⚠ Commit failed" -ForegroundColor Red
            }
            
            Write-Host ""
            $lastStatus = $status
        }
        
        Start-Sleep -Seconds $checkInterval
    }
    catch {
        Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
        Start-Sleep -Seconds $checkInterval
    }
}

