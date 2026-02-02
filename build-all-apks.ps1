# Comprehensive Android APK Build Script
# Builds all Android APK variants (Debug, Release) and AAB bundles

param(
    [switch]$SkipClean,
    [switch]$SkipSync,
    [switch]$BuildOnly,
    [switch]$AABOnly,
    [switch]$APKOnly
)

Write-Host ""
Write-Host "=== MorphoScan Pro - Complete Android APK Build ===" -ForegroundColor Cyan
Write-Host ""

$ErrorActionPreference = "Continue"

# Step 1: Check prerequisites
Write-Host "Step 1: Checking prerequisites..." -ForegroundColor Yellow

# Check if Android SDK is configured
if (-not (Test-Path "android\local.properties")) {
    Write-Host "  Configuring Android SDK location..." -ForegroundColor Cyan
    $androidHome = $env:ANDROID_HOME
    if (-not $androidHome) {
        $androidHome = $env:ANDROID_SDK_ROOT
    }
    if (-not $androidHome) {
        $commonPaths = @(
            "${env:LOCALAPPDATA}\Android\Sdk",
            "${env:ProgramFiles}\Android\Sdk",
            "${env:ProgramFiles(x86)}\Android\Sdk"
        )
        foreach ($path in $commonPaths) {
            if (Test-Path $path) {
                $androidHome = $path
                break
            }
        }
    }
    if ($androidHome) {
        "sdk.dir=$($androidHome.Replace('\', '\\'))" | Out-File -FilePath "android\local.properties" -Encoding ASCII
        Write-Host "  Android SDK configured: $androidHome" -ForegroundColor Green
    } else {
        Write-Host "  ERROR: Android SDK not found. Please set ANDROID_HOME or install Android SDK." -ForegroundColor Red
        exit 1
    }
}

# Check disk space
$drive = (Get-Location).Drive.Name
$driveInfo = Get-PSDrive $drive
$freeSpaceGB = [math]::Round($driveInfo.Free / 1GB, 2)
Write-Host "  Available disk space: $freeSpaceGB GB" -ForegroundColor $(if ($freeSpaceGB -lt 5) { "Red" } elseif ($freeSpaceGB -lt 10) { "Yellow" } else { "Green" })

if ($freeSpaceGB -lt 2) {
    Write-Host "  WARNING: Low disk space. Build may fail." -ForegroundColor Yellow
}

# Step 2: Build web app (if needed)
if (-not $BuildOnly) {
    if (-not $SkipSync) {
        if (-not (Test-Path "dist")) {
            Write-Host ""
            Write-Host "Step 2: Building web application (NSFW direct)..." -ForegroundColor Yellow
            try {
                npm run build:nsfw:direct
                if (Test-Path dist) {
                    Write-Host "  Web app built successfully!" -ForegroundColor Green
                } else {
                    Write-Host "  WARNING: dist folder not found after build" -ForegroundColor Yellow
                }
            } catch {
                Write-Host "  WARNING: Web build failed, but continuing with APK build..." -ForegroundColor Yellow
            }
        } else {
            Write-Host "Step 2: Using existing dist folder..." -ForegroundColor Green
        }

        # Step 3: Sync Capacitor
        Write-Host ""
        Write-Host "Step 3: Syncing Capacitor..." -ForegroundColor Yellow
        try {
            npx cap sync android
            Write-Host "  Capacitor sync successful!" -ForegroundColor Green
        } catch {
            Write-Host "  WARNING: Capacitor sync failed, but continuing..." -ForegroundColor Yellow
        }
    }
}

# Step 4: Clean build (optional)
if (-not $SkipClean) {
    Write-Host ""
    Write-Host "Step 4: Cleaning previous builds..." -ForegroundColor Yellow
    Set-Location android
    try {
        .\gradlew.bat clean --no-daemon 2>&1 | Out-Null
        Write-Host "  Clean completed!" -ForegroundColor Green
    } catch {
        Write-Host "  Clean failed, but continuing..." -ForegroundColor Yellow
    }
    Set-Location ..
}

# Step 5: Build APKs
Write-Host ""
Write-Host "Step 5: Building Android APKs..." -ForegroundColor Yellow
Set-Location android

$buildSuccess = $false
$apksBuilt = @()

