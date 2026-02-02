# 🚀 MorphoScan Pro - Setup Guide

Complete setup guide for developers to get the MorphoScan Pro project up and running locally.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Environment Configuration](#environment-configuration)
5. [Database Setup](#database-setup)
6. [Running the Application](#running-the-application)
7. [Build & Deployment](#build--deployment)
8. [Troubleshooting](#troubleshooting)
9. [Development Workflow](#development-workflow)
10. [Common Issues & Solutions](#common-issues--solutions)

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

- **Node.js**: v20.x or v22.x (tested with v22.14.0)
- **npm**: v10.x or higher (tested with v10.9.2)
- **Git**: Latest version

### Optional Software

- **Docker**: For local Supabase instance (optional)
- **Supabase CLI**: For database management (optional)
- **Stripe CLI**: For testing webhooks locally (optional)

### Verify Installation

```bash
node --version    # Should show v20.x or v22.x
npm --version     # Should show v10.x or higher
git --version     # Should show latest version
```

---

## 🚀 Quick Start

Get up and running in 5 minutes:

```bash
# 1. Clone the repository (if not already cloned)
git clone <repository-url>
cd visionary_scanner_suite

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your configuration

# 4. Start development server
npm run dev

# 5. Open in browser
# Visit http://localhost:8080
```

---

## 🔧 Detailed Setup

### Step 1: Clone Repository

```bash
git clone <repository-url>
cd visionary_scanner_suite
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install:

- **1,130+ packages** including React 18, TypeScript 5, Vite 7
- Frontend frameworks: Tailwind CSS, Radix UI, Framer Motion
- Backend integration: Supabase, Stripe
- Development tools: ESLint, Prettier, Playwright, Vitest

**Expected output:**

```
added 1130 packages, and audited 1131 packages in 3m
found 0 vulnerabilities ✓
```

### Step 3: Environment Configuration

#### Using .env.local (Recommended for Development)

```bash
# Copy the local development template
cp .env.local .env.local.backup
# Or copy from example
cp .env.example .env.local
```

#### Edit .env.local

Open `.env.local` and configure:

```env
# Supabase Configuration (provided or use your own)
VITE_SUPABASE_URL=https://thajylrvfzjmerqqkmjv.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<your-key-here>
VITE_SUPABASE_PROJECT_ID=thajylrvfzjmerqqkmjv

# App Configuration
VITE_APP_ENV=development
VITE_APP_VERSION=sfw
VITE_DISTRIBUTION_CHANNEL=direct

# Contact Information
VITE_SUPPORT_CONTACT_EMAIL=support@yourapp.com
VITE_PRIVACY_CONTACT_EMAIL=privacy@yourapp.com
ADMIN_SUPER_EMAIL=admin@yourapp.com

# Security
VITE_CLIENT_ENCRYPTION_SALT=your-unique-salt-here
```

**Important Notes:**

- ✅ `.env.local` takes precedence over `.env`
- ✅ Never commit `.env.local` to version control
- ✅ Use different salts for dev/staging/production
- ✅ Stripe keys are optional for basic development

---

## 🗄️ Database Setup

### Option 1: Use Existing Supabase Instance (Recommended)

The project is configured to use a Lovable Cloud Supabase instance. No additional setup needed!

### Option 2: Local Supabase with Docker

If you want a fully local development environment:

#### Prerequisites

- Docker Desktop installed and running

#### Setup Steps

```bash
# 1. Install Supabase CLI (if not already installed)
npm install -g supabase

# 2. Start local Supabase instance
npm run db:start

# This will:
# - Start PostgreSQL database
# - Start Supabase Studio (UI)
# - Start Auth, Storage, and Edge Functions
# - Apply all 116 migrations automatically
```

#### Local Supabase URLs

Once started, update your `.env.local`:

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<get-from-cli-output>
```

#### Database Management Commands

```bash
# Start local database
npm run db:start

# Stop local database
npm run db:stop

# Reset database (WARNING: Deletes all data)
npm run db:reset

# Push schema changes
npm run db:push

# Generate TypeScript types
npm run db:types
```

### Database Migrations

The project includes **116 comprehensive migrations** covering:

- ✅ User authentication & profiles
- ✅ Subscription management (Stripe integration)
- ✅ DLC (Downloadable Content) system
- ✅ Health tracking & analytics
- ✅ Sexual wellness features
- ✅ Community & social features
- ✅ Achievement & referral systems
- ✅ Privacy settings & data retention
- ✅ Admin management tools
- ✅ Push notifications & device tokens

**Migration Files Location:** `supabase/migrations/`

**First Migration:** `20241209000001_dlc_system.sql`  
**Latest Migration:** `20260130160000_partner_sync_enhancements.sql`

---

## 🏃 Running the Application

### Development Mode

```bash
npm run dev
```

**Server Information:**

- Local: http://localhost:8080
- Network: http://[your-ip]:8080

**Features enabled in dev mode:**

- ✅ Hot Module Replacement (HMR)
- ✅ Fast refresh for React components
- ✅ Source maps for debugging
- ✅ TypeScript type checking
- ✅ ESLint warnings

### Production Preview

```bash
# Build for production
npm run build

# Preview production build
npm run preview
```

### Specialized Build Commands

```bash
# Build different app versions
npm run build:sfw           # Safe-for-work version
npm run build:nsfw          # Adult content version
npm run build:hybrid        # Both modes available

# Build for different distribution channels
npm run build:sfw:store     # SFW for App Store
npm run build:sfw:direct    # SFW for direct download
npm run build:nsfw:direct   # NSFW for direct download

# Analyze bundle size
npm run build:analyze
```

---

## 📦 Build & Deployment

### Build for Production

```bash
npm run build
```

**Build Output:**

- Output directory: `dist/`
- Build time: ~40-45 seconds
- Bundle size: ~6 MB (compressed)
- PWA support: Enabled with service worker

**Build includes:**

- ✅ Optimized and minified assets
- ✅ Code splitting and lazy loading
- ✅ Service worker for offline support
- ✅ Progressive Web App (PWA) manifest
- ✅ Static asset optimization

### Build Warnings

You may see warnings about large chunks:

```
(!) Some chunks are larger than 1500 kB after minification
```

**This is expected** for:

- 3D model viewer (916 KB)
- jsPDF library (385 KB)
- Chart libraries (392 KB)

These will be optimized in Phase 3 (Performance Optimization).

---

## 🧪 Testing

### Unit & Integration Tests

```bash
# Run tests
npm test

# Run tests in UI mode
npm test:ui

# Run tests once (CI mode)
npm run test:run

# Generate coverage report
npm run test:coverage
```

### End-to-End Tests

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests in UI mode
npm run test:e2e:ui

# Debug E2E tests
npm run test:e2e:debug
```

### Run All Tests

```bash
npm run test:all
```

---

## 🔍 Code Quality

### Linting

```bash
# Check for linting errors
npm run lint

# Fix linting errors automatically
npm run lint:fix
```

### Formatting

```bash
# Check code formatting
npm run format

# Format code automatically
npm run format:write
```

### Pre-commit Hooks

The project uses Husky for pre-commit hooks:

- ✅ Automatic linting on staged files
- ✅ Automatic formatting on commit
- ✅ TypeScript type checking

---

## 🛠️ Troubleshooting

### Common Issues & Solutions

#### Issue: Dependencies won't install

**Symptoms:**

```
npm ERR! code ERESOLVE
npm ERR! ERESOLVE unable to resolve dependency tree
```

**Solutions:**

```bash
# Clear npm cache
npm cache clean --force

# Delete node_modules and package-lock.json
rm -rf node_modules package-lock.json

# Reinstall
npm install

# If still failing, try legacy peer deps
npm install --legacy-peer-deps
```

#### Issue: Build fails with TypeScript errors

**Symptoms:**

```
error TS2307: Cannot find module
```

**Solutions:**

```bash
# Regenerate TypeScript types from Supabase
npm run db:types

# Check TypeScript configuration
npx tsc --noEmit

# Clear Vite cache
rm -rf node_modules/.vite
npm run build
```

#### Issue: Supabase connection errors

**Symptoms:**

```
Error: Invalid Supabase URL
AuthApiError: Invalid authentication credentials
```

**Solutions:**

1. Verify `.env.local` has correct values
2. Check Supabase project status at https://app.supabase.com
3. Ensure API keys are not expired
4. Verify network connectivity

```bash
# Test Supabase connection
curl https://thajylrvfzjmerqqkmjv.supabase.co/rest/v1/
```

#### Issue: Port already in use

**Symptoms:**

```
Error: Port 8080 is already in use
```

**Solutions:**

```bash
# Find process using port 8080
lsof -i :8080

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=3000 npm run dev
```

#### Issue: Out of memory during build

**Symptoms:**

```
JavaScript heap out of memory
```

**Solutions:**

```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# Or add to package.json scripts:
"build": "NODE_OPTIONS='--max-old-space-size=4096' vite build"
```

#### Issue: Hot Module Replacement (HMR) not working

**Symptoms:**

- Changes not reflecting in browser
- Page requires manual refresh

**Solutions:**

```bash
# Clear Vite cache
rm -rf node_modules/.vite

# Restart dev server
npm run dev

# Check file watcher limits (Linux)
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf
sudo sysctl -p
```

---

## 💻 Development Workflow

### Recommended Development Flow

1. **Start Development Server**

   ```bash
   npm run dev
   ```

2. **Make Changes**
   - Edit files in `src/`
   - Changes auto-reload via HMR

3. **Test Your Changes**

   ```bash
   npm test
   npm run lint
   ```

4. **Build Before Committing**

   ```bash
   npm run build
   ```

5. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: your changes"
   # Pre-commit hooks run automatically
   ```

### Project Structure

```
visionary_scanner_suite/
├── src/
│   ├── components/       # React components
│   ├── hooks/           # Custom React hooks
│   ├── lib/             # Utilities & helpers
│   ├── pages/           # Page components
│   ├── integrations/    # Supabase & external services
│   └── config/          # App configuration
├── public/              # Static assets
├── supabase/
│   ├── migrations/      # Database migrations
│   └── functions/       # Edge functions
├── docs/                # Documentation
├── scripts/             # Build & deployment scripts
└── e2e/                 # End-to-end tests
```

---

## 🚨 Important Notes

### Security

- ⚠️ **Never commit `.env` or `.env.local` files**
- ⚠️ Use different encryption salts per environment
- ⚠️ Keep Stripe secret keys server-side only
- ⚠️ Rotate API keys regularly

### Performance

- Large chunks (>1500 KB) are expected for:
  - 3D model viewer
  - PDF generation
  - Chart libraries
- Code splitting optimization planned in Phase 3

### Database

- 116 migrations must be run in order
- Migrations are automatically applied when using Supabase CLI
- For production, ensure migrations are run before deployment

---

## 📚 Additional Resources

### Documentation

- [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md) - User-facing quick start
- [DEPLOYMENT_CHECKLIST.md](../deployment/DEPLOYMENT_CHECKLIST.md) - Pre-deployment checklist
- [PRODUCTION_TESTING_GUIDE.md](../testing/PRODUCTION_TESTING_GUIDE.md) - Production testing
- [README.md](../../../README.md) - Project overview

### Package Scripts Reference

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Testing
npm test                 # Run unit tests
npm run test:e2e         # Run E2E tests
npm run test:all         # Run all tests

# Code Quality
npm run lint             # Check linting
npm run lint:fix         # Fix linting errors
npm run format           # Check formatting
npm run format:write     # Format code

# Database
npm run db:start         # Start local Supabase
npm run db:stop          # Stop local Supabase
npm run db:reset         # Reset database
npm run db:types         # Generate TS types

# Specialized Builds
npm run build:sfw        # Build SFW version
npm run build:nsfw       # Build NSFW version
npm run build:analyze    # Analyze bundle
```

---

## ✅ Setup Checklist

Use this checklist to ensure everything is configured correctly:

- [ ] Node.js v20+ or v22+ installed
- [ ] npm v10+ installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] `.env.local` created and configured
- [ ] Supabase connection verified
- [ ] Development server starts (`npm run dev`)
- [ ] Production build works (`npm run build`)
- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Database migrations understood
- [ ] Git hooks working (Husky)

---

## 🎉 Ready to Develop!

You're all set! Start the development server:

```bash
npm run dev
```

Visit http://localhost:8080 and start building! 🚀

---

## 📞 Support

- **Issues**: Open a GitHub issue
- **Email**: support@morphoscan.dev
- **Documentation**: See `/docs` folder

---

**Last Updated**: December 26, 2024  
**Version**: 0.9.0-beta.1  
**Phase**: 1/6 - Setup & Environment Configuration
