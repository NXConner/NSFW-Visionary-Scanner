# Complete Setup Script
# Runs all setup steps in order

Write-Host "=== NSFW Visionary Scanner - Complete Setup ===" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check prerequisites
Write-Host "[1/6] Checking prerequisites..." -ForegroundColor Yellow
$nodeVersion = node --version
$npmVersion = npm --version

if (-not $nodeVersion -or -not $npmVersion) {
    Write-Host "✗ Node.js/npm not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

Write-Host "✓ Node.js: $nodeVersion" -ForegroundColor Green
Write-Host "✓ npm: $npmVersion" -ForegroundColor Green

# Step 2: Install dependencies
Write-Host "`n[2/6] Installing dependencies..." -ForegroundColor Yellow
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "✗ Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "✓ Dependencies installed" -ForegroundColor Green

# Step 3: Check environment variables
Write-Host "`n[3/6] Checking environment variables..." -ForegroundColor Yellow
if (-not (Test-Path .env)) {
    Write-Host "⚠ .env file not found. Creating from .env.example..." -ForegroundColor Yellow
    if (Test-Path .env.example) {
        Copy-Item .env.example .env
        Write-Host "✓ Created .env file. Please fill in your values." -ForegroundColor Yellow
    } else {
        Write-Host "✗ .env.example not found. Please create .env manually." -ForegroundColor Red
    }
} else {
    Write-Host "✓ .env file exists" -ForegroundColor Green
}

# Step 4: Run migrations
Write-Host "`n[4/6] Running database migrations..." -ForegroundColor Yellow
Write-Host "⚠ Make sure Supabase is configured before running migrations" -ForegroundColor Yellow
$runMigrations = Read-Host "Run migrations now? (y/n)"
if ($runMigrations -eq 'y') {
    npm run db:migrate
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Migrations completed" -ForegroundColor Green
    } else {
        Write-Host "✗ Migrations failed. Check your Supabase configuration." -ForegroundColor Red
    }
} else {
    Write-Host "⏭ Skipped migrations. Run manually: npm run db:migrate" -ForegroundColor Yellow
}

# Step 5: Setup storage buckets
Write-Host "`n[5/6] Setting up storage buckets..." -ForegroundColor Yellow
Write-Host "⚠ This requires SUPABASE_SERVICE_ROLE_KEY in .env" -ForegroundColor Yellow
$setupStorage = Read-Host "Setup storage buckets now? (y/n)"
if ($setupStorage -eq 'y') {
    tsx scripts/setup-storage-buckets.ts
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Storage buckets setup complete" -ForegroundColor Green
        Write-Host "⚠ Don't forget to run storage policies SQL in Supabase Dashboard" -ForegroundColor Yellow
    } else {
        Write-Host "✗ Storage setup failed. Check your credentials." -ForegroundColor Red
    }
} else {
    Write-Host "⏭ Skipped storage setup. Run manually: tsx scripts/setup-storage-buckets.ts" -ForegroundColor Yellow
}

# Step 6: Seed data
Write-Host "`n[6/6] Seeding initial data..." -ForegroundColor Yellow
$seedData = Read-Host "Seed position library now? (y/n)"
if ($seedData -eq 'y') {
    tsx scripts/seed-positions.ts
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Seed data loaded" -ForegroundColor Green
    } else {
        Write-Host "✗ Seeding failed. Check your database connection." -ForegroundColor Red
    }
} else {
    Write-Host "⏭ Skipped seeding. Run manually: tsx scripts/seed-positions.ts" -ForegroundColor Yellow
}

Write-Host "`n=== Setup Complete ===" -ForegroundColor Green
Write-Host "`nNext steps:" -ForegroundColor Cyan
Write-Host "1. Fill in .env file with your Supabase credentials" -ForegroundColor White
Write-Host "2. Run storage policies SQL in Supabase Dashboard" -ForegroundColor White
Write-Host "3. Deploy Edge Functions: .\scripts\deploy-all.ps1" -ForegroundColor White
Write-Host "4. Start dev server: npm run dev" -ForegroundColor White
Write-Host "`nFor detailed instructions, see: COMPLETE_SETUP_GUIDE.md" -ForegroundColor Yellow

