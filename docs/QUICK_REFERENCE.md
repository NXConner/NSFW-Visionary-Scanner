# 🚀 Quick Reference Guide

**Visionary Scanner Suite - Command & Workflow Cheat Sheet**

---

## 📦 Development

### Start Development Server

```powershell
npm run dev
# Opens at http://localhost:8080
```

### Build & Preview

```powershell
# Production build
npm run build

# Preview production build
npm run preview
# Opens at http://localhost:4173
```

### Code Quality

```powershell
# Lint check
npm run lint

# Fix linting errors
npm run lint:fix

# Format check
npm run format

# Format code
npm run format:write
```

---

## 🧪 Testing

### Run Tests

```powershell
# Unit tests
npm test
npm run test:run

# E2E tests
npm run test:e2e

# All tests
npm run test:all

# Test with UI
npm run test:ui

# Test coverage
npm run test:coverage
```

---

## 🗄️ Database

### Supabase Commands

```powershell
# Start local Supabase
npm run db:start

# Stop local Supabase
npm run db:stop

# Reset database
npm run db:reset

# Push migrations
npm run db:push

# Generate TypeScript types
npm run db:types

# Check types match schema
npm run db:types:check
```

### Seeding

```powershell
# Seed database
npm run seed
```

---

## 📱 Mobile Build

### Android

```powershell
# Sync web assets to Android
npm run android:sync

# Build release APK
npm run android:build

# Complete workflow (sync + build + git)
npm run android:sync-build-git
```

**APK Location:**

```
android\app\build\outputs\apk\release\app-release.apk
```

**AAB Location (for Play Store):**

```
android\app\build\outputs\bundle\release\app-release.aab
```

---

## 🔍 Production Readiness

### Verification Commands

```powershell
# Comprehensive production check
npm run verify:production

# Production readiness check
npm run check:production

# Pre-submission checklist
npm run check:pre-submission

# Performance audit
npm run perf:audit

# Accessibility audit
npm run a11y:audit

# Bundle analysis
npm run analyze:bundle

# Run all optimizations
npm run optimize:all

# Complete pre-flight check
npm run preflight:all
```

### Environment Setup

```powershell
# Interactive production environment setup
.\scripts\setup-production-env.ps1
```

---

## 🔒 Security

### Vulnerability Scanning

```powershell
# Scan for vulnerabilities
npm run scan:vuln
```

### Secrets Management

- Never commit `.env` files
- Use Supabase Edge Functions secrets for server-side keys
- Verify `.env` is in `.gitignore`

---

## 📊 Build Variants

### Build Types

```powershell
# Standard production build
npm run build

# SFW version
npm run build:sfw

# NSFW version
npm run build:nsfw

# Hybrid version
npm run build:hybrid

# Store distribution
npm run build:sfw:store
npm run build:hybrid:store

# Direct distribution
npm run build:sfw:direct
npm run build:nsfw:direct
npm run build:hybrid:direct
```

### Bundle Analysis

```powershell
# Analyze bundle size
npm run build:analyze
```

---

## 🛠️ Common Workflows

### Daily Development

```powershell
# 1. Start dev server
npm run dev

# 2. Make changes

# 3. Check code quality
npm run lint
npm run format

# 4. Run tests
npm test

# 5. Commit changes
git add .
git commit -m "Description"
```

### Pre-Commit Checklist

```powershell
# Run before committing
npm run lint          # Check linting
npm run format        # Check formatting
npm test              # Run tests
npm run build         # Verify build works
```

### Production Deployment

```powershell
# 1. Verify production readiness
npm run verify:production

# 2. Build for production
npm run build

# 3. Test production build
npm run preview

# 4. Deploy (platform-specific)
```

### Android Release

```powershell
# 1. Sync assets
npm run android:sync

# 2. Build APK
npm run android:build

# 3. Test APK on device

# 4. Build AAB for Play Store
cd android
.\gradlew.bat bundleRelease
cd ..
```

---

## 📁 Key File Locations

### Configuration

- `.env` - Environment variables (not committed)
- `.env.example` - Environment template
- `vite.config.ts` - Build configuration
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration

### Documentation

- `README.md` - Project overview
- `docs/PRODUCTION_READY_SUMMARY.md` - Production status
- `docs/NEXT_STEPS_ACTION_PLAN.md` - Deployment guide
- `docs/guides/` - Detailed guides
- `docs/reports/` - Status reports

### Build Outputs