# Build Debug APK (unless AAB only)
if (-not $AABOnly) {
    Write-Host ""
    Write-Host "  Building Debug APK..." -ForegroundColor Cyan
    try {
        .\gradlew.bat --no-daemon --no-build-cache assembleDebug 2>&1 | Tee-Object -Variable debugOutput | Out-Null
        
        if (Test-Path "app\build\outputs\apk\debug\app-debug.apk") {
            $debugApk = Get-Item "app\build\outputs\apk\debug\app-debug.apk"
            $apksBuilt += @{
                Type = "Debug APK"
                Path = $debugApk.FullName
                Size = [math]::Round($debugApk.Length / 1MB, 2)
            }
            Write-Host "  ✓ Debug APK built successfully!" -ForegroundColor Green
            Write-Host "    Location: $($debugApk.FullName)" -ForegroundColor Gray
            Write-Host "    Size: $([math]::Round($debugApk.Length / 1MB, 2)) MB" -ForegroundColor Gray
            $buildSuccess = $true
        } else {
            Write-Host "  ✗ Debug APK not found after build" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ✗ Debug build failed: $_" -ForegroundColor Red
    }
}

# Build Release APK (unless AAB only)
if (-not $AABOnly) {
    Write-Host ""
    Write-Host "  Building Release APK..." -ForegroundColor Cyan
    try {
        .\gradlew.bat --no-daemon --no-build-cache assembleRelease 2>&1 | Tee-Object -Variable releaseOutput | Out-Null
        
        if (Test-Path "app\build\outputs\apk\release\app-release.apk") {
            $releaseApk = Get-Item "app\build\outputs\apk\release\app-release.apk"
            $apksBuilt += @{
                Type = "Release APK"
                Path = $releaseApk.FullName
                Size = [math]::Round($releaseApk.Length / 1MB, 2)
            }
            Write-Host "  ✓ Release APK built successfully!" -ForegroundColor Green
            Write-Host "    Location: $($releaseApk.FullName)" -ForegroundColor Gray
            Write-Host "    Size: $([math]::Round($releaseApk.Length / 1MB, 2)) MB" -ForegroundColor Gray
            $buildSuccess = $true
        } else {
            Write-Host "  ✗ Release APK not found after build" -ForegroundColor Red
        }
    } catch {
        Write-Host "  ✗ Release build failed: $_" -ForegroundColor Red
    }
}

# Build Android App Bundle (AAB) for Google Play (unless APK only)
if (-not $APKOnly) {
    Write-Host ""
    Write-Host "  Building Release AAB (Android App Bundle)..." -ForegroundColor Cyan
    try {
        .\gradlew.bat --no-daemon --no-build-cache bundleRelease 2>&1 | Tee-Object -Variable bundleOutput | Out-Null
        
        if (Test-Path "app\build\outputs\bundle\release\app-release.aab") {
            $releaseAab = Get-Item "app\build\outputs\bundle\release\app-release.aab"
            $apksBuilt += @{
                Type = "Release AAB"
                Path = $releaseAab.FullName
                Size = [math]::Round($releaseAab.Length / 1MB, 2)
            }
            Write-Host "  ✓ Release AAB built successfully!" -ForegroundColor Green
            Write-Host "    Location: $($releaseAab.FullName)" -ForegroundColor Gray
            Write-Host "    Size: $([math]::Round($releaseAab.Length / 1MB, 2)) MB" -ForegroundColor Gray
            Write-Host "    Note: AAB is required for Google Play Store uploads" -ForegroundColor Gray
            $buildSuccess = $true
        } else {
            Write-Host "  ✗ Release AAB not found after build" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ✗ AAB build failed (may require signing config): $_" -ForegroundColor Yellow
    }
}

Set-Location ..

# Step 6: Summary
Write-Host ""
Write-Host "=== Build Summary ===" -ForegroundColor Cyan
Write-Host ""

if ($apksBuilt.Count -gt 0) {
    Write-Host "Successfully built $($apksBuilt.Count) file(s):" -ForegroundColor Green
    Write-Host ""
    foreach ($build in $apksBuilt) {
        Write-Host "  $($build.Type):" -ForegroundColor Yellow
        Write-Host "    $($build.Path)" -ForegroundColor White
        Write-Host "    Size: $($build.Size) MB" -ForegroundColor Gray
        Write-Host ""
    }
    
    # Show output locations
    Write-Host "Output Locations:" -ForegroundColor Cyan
    if ($apksBuilt | Where-Object { $_.Type -like "*APK*" }) {
        Write-Host "  APKs: android\app\build\outputs\apk\" -ForegroundColor White
    }
    if ($apksBuilt | Where-Object { $_.Type -like "*AAB*" }) {
        Write-Host "  AABs: android\app\build\outputs\bundle\release\" -ForegroundColor White
    }
} else {
    Write-Host "No builds were completed successfully." -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "  1. Check disk space (need at least 5GB free)" -ForegroundColor White
    Write-Host "  2. Ensure Android SDK is properly installed" -ForegroundColor White
    Write-Host "  3. Check Java/JDK installation" -ForegroundColor White
    Write-Host "  4. Try cleaning Gradle cache: .\gradlew.bat clean --no-daemon" -ForegroundColor White
    Write-Host "  5. Check build logs in android\app\build\outputs\logs\" -ForegroundColor White
    Write-Host "  6. For AAB builds, ensure release signing is configured" -ForegroundColor White
}

Write-Host ""
Write-Host "=== Build Complete ===" -ForegroundColor Cyan
Write-Host ""

if ($buildSuccess) {
    exit 0
} else {
    exit 1
}
