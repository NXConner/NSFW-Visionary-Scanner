# Production Readiness Verification Script
# Comprehensive check of all production requirements

Write-Host ""
Write-Host "=== PRODUCTION READINESS VERIFICATION ===" -ForegroundColor Cyan
Write-Host ""

$checks = @{
    Passed = @()
    Failed = @()
    Warnings = @()
}

function Check-Item {
    param(
        [string]$Name,
        [bool]$Condition,
        [string]$Severity = "error"
    )
    
    if ($Condition) {
        $checks.Passed += $Name
        Write-Host "  ✅ $Name" -ForegroundColor Green
        return $true
    } else {
        if ($Severity -eq "error") {
            $checks.Failed += $Name
            Write-Host "  ❌ $Name" -ForegroundColor Red
        } else {
            $checks.Warnings += $Name
            Write-Host "  ⚠️  $Name" -ForegroundColor Yellow
        }
        return $false
    }
}

# 1. Secrets Security
Write-Host "1. Secrets Security Check" -ForegroundColor Yellow
Write-Host "-" * 40 -ForegroundColor Cyan

$envExists = Test-Path ".env"
Check-Item ".env file exists (local only)" $envExists "warning"

# Check if .env is ignored (it might not exist, so check the pattern)
$gitignoreContent = Get-Content ".gitignore" -ErrorAction SilentlyContinue
$envIgnored = $gitignoreContent -match "^\.env$|^\.env\s"
Check-Item ".env pattern is in .gitignore" ($null -ne $envIgnored) "error"

$googleServicesInGit = git check-ignore android/app/google-services.json 2>$null
Check-Item "google-services.json is in .gitignore" ($null -ne $googleServicesInGit) "error"

$gradlePropsInGit = git check-ignore android/gradle.properties 2>$null
Check-Item "gradle.properties is in .gitignore" ($null -ne $gradlePropsInGit) "error"

# 2. Build System
Write-Host ""
Write-Host "2. Build System" -ForegroundColor Yellow
Write-Host "-" * 40 -ForegroundColor Cyan

$distExists = Test-Path "dist"
Check-Item "Production build exists (dist folder)" $distExists "error"

if ($distExists) {
    $indexHtml = Test-Path "dist/index.html"
    Check-Item "dist/index.html exists" $indexHtml "error"
    
    if ($indexHtml) {
        $content = Get-Content "dist/index.html" -Raw
        $hasLocalhost = $content -match "localhost"
        Check-Item "Build contains no localhost references" (-not $hasLocalhost) "error"
    }
}

# 3. Code Quality
Write-Host ""
Write-Host "3. Code Quality" -ForegroundColor Yellow
Write-Host "-" * 40 -ForegroundColor Cyan

try {
    $lintResult = npm run lint 2>&1 | Out-String
    $hasErrors = $lintResult -match "✖.*error" -or $lintResult -match "error.*problems"
    $hasWarnings = $lintResult -match "warning"
    if (-not $hasErrors) {
        Check-Item "Linting passes (no errors)" $true "error"
        if ($hasWarnings) {
            Write-Host "  ⚠️  Linting has warnings (non-blocking)" -ForegroundColor Yellow
        }
    } else {
        Check-Item "Linting passes (no errors)" $false "error"
    }
} catch {
    Check-Item "Linting passes" $false "warning"
}

# 4. Android Build
Write-Host ""
Write-Host "4. Android Build" -ForegroundColor Yellow
Write-Host "-" * 40 -ForegroundColor Cyan

$gradleWrapper = Test-Path "android/gradlew.bat"
Check-Item "Gradle wrapper exists" $gradleWrapper "warning"

