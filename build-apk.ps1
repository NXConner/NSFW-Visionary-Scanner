# Build Android APK Script
# This script ensures the Gradle wrapper exists and builds the APK

Write-Host ""
Write-Host "=== Building Android APK ===" -ForegroundColor Cyan
Write-Host ""

$env:CAPACITOR_BUILD = "1"

# Step 1: Ensure dist folder exists
if (-not (Test-Path "dist")) {
    Write-Host "Building web app first (NSFW direct)..." -ForegroundColor Yellow
    npm run build:nsfw:direct
    if (-not (Test-Path "dist")) {
        Write-Host "Build failed - dist folder not found" -ForegroundColor Red
        exit 1
    }
}

# Step 2: Sync with Capacitor
Write-Host "Syncing with Capacitor..." -ForegroundColor Yellow
npx cap sync android

# Step 3: Check if Gradle wrapper exists, if not, open Android Studio
if (-not (Test-Path "android\gradlew.bat")) {
    Write-Host ""
    Write-Host "Gradle wrapper not found. Opening Android Studio..." -ForegroundColor Yellow
    Write-Host "Please wait for Gradle sync to complete, then:" -ForegroundColor Cyan
    Write-Host "  1. Build > Build Bundle(s) / APK(s) > Build APK(s)" -ForegroundColor White
    Write-Host "  2. Or run: .\gradlew.bat assembleDebug in the android folder" -ForegroundColor White
    Write-Host ""
    
    # Try to open Android Studio
    $androidStudioPaths = @(
        "${env:ProgramFiles}\Android\Android Studio\bin\studio64.exe",
        "${env:ProgramFiles(x86)}\Android\Android Studio\bin\studio64.exe",
        "${env:LOCALAPPDATA}\Programs\Android\Android Studio\bin\studio64.exe"
    )
    
    $studioFound = $false
    foreach ($path in $androidStudioPaths) {
        if (Test-Path $path) {
            Write-Host "Opening Android Studio..." -ForegroundColor Green
            Start-Process $path -ArgumentList (Resolve-Path "android")
            $studioFound = $true
            break
        }
    }
    
    if (-not $studioFound) {
        Write-Host "Android Studio not found in common locations." -ForegroundColor Yellow
        Write-Host "Please manually open Android Studio and open the 'android' folder." -ForegroundColor Yellow
    }
    
    exit 0
}

# Step 4: Build APK using Gradle wrapper
Write-Host ""
Write-Host "Building APK with Gradle..." -ForegroundColor Yellow
Set-Location android

# Build debug APK
Write-Host "Building debug APK..." -ForegroundColor Cyan
.\gradlew.bat assembleDebug

if (Test-Path "app\build\outputs\apk\debug\app-debug.apk") {
    Write-Host ""
    Write-Host "=== Debug APK Created Successfully ===" -ForegroundColor Green
    $apk = Get-Item "app\build\outputs\apk\debug\app-debug.apk"
    Write-Host "Location: $($apk.FullName)" -ForegroundColor Cyan
    Write-Host "Size: $([math]::Round($apk.Length/1MB, 2)) MB" -ForegroundColor Cyan
    Write-Host ""
}

# Build release APK (if signing is configured)
Write-Host "Building release APK..." -ForegroundColor Cyan
.\gradlew.bat assembleRelease

if (Test-Path "app\build\outputs\apk\release\app-release.apk") {
    Write-Host ""
    Write-Host "=== Release APK Created Successfully ===" -ForegroundColor Green
    $apk = Get-Item "app\build\outputs\apk\release\app-release.apk"
    Write-Host "Location: $($apk.FullName)" -ForegroundColor Cyan
    Write-Host "Size: $([math]::Round($apk.Length/1MB, 2)) MB" -ForegroundColor Cyan
    Write-Host ""
}

Set-Location ..

Write-Host "=== Build Complete ===" -ForegroundColor Green
Write-Host ""
Write-Host "APK files are in:" -ForegroundColor Cyan
Write-Host "  Debug: android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor White
Write-Host "  Release: android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor White