- `dist/` - Production build output
- `android/app/build/` - Android build files
- `android/app/build/outputs/apk/release/` - APK files
- `android/app/build/outputs/bundle/release/` - AAB files

---

## 🔗 Important URLs

### Development

- Local Dev Server: `http://localhost:8080`
- Preview Server: `http://localhost:4173`

### External Services

- Supabase Dashboard: `https://app.supabase.com`
- Stripe Dashboard: `https://dashboard.stripe.com`
- Google Play Console: `https://play.google.com/console`
- Apple Developer: `https://developer.apple.com`

---

## ⚡ Performance Commands

### Monitoring

```powershell
# Performance audit
npm run perf:audit

# Bundle analysis
npm run analyze:bundle

# Load testing (requires k6)
npm run perf:load
```

---

## ♿ Accessibility

### Auditing

```powershell
# Accessibility audit
npm run a11y:audit
```

---

## 🐛 Troubleshooting

### Common Issues

**Build Fails:**

```powershell
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

**TypeScript Errors:**

```powershell
# Regenerate types
npm run db:types

# Check types
npm run db:types:check
```

**Android Build Issues:**

```powershell
# Clean Android build
cd android
.\gradlew.bat clean
cd ..

# Re-sync and rebuild
npm run android:sync
npm run android:build
```

**Linting Errors:**

```powershell
# Auto-fix what's possible
npm run lint:fix

# Format code
npm run format:write
```

---

## 📚 Documentation Quick Links

### Setup & Configuration

- `docs/guides/setup/QUICK_START_GUIDE.md` - Quick start
- `docs/guides/setup/SETUP_GUIDE.md` - Detailed setup
- `docs/guides/setup/PRODUCTION_ENV_SETUP.md` - Production setup

### Deployment

- `docs/guides/deployment/DEPLOYMENT_GUIDE.md` - Deployment guide
- `docs/guides/deployment/DEPLOYMENT_CHECKLIST.md` - Pre-deployment checklist
- `docs/NEXT_STEPS_ACTION_PLAN.md` - Action plan

### Testing

- `docs/guides/testing/PRODUCTION_TESTING_GUIDE.md` - Testing guide
- `docs/guides/testing/LOAD_TESTING.md` - Load testing

### Mobile

- `docs/ANDROID_SYNC_BUILD_INSTRUCTIONS.md` - Android workflow
- `docs/guides/build/MOBILE_BUILD_GUIDE.md` - Mobile build guide

### Status & Reports

- `docs/PRODUCTION_READY_SUMMARY.md` - Production status
- `docs/reports/FINAL_OPTIMIZATION_SUMMARY.md` - Optimization details
- `docs/tracking/IMPLEMENTATION_TRACKER.md` - Progress tracker

---

## 🎯 Quick Status Check

### Verify Everything Works

```powershell
# 1. Check code quality
npm run lint && npm run format

# 2. Run tests
npm test

# 3. Build production
npm run build

# 4. Verify production readiness
npm run verify:production
```

**Expected Results:**

- ✅ Linting: 0 errors (14 warnings OK)
- ✅ Tests: All passing
- ✅ Build: Successful
- ✅ Production: 16/16 checks passing

---

## 💡 Pro Tips

1. **Always run `npm run verify:production` before deployment**
2. **Use `npm run preflight:all` for complete pre-deployment check**
3. **Test production build with `npm run preview` before deploying**
4. **Keep `.env` local and never commit it**
5. **Run `npm run android:sync` after web changes before building APK**
6. **Use `npm run db:types` after database schema changes**
7. **Check bundle size with `npm run analyze:bundle` regularly**

---

## 🔄 Git Workflow

### Standard Workflow

```powershell
# 1. Check status
git status

# 2. Stage changes
git add .

# 3. Commit (pre-commit hooks run automatically)
git commit -m "Description"

# 4. Push
git push
```

### Pre-Commit Hooks

Automatically runs:

- ESLint check
- Prettier formatting
- Type checking (via lint-staged)

---

## 📞 Need Help?

### Check Documentation

1. Start with `README.md`
2. Check `docs/PRODUCTION_READY_SUMMARY.md` for status
3. See `docs/NEXT_STEPS_ACTION_PLAN.md` for next steps
4. Review relevant guide in `docs/guides/`

### Common Commands Reference

- **Development:** `npm run dev`
- **Build:** `npm run build`
- **Test:** `npm test`
- **Lint:** `npm run lint`
- **Format:** `npm run format`
- **Verify:** `npm run verify:production`

---

_Last Updated: December 26, 2025_  
_Project: Visionary Scanner Suite_