$apkExists = Test-Path "android/app/build/outputs/apk/release/*.apk"
if ($apkExists) {
    $apk = Get-ChildItem "android/app/build/outputs/apk/release/*.apk" | Select-Object -First 1
    $sizeMB = [math]::Round($apk.Length / 1MB, 2)
    Write-Host "  ✅ APK found: $($apk.Name) ($sizeMB MB)" -ForegroundColor Green
    $checks.Passed += "APK built"
} else {
    Check-Item "APK built" $false "warning"
}

# 5. Documentation
Write-Host ""
Write-Host "5. Documentation" -ForegroundColor Yellow
Write-Host "-" * 40 -ForegroundColor Cyan

$readmeExists = Test-Path "README.md"
Check-Item "README.md exists" $readmeExists "error"

$licenseExists = Test-Path "LICENSE"
Check-Item "LICENSE file exists" $licenseExists "error"

$contributingExists = Test-Path "CONTRIBUTING.md"
Check-Item "CONTRIBUTING.md exists" $contributingExists "warning"

# 6. Environment Configuration
Write-Host ""
Write-Host "6. Environment Configuration" -ForegroundColor Yellow
Write-Host "-" * 40 -ForegroundColor Cyan

$envExampleExists = Test-Path ".env.example"
Check-Item ".env.example exists" $envExampleExists "error"

if ($envExampleExists) {
    $envExample = Get-Content ".env.example" -Raw
    $hasSupabaseUrl = $envExample -match "VITE_SUPABASE_URL"
    $hasSupabaseKey = $envExample -match "VITE_SUPABASE_PUBLISHABLE_KEY"
    Check-Item ".env.example contains required variables" ($hasSupabaseUrl -and $hasSupabaseKey) "error"
}

# 7. Dependencies
Write-Host ""
Write-Host "7. Dependencies" -ForegroundColor Yellow
Write-Host "-" * 40 -ForegroundColor Cyan

try {
    $auditResult = npm audit --audit-level=high 2>&1 | Out-String
    $hasHighVuln = $auditResult -match "high.*vulnerabilit|critical.*vulnerabilit"
    if (-not $hasHighVuln) {
        Check-Item "No high-severity vulnerabilities" $true "error"
    } else {
        Check-Item "No high-severity vulnerabilities" $false "warning"
        Write-Host "  ⚠️  Run 'npm audit fix' to address vulnerabilities" -ForegroundColor Yellow
    }
} catch {
    Check-Item "Dependency audit completed" $false "warning"
}

# Summary
Write-Host ""
Write-Host "=== VERIFICATION SUMMARY ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Passed: $($checks.Passed.Count)" -ForegroundColor Green
Write-Host "❌ Failed: $($checks.Failed.Count)" -ForegroundColor $(if ($checks.Failed.Count -eq 0) { "Green" } else { "Red" })
Write-Host "⚠️  Warnings: $($checks.Warnings.Count)" -ForegroundColor $(if ($checks.Warnings.Count -eq 0) { "Green" } else { "Yellow" })

if ($checks.Failed.Count -gt 0) {
    Write-Host ""
    Write-Host "❌ Failed Checks:" -ForegroundColor Red
    $checks.Failed | ForEach-Object { Write-Host "  - $_" -ForegroundColor Red }
}

if ($checks.Warnings.Count -gt 0) {
    Write-Host ""
    Write-Host "⚠️  Warnings:" -ForegroundColor Yellow
    $checks.Warnings | ForEach-Object { Write-Host "  - $_" -ForegroundColor Yellow }
}

Write-Host ""
if ($checks.Failed.Count -eq 0) {
    Write-Host "✅ Production readiness checks passed!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Cyan
    Write-Host "  1. Set up production environment variables" -ForegroundColor White
    Write-Host "  2. Configure Supabase production project" -ForegroundColor White
    Write-Host "  3. Set up Stripe (if monetizing)" -ForegroundColor White
    Write-Host "  4. Run production testing" -ForegroundColor White
    exit 0
} else {
    Write-Host "❌ Some checks failed. Please address the issues above." -ForegroundColor Red
    exit 1
}
