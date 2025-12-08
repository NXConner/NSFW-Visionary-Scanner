# Build Guide for Three-Version System

This guide explains how to build the three different app versions: SFW, NSFW, and Hybrid.

## Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Install `cross-env` (if not already installed):
```bash
npm install --save-dev cross-env
```

3. Configure environment variables (see `.env.example.versions`)

## Build Commands

### SFW Version (Safe for Work - Store Ready)

**For Google Play / Apple App Store:**
```bash
npm run build:sfw:store
```

**For Direct Download:**
```bash
npm run build:sfw:direct
```

**Generic SFW Build:**
```bash
npm run build:sfw
```

### NSFW Version (Adult Content - Direct Only)

**Direct Download Only:**
```bash
npm run build:nsfw:direct
```

**Generic NSFW Build:**
```bash
npm run build:nsfw
```

### Hybrid Version (SFW Base + DLC Unlock)

**For Store Distribution:**
```bash
npm run build:hybrid:store
```

**For Direct Download:**
```bash
npm run build:hybrid:direct
```

**Generic Hybrid Build:**
```bash
npm run build:hybrid
```

## Environment Variables

Each build requires specific environment variables. See `.env.example.versions` for the complete list.

### Required Variables

**For All Versions:**
- `VITE_APP_VERSION` - Version type (sfw/nsfw/hybrid)
- `VITE_DISTRIBUTION_CHANNEL` - Distribution channel (store/direct)
- `VITE_STRIPE_PUBLISHABLE_KEY` - Stripe publishable key
- `VITE_SUPABASE_URL` - Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` - Supabase anon key

**Version-Specific Stripe Price IDs:**
- SFW Store: `VITE_STRIPE_SFW_*_STORE_*_PRICE_ID`
- SFW Direct: `VITE_STRIPE_SFW_*_DIRECT_*_PRICE_ID`
- NSFW Direct: `VITE_STRIPE_NSFW_*_DIRECT_*_PRICE_ID`
- DLC: `VITE_STRIPE_NSFW_DLC_*_PRICE_ID`

## Build Output

All builds output to the `dist/` directory:
- `dist/` - Production build files
- `dist/index.html` - Entry point
- `dist/assets/` - Compiled assets (JS, CSS, images)

## Build Process

1. **Environment Setup**: Sets `VITE_APP_VERSION` and `VITE_DISTRIBUTION_CHANNEL`
2. **Vite Build**: Compiles React/TypeScript code
3. **Feature Flags**: Code is conditionally compiled based on version
4. **Asset Optimization**: Images, fonts, and other assets are optimized
5. **Bundle Analysis**: Use `npm run build:analyze` to analyze bundle size

## Version Differences

### SFW Version
- No NSFW content
- Positions Gallery hidden
- Visual content system disabled
- Store-compliant
- All core health features available

### NSFW Version
- All SFW features included
- Positions Gallery enabled
- Visual content system enabled
- Full adult content
- Direct download only

### Hybrid Version
- SFW base app (store-compliant)
- DLC unlock system enabled
- NSFW content unlockable via license
- Supports both store and direct distribution

## Testing Builds

### Local Testing
```bash
# Build
npm run build:sfw

# Preview
npm run preview
```

### Production Testing
1. Build the version you want to test
2. Deploy to staging environment
3. Test all features
4. Verify pricing displays correctly
5. Test DLC unlock (for hybrid version)

## Deployment

### Google Play Store
1. Build SFW version: `npm run build:sfw:store`
2. Sync with Capacitor: `npx cap sync android`
3. Build APK/AAB: `cd android && ./gradlew assembleRelease`
4. Upload to Google Play Console

### Apple App Store
1. Build SFW version: `npm run build:sfw:store`
2. Sync with Capacitor: `npx cap sync ios`
3. Open in Xcode: `npx cap open ios`
4. Archive and upload to App Store Connect

### Direct Download
1. Build desired version: `npm run build:nsfw:direct` or `npm run build:sfw:direct`
2. Deploy to web server
3. Provide download links on website

## Troubleshooting

### Build Fails
- Check environment variables are set
- Verify Stripe price IDs are correct
- Ensure all dependencies are installed

### Wrong Version Features
- Verify `VITE_APP_VERSION` is set correctly
- Check feature flags in `src/lib/featureFlags.ts`
- Clear build cache: `rm -rf dist node_modules/.vite`

### Pricing Not Displaying
- Verify Stripe price IDs in environment variables
- Check `src/lib/pricing.ts` for correct filtering
- Ensure distribution channel is set correctly

## CI/CD Integration

### GitHub Actions Example
```yaml
- name: Build SFW Store Version
  run: npm run build:sfw:store
  env:
    VITE_APP_VERSION: sfw
    VITE_DISTRIBUTION_CHANNEL: store
    VITE_STRIPE_PUBLISHABLE_KEY: ${{ secrets.STRIPE_PUBLISHABLE_KEY }}
    # ... other env vars
```

## Next Steps

1. Configure Stripe products and prices
2. Set up environment variables
3. Test each build version
4. Deploy to respective platforms

