# Android Build Script for MorphoScan Pro
# This script builds the web app, syncs with Capacitor, and provides instructions for APK creation

Write-Host ""
Write-Host "=== MorphoScan Pro - Android Build Process ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Build the web app
Write-Host "Step 1: Building web application..." -ForegroundColor Yellow
try {
    npm run build
    if (Test-Path dist) {
        Write-Host "Build successful!" -ForegroundColor Green
    } else {
        Write-Host "Build failed - dist folder not found" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "Build failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 2: Sync with Capacitor
Write-Host "Step 2: Syncing with Capacitor Android..." -ForegroundColor Yellow
try {
    npx cap sync android
    Write-Host "Sync successful!" -ForegroundColor Green
} catch {
    Write-Host "Sync failed: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""

# Step 3: Check for Gradle wrapper
Write-Host "Step 3: Checking Android build setup..." -ForegroundColor Yellow
if (Test-Path android\gradlew.bat) {
    Write-Host "Gradle wrapper found!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Building APK with Gradle..." -ForegroundColor Yellow
    Set-Location android
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
} else {
    Write-Host "Gradle wrapper not found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "To build APK files, you have two options:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Option 1: Use Android Studio (Recommended)" -ForegroundColor Yellow
    Write-Host "  1. Open Android Studio" -ForegroundColor White
    Write-Host "  2. File > Open > Select the android folder" -ForegroundColor White
    Write-Host "  3. Wait for Gradle sync to complete" -ForegroundColor White
    Write-Host "  4. Build > Build Bundle(s) / APK(s) > Build APK(s)" -ForegroundColor White
    Write-Host "  5. APK will be in: android\app\build\outputs\apk\release\" -ForegroundColor White
    Write-Host ""
    Write-Host "Option 2: Generate Gradle Wrapper" -ForegroundColor Yellow
    Write-Host "  1. Open Android Studio" -ForegroundColor White
    Write-Host "  2. Open the android folder" -ForegroundColor White
    Write-Host "  3. Gradle will automatically generate wrapper files" -ForegroundColor White
    Write-Host "  4. Then run this script again" -ForegroundColor White
}

Write-Host ""
Write-Host "=== Build Process Complete ===" -ForegroundColor Green
