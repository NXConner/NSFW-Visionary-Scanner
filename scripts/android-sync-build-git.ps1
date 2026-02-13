# Complete Android Sync, Build, and Git Update Script
# This script: 1) Syncs Android, 2) Builds APK, 3) Updates GitHub

Write-Host ""
Write-Host "=== Android Sync, Build & Git Update ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Sync with Capacitor
Write-Host "Step 1: Syncing with Capacitor Android..." -ForegroundColor Yellow
try {
    npx cap sync android
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Sync successful!" -ForegroundColor Green
    } else {
        Write-Host "Sync failed with exit code $LASTEXITCODE" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Sync failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Build APK with Gradle
Write-Host "Step 2: Building APK with Gradle..." -ForegroundColor Yellow
if (Test-Path android\gradlew.bat) {
    Set-Location android
    try {
        .\gradlew.bat assembleRelease
        Set-Location ..
        
        if ($LASTEXITCODE -eq 0) {
            if (Test-Path android\app\build\outputs\apk\release) {
                Write-Host ""
                Write-Host "=== APK Files Created ===" -ForegroundColor Green
                Get-ChildItem android\app\build\outputs\apk\release -Filter *.apk | Format-Table Name, @{Label="Size (MB)"; Expression={[math]::Round($_.Length/1MB, 2)}}, LastWriteTime -AutoSize
                Write-Host ""
                Write-Host "APK location: android\app\build\outputs\apk\release\" -ForegroundColor Cyan
            } else {
                Write-Host "APK build completed but output directory not found" -ForegroundColor Yellow
            }
        } else {
            Set-Location ..
            Write-Host "Gradle build failed with exit code $LASTEXITCODE" -ForegroundColor Red
            exit 1
        }
    } catch {
        Set-Location ..
        Write-Host "Gradle build failed: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Gradle wrapper not found. Skipping APK build." -ForegroundColor Yellow
    Write-Host "Run: .\init-android-build.ps1 to initialize Android build" -ForegroundColor Cyan
}

Write-Host ""

# Step 3: Git Status
Write-Host "Step 3: Checking Git status..." -ForegroundColor Yellow
try {
    $gitStatus = git status --short
    if ($gitStatus) {
        Write-Host "Modified files:" -ForegroundColor Cyan
        $gitStatus | ForEach-Object { Write-Host "  $_" -ForegroundColor White }
        Write-Host ""
        Write-Host "Ready to commit changes" -ForegroundColor Green
    } else {
        Write-Host "No changes to commit" -ForegroundColor Yellow
    }
} catch {
    Write-Host "Git status check failed: $_" -ForegroundColor Red
}

Write-Host ""
Write-Host "=== Process Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Review changes: git status" -ForegroundColor White
Write-Host "  2. Add files: git add ." -ForegroundColor White
Write-Host "  3. Commit: git commit -m 'Sync Android, rebuild APK, and update exports'" -ForegroundColor White
Write-Host "  4. Push: git push" -ForegroundColor White
