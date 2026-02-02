# Production Environment Setup Script
# Interactive script to guide production environment configuration

Write-Host ""
Write-Host "=== PRODUCTION ENVIRONMENT SETUP ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "This script will help you set up production environment variables." -ForegroundColor Yellow
Write-Host ""

# Check if .env exists
if (Test-Path ".env") {
    Write-Host "⚠️  .env file already exists" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to create a backup and continue? (y/n)"
    if ($overwrite -eq "y") {
        $backupName = ".env.backup.$(Get-Date -Format 'yyyyMMdd-HHmmss')"
        Copy-Item ".env" $backupName
        Write-Host "✅ Backup created: $backupName" -ForegroundColor Green
    } else {
        Write-Host "Exiting. No changes made." -ForegroundColor Yellow
        exit 0
    }
}

# Check if .env.example exists
if (-not (Test-Path ".env.example")) {
    Write-Host "❌ .env.example not found. Cannot proceed." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
Copy-Item ".env.example" ".env"
Write-Host "✅ .env file created" -ForegroundColor Green

Write-Host ""
Write-Host "=== REQUIRED VARIABLES ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please fill in the following required variables:" -ForegroundColor Yellow
Write-Host ""

$requiredVars = @(
    @{Name="VITE_SUPABASE_URL"; Description="Supabase project URL (https://xxx.supabase.co)"},
    @{Name="VITE_SUPABASE_PUBLISHABLE_KEY"; Description="Supabase anon/public key"},
    @{Name="VITE_APP_ENV"; Description="Environment (production/staging)"},
    @{Name="VITE_APP_VERSION"; Description="App version (sfw/nsfw/hybrid)"}
)

foreach ($var in $requiredVars) {
    Write-Host "$($var.Name):" -ForegroundColor Cyan
    Write-Host "  $($var.Description)" -ForegroundColor Gray
    $value = Read-Host "  Enter value (or press Enter to skip)"
    
    if ($value) {
        # Update .env file
        $content = Get-Content ".env" -Raw
        $pattern = "($($var.Name)=)(.*)"
        if ($content -match $pattern) {
            $content = $content -replace $pattern, "`$1$value"
            Set-Content ".env" -Value $content -NoNewline
            Write-Host "  ✅ Updated" -ForegroundColor Green
        } else {
            Write-Host "  ⚠️  Variable not found in .env.example" -ForegroundColor Yellow
        }
    }
    Write-Host ""
}

Write-Host ""
Write-Host "=== OPTIONAL VARIABLES ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Stripe Configuration (if monetizing):" -ForegroundColor Yellow
$setupStripe = Read-Host "Do you want to configure Stripe now? (y/n)"

if ($setupStripe -eq "y") {
    $stripeVars = @(
        @{Name="VITE_STRIPE_PUBLISHABLE_KEY"; Description="Stripe publishable key"},
        @{Name="VITE_STRIPE_PRO_PRICE_ID"; Description="Stripe Pro price ID (optional)"}
    )
    
    foreach ($var in $stripeVars) {
        Write-Host "$($var.Name):" -ForegroundColor Cyan
        $value = Read-Host "  Enter value (or press Enter to skip)"
        
        if ($value) {
            $content = Get-Content ".env" -Raw
            $pattern = "($($var.Name)=)(.*)"
            if ($content -match $pattern) {
                $content = $content -replace $pattern, "`$1$value"
                Set-Content ".env" -Value $content -NoNewline
                Write-Host "  ✅ Updated" -ForegroundColor Green
            }
        }
        Write-Host ""
    }
}

Write-Host ""
Write-Host "=== SETUP COMPLETE ===" -ForegroundColor Green
Write-Host ""
Write-Host "✅ .env file configured" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  IMPORTANT SECURITY REMINDERS:" -ForegroundColor Yellow
Write-Host "  1. Never commit .env to git" -ForegroundColor White
Write-Host "  2. Use secrets manager for production" -ForegroundColor White
Write-Host "  3. Rotate keys regularly" -ForegroundColor White
Write-Host "  4. Use different keys for staging/production" -ForegroundColor White
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "  1. Verify .env is in .gitignore" -ForegroundColor White
Write-Host "  2. Set up production secrets manager" -ForegroundColor White
Write-Host "  3. Configure Supabase production project" -ForegroundColor White
Write-Host "  4. Run: npm run verify:production" -ForegroundColor White
