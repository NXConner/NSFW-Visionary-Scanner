# Auto-Commit Script for NSFW-Visionary-Scanner Branch
# This script watches for file changes and automatically commits/pushes them

param(
    [switch]$Start,
    [switch]$Stop,
    [int]$Interval = 30,  # Check every 30 seconds
    [string]$CommitMessage = "Auto-commit: File changes detected"
)

$projectPath = "C:\Users\n8ter\Desktop\visionary-scanner-suite-visionary-scanner-NSFW"
$pidFile = "$projectPath\.auto-commit.pid"
$logFile = "$projectPath\.auto-commit.log"

function Write-Log {
    param([string]$Message)
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logMessage = "[$timestamp] $Message"
    Add-Content -Path $logFile -Value $logMessage
    Write-Host $logMessage
}

function Start-AutoCommit {
    Set-Location $projectPath
    
    # Check if already running
    if (Test-Path $pidFile) {
        $oldPid = Get-Content $pidFile
        $process = Get-Process -Id $oldPid -ErrorAction SilentlyContinue
        if ($process) {
            Write-Log "Auto-commit is already running (PID: $oldPid)"
            Write-Log "Use -Stop to stop it first"
            return
        } else {
            Remove-Item $pidFile -Force
        }
    }
    
    # Verify git is initialized
    if (-not (Test-Path .git)) {
        Write-Log "ERROR: Git not initialized. Run setup-nsfw-branch.ps1 first"
        return
    }
    
    # Verify branch exists
    $currentBranch = git branch --show-current
    if ($currentBranch -ne "NSFW-Visionary-Scanner") {
        Write-Log "WARNING: Not on NSFW-Visionary-Scanner branch. Current: $currentBranch"
        Write-Log "Switching to NSFW-Visionary-Scanner branch..."
        git checkout NSFW-Visionary-Scanner 2>&1 | Out-Null
    }
    
    Write-Log "=== Starting Auto-Commit Watcher ==="
    Write-Log "Watching: $projectPath"
    Write-Log "Check interval: $Interval seconds"
    Write-Log "Press Ctrl+C to stop"
    Write-Log ""
    
    $lastCommitHash = git rev-parse HEAD 2>$null
    $lastStatus = ""
    
    while ($true) {
        try {
            # Check for changes
            git add -A 2>&1 | Out-Null
            $status = git status --porcelain
            
            if ($status -and $status -ne $lastStatus) {
                $changedFiles = ($status | Measure-Object -Line).Lines
                Write-Log "Detected $changedFiles file(s) changed"
                
                # Create commit message with file list
                $fileList = git diff --cached --name-only | Select-Object -First 10
                $message = "$CommitMessage`n`nChanged files:`n$($fileList -join "`n")"
                if ($fileList.Count -gt 10) {
                    $message += "`n... and $($fileList.Count - 10) more"
                }
                
                # Commit
                git commit -m $message 2>&1 | ForEach-Object { Write-Log $_ }
                
                if ($LASTEXITCODE -eq 0) {
                    Write-Log "✓ Committed changes"
                    
                    # Push to remote
                    Write-Log "Pushing to origin/NSFW-Visionary-Scanner..."
                    git push origin NSFW-Visionary-Scanner 2>&1 | ForEach-Object { Write-Log $_ }
                    
                    if ($LASTEXITCODE -eq 0) {
                        Write-Log "✓ Pushed to remote"
                    } else {
                        Write-Log "⚠ Push failed (may need authentication)"
                    }
                }
                
                $lastStatus = $status
            }
            
            Start-Sleep -Seconds $Interval
        }
        catch {
            Write-Log "ERROR: $($_.Exception.Message)"
            Start-Sleep -Seconds $Interval
        }
    }
}

function Stop-AutoCommit {
    if (Test-Path $pidFile) {
        $pid = Get-Content $pidFile
        $process = Get-Process -Id $pid -ErrorAction SilentlyContinue
        if ($process) {
            Stop-Process -Id $pid -Force
            Write-Log "Stopped auto-commit (PID: $pid)"
        }
        Remove-Item $pidFile -Force
    } else {
        Write-Log "Auto-commit is not running"
    }
}

# Main execution
if ($Stop) {
    Stop-AutoCommit
} elseif ($Start) {
    # Save PID
    $pid = $PID
    Set-Content -Path $pidFile -Value $pid
    
    # Start in background
    Start-Job -ScriptBlock {
        param($path, $interval, $commitMsg)
        Set-Location $path
        $lastStatus = ""
        while ($true) {
            git add -A 2>&1 | Out-Null
            $status = git status --porcelain
            if ($status -and $status -ne $lastStatus) {
                $fileList = git diff --cached --name-only | Select-Object -First 5
                $msg = "$commitMsg - $(($fileList -join ', '))"
                git commit -m $msg 2>&1 | Out-Null
                if ($LASTEXITCODE -eq 0) {
                    git push origin NSFW-Visionary-Scanner 2>&1 | Out-Null
                }
                $lastStatus = $status
            }
            Start-Sleep -Seconds $interval
        }
    } -ArgumentList $projectPath, $Interval, $CommitMessage | Out-Null
    
    Write-Log "Auto-commit started in background (PID: $pid)"
    Write-Log "Check status with: Get-Job"
    Write-Log "Stop with: .\auto-commit.ps1 -Stop"
} else {
    # Run in foreground (interactive mode)
    Start-AutoCommit
}

