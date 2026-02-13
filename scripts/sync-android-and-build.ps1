# Sync Android and Build APK Script
# This script syncs Capacitor Android and builds the APK

Write-Host ""
Write-Host "=== Syncing Android and Building APK ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Sync with Capacitor
Write-Host "Step 1: Syncing with Capacitor Android..." -ForegroundColor Yellow
try {
    npx cap sync android
    Write-Host "Sync successful!" -ForegroundColor Green
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
        
        if (Test-Path android\app\build\outputs\apk\release) {
            Write-Host ""
            Write-Host "=== APK Files Created ===" -ForegroundColor Green
            Get-ChildItem android\app\build\outputs\apk\release -Filter *.apk | Format-Table Name, @{Label="Size (MB)"; Expression={[math]::Round($_.Length/1MB, 2)}}, LastWriteTime -AutoSize
            Write-Host ""
            Write-Host "APK location: android\app\build\outputs\apk\release\" -ForegroundColor Cyan
        } else {
            Write-Host "APK build may have failed" -ForegroundColor Red
        }
    } catch {
        Set-Location ..
        Write-Host "Gradle build failed: $_" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "Gradle wrapper not found. Please initialize Android build first." -ForegroundColor Yellow
    Write-Host "Run: .\init-android-build.ps1" -ForegroundColor Cyan
    exit 1
}

Write-Host ""
Write-Host "=== Process Complete ===" -ForegroundColor Green
