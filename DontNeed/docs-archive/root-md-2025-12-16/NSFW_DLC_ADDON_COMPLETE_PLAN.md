# NSFW DLC Add-On Modular Content - Complete Implementation Plan

## Executive Summary

This plan details the architecture for transforming a **Safe For Work (SFW) app** distributed via Google Play Store and Apple App Store into a **complete NSFW version** through modular DLC add-ons purchased and downloaded from the app's official website.

### Distribution Model

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DISTRIBUTION CHANNELS                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────┐   ┌──────────────────┐   ┌───────────────────────────┐│
│  │   Google Play    │   │   Apple App      │   │    Official Website       ││
│  │   Store          │   │   Store          │   │    (TBD Domain)           ││
│  │                  │   │                  │   │                           ││
│  │  • SFW Only      │   │  • SFW Only      │   │  • SFW Version (Discount) ││
│  │  • Full Price    │   │  • Full Price    │   │  • NSFW DLC Add-ons       ││
│  │  • Auto Updates  │   │  • Auto Updates  │   │  • Complete Bundle        ││
│  │  • Store TOS     │   │  • Store TOS     │   │  • Manual Updates         ││
│  │    Compliant     │   │    Compliant     │   │  • Adult Content OK       ││
│  └────────┬─────────┘   └────────┬─────────┘   └─────────────┬─────────────┘│
│           │                      │                           │              │
│           ▼                      ▼                           ▼              │
│  ┌────────────────────────────────────────┐   ┌─────────────────────────────┐
│  │        SFW APP EXPERIENCE              │   │   NSFW FULL EXPERIENCE      │
│  │  • Health Scanner                      │   │   • Everything in SFW       │
│  │  • Health Diary                        │   │   • Positions Gallery       │
│  │  • Medical Education                   │   │   • Adult Video Content     │
│  │  • AI Health Chat                      │   │   • Intimate Features       │
│  │  • Community (SFW)                     │   │   • Adult AI Chat           │
│  │  • In-App DLC Store                    │   │   • Adult Community         │
│  │    (Links to Website)                  │   │   • Partner Features        │
│  └────────────────────────────────────────┘   └─────────────────────────────┘
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## DLC Add-On Catalog

### Individual DLC Packages

| DLC ID            | Package Name                    | Safe Description                                                                                | Features Included                                                               | Price    |
| ----------------- | ------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- | -------- |
| `dlc-positions`   | **Intimate Positions Guide**    | "Comprehensive guide to partner connection techniques with visual instructions and expert tips" | Positions Gallery (100+), Position Detail Views, Favorites, Playlists           | $9.99    |
| `dlc-videos`      | **Advanced Wellness Videos**    | "Premium video library featuring expert demonstrations and educational content for adults"      | NSFW Video Library, Streaming, Downloads, Playlists                             | $14.99   |
| `dlc-community`   | **Private Community Access**    | "Join our exclusive members-only community for adult discussions and peer support"              | NSFW Forum, Private Groups, Expert Q&A                                          | $4.99/mo |
| `dlc-analytics`   | **Intimate Wellness Analytics** | "Advanced tracking and insights for your personal wellness journey"                             | Sexual Wellness Analytics, Partner Sync, Detailed Reports                       | $7.99    |
| `dlc-advanced`    | **Premium Adult Features**      | "Unlock the complete suite of premium features for enhanced experiences"                        | Multi-camera Recording, Intimate Date Planning, AI Companion Chat, Partner Sync | $19.99   |
| `dlc-marketplace` | **Creator Marketplace Access**  | "Access premium content from verified wellness experts and creators"                            | Premium Content Store, Expert Content, Exclusive Videos                         | $9.99/mo |

### Bundle Packages

| Bundle ID             | Package Name                | Safe Description                                                 | Includes                       | Price     | Savings    |
| --------------------- | --------------------------- | ---------------------------------------------------------------- | ------------------------------ | --------- | ---------- |
| `bundle-starter`      | **Wellness Starter Pack**   | "Essential premium features to enhance your wellness journey"    | Positions + Analytics          | $14.99    | 15%        |
| `bundle-premium`      | **Premium Experience Pack** | "Complete premium upgrade with all visual content and analytics" | Positions + Videos + Analytics | $27.99    | 20%        |
| `bundle-complete`     | **Ultimate Complete Pack**  | "The complete experience with all features unlocked forever"     | ALL DLC (One-time)             | $49.99    | 40%        |
| `bundle-subscription` | **All-Access Subscription** | "Full access to everything including future updates"             | ALL DLC + Updates              | $14.99/mo | Best Value |

### Complete Package (Website Only)

| Package ID          | Package Name                | Description                                                          | Price                   |
| ------------------- | --------------------------- | -------------------------------------------------------------------- | ----------------------- |
| `app-complete-nsfw` | **Complete Adult Edition**  | Full app with all NSFW features pre-installed, website download only | $39.99                  |
| `app-sfw-discount`  | **Wellness Suite (Direct)** | SFW version at discounted price, direct download                     | $4.99 (vs $9.99 stores) |

---

## Technical Architecture

### App Version States

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           APP VERSION STATES                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  STATE 1: SFW (Store Version)                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Source: Google Play / Apple App Store                               │   │
│  │  Updates: Automatic via Store                                        │   │
│  │  Content: SFW Only                                                   │   │
│  │  DLC Store: Shows links to website for DLC purchase                  │   │
│  │  Compliance: Full store TOS compliant                                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                               │
│                              │ User purchases DLC from website              │
│                              │ User installs DLC add-on                     │
│                              ▼                                               │
│  STATE 2: SFW + DLC (Hybrid Version)                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Source: Store (base) + Website (DLC)                                │   │
│  │  Updates: WEBSITE ONLY (no longer store compliant)                   │   │
│  │  Content: SFW + Purchased DLC features                               │   │
│  │  DLC Store: Shows owned DLC + available DLC                          │   │
│  │  Compliance: NOT store compliant (user acknowledged)                 │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                              │                                               │
│                              │ User purchases more DLC                      │
│                              ▼                                               │
│  STATE 3: NSFW (Complete Version)                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │  Source: Website only                                                │   │
│  │  Updates: Website only                                               │   │
│  │  Content: All features unlocked                                      │   │
│  │  DLC Store: Shows all owned content                                  │   │
│  │  Compliance: Website distribution only                               │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Update Flow Logic

```typescript
// Update source determination
const getUpdateSource = async (): Promise<"store" | "website"> => {
  const installedDLCs = await getInstalledDLCs();

  // If ANY NSFW DLC is installed, updates must come from website
  if (installedDLCs.length > 0) {
    return "website";
  }

  // If app was installed from website directly
  if (await isWebsiteInstall()) {
    return "website";
  }

  // Store version with no DLC - can use store updates
  return "store";
};
```

---

## Directory Structure

### New Files and Directories to Create

```
src/
├── dlc/                                    # DLC Management System
│   ├── DLCManager.ts                       # Core DLC management
│   ├── DLCInstaller.ts                     # Installation logic
│   ├── DLCDownloader.ts                    # Download manager
│   ├── DLCLicenseValidator.ts              # License validation
│   ├── DLCUpdateChecker.ts                 # Update checking
│   ├── types.ts                            # DLC type definitions
│   └── index.ts                            # Exports
│
├── dlc-modules/                            # Individual DLC Modules
│   ├── positions/                          # DLC: Positions Gallery
│   │   ├── components/
│   │   │   ├── PositionsGallery.tsx
│   │   │   ├── PositionDetailView.tsx
│   │   │   ├── PositionCard.tsx
│   │   │   ├── PositionFilters.tsx
│   │   │   └── index.ts
│   │   ├── data/
│   │   │   ├── positionsData.ts
│   │   │   └── categories.ts
│   │   ├── hooks/
│   │   │   └── usePositions.ts
│   │   ├── manifest.json
│   │   └── index.ts
│   │
│   ├── videos/                             # DLC: Video Content
│   │   ├── components/
│   │   │   ├── NSFWVideoLibrary.tsx
│   │   │   ├── VideoPlayer.tsx
│   │   │   ├── VideoCard.tsx
│   │   │   └── index.ts
│   │   ├── lib/
│   │   │   └── videoStreaming.ts
│   │   ├── manifest.json
│   │   └── index.ts
│   │
│   ├── community/                          # DLC: NSFW Community
│   │   ├── components/
│   │   │   ├── NSFWCommunityForum.tsx
│   │   │   ├── PrivateGroups.tsx
│   │   │   ├── ExpertQA.tsx
│   │   │   └── index.ts
│   │   ├── lib/
│   │   │   └── nsfwCommunity.ts
│   │   ├── manifest.json
│   │   └── index.ts
│   │
│   ├── analytics/                          # DLC: Wellness Analytics
│   │   ├── components/
│   │   │   ├── SexualWellnessAnalytics.tsx
│   │   │   ├── PartnerSync.tsx
│   │   │   ├── IntimateReports.tsx
│   │   │   └── index.ts
│   │   ├── lib/
│   │   │   └── wellnessAnalytics.ts
│   │   ├── manifest.json
│   │   └── index.ts
│   │
│   ├── advanced/                           # DLC: Advanced Features
│   │   ├── components/
│   │   │   ├── NSFWAdvancedFeatures.tsx
│   │   │   ├── MultiCameraRecording.tsx
│   │   │   ├── IntimateDatePlanning.tsx
│   │   │   ├── AICompanionChat.tsx
│   │   │   └── index.ts
│   │   ├── lib/
│   │   │   └── advancedFeatures.ts
│   │   ├── manifest.json
│   │   └── index.ts
│   │
│   └── marketplace/                        # DLC: Marketplace Access
│       ├── components/
│       │   ├── PremiumMarketplace.tsx
│       │   ├── CreatorContent.tsx
│       │   └── index.ts
│       ├── lib/
│       │   └── marketplace.ts
│       ├── manifest.json
│       └── index.ts
│
├── components/
│   ├── dlc-store/                          # In-App DLC Store (SFW Safe)
│   │   ├── DLCStorefront.tsx               # Main storefront
│   │   ├── DLCPackageCard.tsx              # Individual package card
│   │   ├── DLCBundleCard.tsx               # Bundle card
│   │   ├── DLCPurchaseModal.tsx            # Purchase flow modal
│   │   ├── DLCInstallProgress.tsx          # Installation progress
│   │   ├── DLCLibrary.tsx                  # User's purchased DLC
│   │   ├── AgeVerificationModal.tsx        # Age gate
│   │   ├── UpdateSourceWarning.tsx         # Warning about update source change
│   │   └── index.ts
│   │
│   ├── placeholders/                       # Placeholder components for locked features
│   │   ├── PositionsPlaceholder.tsx        # UPDATE
│   │   ├── VideosPlaceholder.tsx           # NEW
│   │   ├── CommunityPlaceholder.tsx        # NEW
│   │   ├── AnalyticsPlaceholder.tsx        # NEW
│   │   ├── AdvancedPlaceholder.tsx         # NEW
│   │   ├── MarketplacePlaceholder.tsx      # NEW
│   │   └── index.ts
│   │
│   └── update-manager/                     # Update management UI
│       ├── UpdateChecker.tsx               # Check for updates
│       ├── UpdateDownloader.tsx            # Download updates
│       ├── UpdateSourceBanner.tsx          # Shows update source
│       └── index.ts
│
├── hooks/
│   ├── useDLCStore.ts                      # DLC store state
│   ├── useDLCInstallation.ts               # Installation state
│   ├── useDLCLicense.ts                    # License management
│   ├── useUpdateSource.ts                  # Update source tracking
│   └── useAgeVerification.ts               # Age verification state
│
├── lib/
│   ├── dlcRegistry.ts                      # DLC package registry
│   ├── updateManager.ts                    # Update management
│   ├── ageVerification.ts                  # Age verification logic
│   └── websiteApi.ts                       # Official website API client
│
└── contexts/
    ├── DLCContext.tsx                      # DLC state context
    └── UpdateContext.tsx                   # Update state context
```

---

## File Changes Detail

### Files to CREATE (New)

#### 1. DLC Management Core

```
src/dlc/DLCManager.ts
src/dlc/DLCInstaller.ts
src/dlc/DLCDownloader.ts
src/dlc/DLCLicenseValidator.ts
src/dlc/DLCUpdateChecker.ts
src/dlc/types.ts
src/dlc/index.ts
```

#### 2. DLC Module Packages (6 Modules)

```
src/dlc-modules/positions/manifest.json
src/dlc-modules/positions/index.ts
src/dlc-modules/positions/components/*.tsx
src/dlc-modules/positions/data/*.ts
src/dlc-modules/positions/hooks/*.ts

src/dlc-modules/videos/manifest.json
src/dlc-modules/videos/index.ts
src/dlc-modules/videos/components/*.tsx
src/dlc-modules/videos/lib/*.ts

src/dlc-modules/community/manifest.json
src/dlc-modules/community/index.ts
src/dlc-modules/community/components/*.tsx
src/dlc-modules/community/lib/*.ts

src/dlc-modules/analytics/manifest.json
src/dlc-modules/analytics/index.ts
src/dlc-modules/analytics/components/*.tsx
src/dlc-modules/analytics/lib/*.ts

src/dlc-modules/advanced/manifest.json
src/dlc-modules/advanced/index.ts
src/dlc-modules/advanced/components/*.tsx
src/dlc-modules/advanced/lib/*.ts

src/dlc-modules/marketplace/manifest.json
src/dlc-modules/marketplace/index.ts
src/dlc-modules/marketplace/components/*.tsx
src/dlc-modules/marketplace/lib/*.ts
```

#### 3. DLC Store UI Components

```
src/components/dlc-store/DLCStorefront.tsx
src/components/dlc-store/DLCPackageCard.tsx
src/components/dlc-store/DLCBundleCard.tsx
src/components/dlc-store/DLCPurchaseModal.tsx
src/components/dlc-store/DLCInstallProgress.tsx
src/components/dlc-store/DLCLibrary.tsx
src/components/dlc-store/AgeVerificationModal.tsx
src/components/dlc-store/UpdateSourceWarning.tsx
src/components/dlc-store/index.ts
```

#### 4. Placeholder Components

```
src/components/placeholders/VideosPlaceholder.tsx
src/components/placeholders/CommunityPlaceholder.tsx
src/components/placeholders/AnalyticsPlaceholder.tsx
src/components/placeholders/AdvancedPlaceholder.tsx
src/components/placeholders/MarketplacePlaceholder.tsx
```

#### 5. Update Manager Components

```
src/components/update-manager/UpdateChecker.tsx
src/components/update-manager/UpdateDownloader.tsx
src/components/update-manager/UpdateSourceBanner.tsx
src/components/update-manager/index.ts
```

#### 6. Hooks

```
src/hooks/useDLCStore.ts
src/hooks/useDLCInstallation.ts
src/hooks/useDLCLicense.ts
src/hooks/useUpdateSource.ts
src/hooks/useAgeVerification.ts
```

#### 7. Libraries

```
src/lib/dlcRegistry.ts
src/lib/updateManager.ts
src/lib/ageVerification.ts
src/lib/websiteApi.ts
```

#### 8. Contexts

```
src/contexts/DLCContext.tsx
src/contexts/UpdateContext.tsx
```

#### 9. Database Migrations

```
supabase/migrations/20241209_001_dlc_packages.sql
supabase/migrations/20241209_002_dlc_licenses.sql
supabase/migrations/20241209_003_dlc_downloads.sql
supabase/migrations/20241209_004_dlc_updates.sql
supabase/migrations/20241209_005_age_verification.sql
```

#### 10. Build Scripts

```
scripts/build-dlc-module.js
scripts/package-dlc.js
scripts/deploy-dlc.js
scripts/build-complete-bundle.js
vite.dlc.config.ts
```

#### 11. Configuration Files

```
dlc.config.json                             # DLC configuration
dlc-manifest.json                           # Master DLC manifest
```

---

### Files to MODIFY (Existing)

#### 1. Core App Files

| File                               | Changes Required                                                              |
| ---------------------------------- | ----------------------------------------------------------------------------- |
| `src/pages/Index.tsx`              | Remove direct NSFW imports, add DLC conditional loading, add DLC store tab    |
| `src/components/Header.tsx`        | Add DLC Store navigation, conditionally show NSFW tabs based on installed DLC |
| `src/components/SettingsPanel.tsx` | Add DLC management section, add update source settings                        |
| `src/App.tsx` or `src/main.tsx`    | Wrap with DLCContext and UpdateContext providers                              |

#### 2. Feature Flags

| File                      | Changes Required                                           |
| ------------------------- | ---------------------------------------------------------- |
| `src/lib/featureFlags.ts` | Add DLC-aware feature checks, add per-module feature flags |

#### 3. Existing DLC Infrastructure (Upgrade from Stubs)

| File                           | Changes Required                                               |
| ------------------------------ | -------------------------------------------------------------- |
| `src/lib/dlcManager.ts`        | Full implementation with license validation, download, install |
| `src/lib/enhancedDLCSystem.ts` | Full implementation with package/bundle management             |
| `src/lib/dlcContentLoader.ts`  | Full implementation with dynamic module loading                |
| `src/hooks/useDLCContent.ts`   | Expand with installation, download progress, license status    |

#### 4. Existing Components to Update

| File                                   | Changes Required                          |
| -------------------------------------- | ----------------------------------------- |
| `src/components/DLCBadge.tsx`          | Update to show specific DLC status        |
| `src/components/DLCStatus.tsx`         | Show installed DLCs and available updates |
| `src/components/DLCUnlock.tsx`         | Update unlock flow with website redirect  |
| `src/components/EnhancedDLCSystem.tsx` | Integrate with new DLC infrastructure     |

#### 5. Existing Placeholders to Update

| File                                                   | Changes Required           |
| ------------------------------------------------------ | -------------------------- |
| `src/components/placeholders/PositionsPlaceholder.tsx` | Add DLC purchase CTA       |
| Other placeholders                                     | Add DLC-specific messaging |

#### 6. Build Configuration

| File             | Changes Required                        |
| ---------------- | --------------------------------------- |
| `package.json`   | Add DLC build scripts                   |
| `vite.config.ts` | Add DLC module exclusion for SFW builds |
| `tsconfig.json`  | Add DLC module paths                    |

---

### Files to MOVE (Relocate to DLC Modules)

| Current Location                                 | New Location                              | DLC Module  |
| ------------------------------------------------ | ----------------------------------------- | ----------- |
| `src/components/PositionsGallery.tsx`            | `src/dlc-modules/positions/components/`   | positions   |
| `src/components/PositionDetailView.tsx`          | `src/dlc-modules/positions/components/`   | positions   |
| `src/data/positionsData.ts`                      | `src/dlc-modules/positions/data/`         | positions   |
| `src/hooks/usePositionImages.ts`                 | `src/dlc-modules/positions/hooks/`        | positions   |
| `src/lib/enhancedPositionsGallery.ts`            | `src/dlc-modules/positions/lib/`          | positions   |
| `src/components/NSFWVideoContent.tsx`            | `src/dlc-modules/videos/components/`      | videos      |
| `src/lib/nsfwVideoContent.ts`                    | `src/dlc-modules/videos/lib/`             | videos      |
| `src/components/NSFWCommunityForum.tsx`          | `src/dlc-modules/community/components/`   | community   |
| `src/lib/nsfwCommunityForum.ts`                  | `src/dlc-modules/community/lib/`          | community   |
| `src/components/NSFWSexualWellnessAnalytics.tsx` | `src/dlc-modules/analytics/components/`   | analytics   |
| `src/lib/nsfwSexualWellnessAnalytics.ts`         | `src/dlc-modules/analytics/lib/`          | analytics   |
| `src/components/NSFWAdvancedFeatures.tsx`        | `src/dlc-modules/advanced/components/`    | advanced    |
| `src/lib/nsfwAdvancedFeatures.ts`                | `src/dlc-modules/advanced/lib/`           | advanced    |
| `src/components/PremiumContentMarketplace.tsx`   | `src/dlc-modules/marketplace/components/` | marketplace |
| `src/lib/premiumContentMarketplace.ts`           | `src/dlc-modules/marketplace/lib/`        | marketplace |

---

### Files to DELETE (After Moving)

After moving files to DLC modules, remove original files:

- Original NSFW component files in `src/components/`
- Original NSFW library files in `src/lib/`
- Original positions data in `src/data/`

---

## Database Schema

### New Tables Required

```sql
-- ============================================
-- DLC PACKAGES TABLE
-- ============================================
CREATE TABLE dlc_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id TEXT UNIQUE NOT NULL,           -- 'dlc-positions', 'dlc-videos', etc.
  package_name TEXT NOT NULL,
  safe_description TEXT NOT NULL,            -- Store-safe description
  full_description TEXT,                     -- Full description for website
  package_type TEXT NOT NULL CHECK (package_type IN ('individual', 'bundle', 'subscription')),

  -- Pricing
  price_usd DECIMAL(10,2) NOT NULL,
  price_type TEXT NOT NULL CHECK (price_type IN ('one_time', 'subscription')),
  subscription_interval TEXT,                -- 'monthly', 'yearly'

  -- Content
  features JSONB NOT NULL DEFAULT '[]',      -- List of features included
  included_packages TEXT[],                  -- For bundles: list of package_ids

  -- Distribution
  download_url TEXT,
  download_size_bytes BIGINT,
  checksum_sha256 TEXT,
  version TEXT NOT NULL DEFAULT '1.0.0',
  min_app_version TEXT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,

  -- Metadata
  content_rating TEXT DEFAULT '18+',
  preview_images TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- DLC LICENSES TABLE
-- ============================================
CREATE TABLE dlc_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL REFERENCES dlc_packages(package_id),

  -- License Info
  license_key TEXT UNIQUE NOT NULL,
  license_type TEXT NOT NULL CHECK (license_type IN ('one_time', 'subscription')),

  -- Purchase Info
  purchase_date TIMESTAMPTZ DEFAULT NOW(),
  purchase_price DECIMAL(10,2),
  payment_provider TEXT,                     -- 'stripe', 'paypal'
  payment_id TEXT,                           -- Stripe payment intent ID

  -- Subscription Info
  subscription_status TEXT,                  -- 'active', 'cancelled', 'expired'
  subscription_start TIMESTAMPTZ,
  subscription_end TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT true,

  -- Activation
  is_active BOOLEAN DEFAULT true,
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,

  -- Device Binding (optional)
  device_id TEXT,
  device_name TEXT,
  max_devices INTEGER DEFAULT 3,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, package_id)
);

-- ============================================
-- DLC INSTALLATIONS TABLE
-- ============================================
CREATE TABLE dlc_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  license_id UUID NOT NULL REFERENCES dlc_licenses(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL REFERENCES dlc_packages(package_id),

  -- Installation Info
  installed_version TEXT NOT NULL,
  install_date TIMESTAMPTZ DEFAULT NOW(),
  install_source TEXT,                       -- 'manual', 'auto_update'

  -- Device Info
  device_id TEXT NOT NULL,
  device_platform TEXT,                      -- 'android', 'ios', 'web'
  device_model TEXT,
  app_version TEXT,

  -- Status
  is_installed BOOLEAN DEFAULT true,
  last_used_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(license_id, device_id)
);

-- ============================================
-- DLC DOWNLOADS TABLE
-- ============================================
CREATE TABLE dlc_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL REFERENCES dlc_packages(package_id),
  license_id UUID REFERENCES dlc_licenses(id),

  -- Download Info
  download_url TEXT NOT NULL,
  download_started_at TIMESTAMPTZ DEFAULT NOW(),
  download_completed_at TIMESTAMPTZ,
  download_status TEXT DEFAULT 'pending',    -- 'pending', 'downloading', 'completed', 'failed'
  download_progress INTEGER DEFAULT 0,       -- 0-100

  -- File Info
  file_size_bytes BIGINT,
  downloaded_bytes BIGINT DEFAULT 0,
  checksum_verified BOOLEAN,

  -- Error Handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- AGE VERIFICATION TABLE
-- ============================================
CREATE TABLE age_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Verification
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  verification_method TEXT,                  -- 'self_declared', 'id_check'
  date_of_birth DATE,
  is_verified BOOLEAN DEFAULT false,

  -- Legal
  terms_accepted BOOLEAN DEFAULT false,
  terms_accepted_at TIMESTAMPTZ,
  terms_version TEXT,

  -- Audit
  ip_address INET,
  user_agent TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- ============================================
-- APP UPDATE SOURCE TABLE
-- ============================================
CREATE TABLE app_update_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,

  -- Source Tracking
  original_install_source TEXT NOT NULL,     -- 'google_play', 'app_store', 'website'
  current_update_source TEXT NOT NULL,       -- 'store', 'website'
  source_changed_at TIMESTAMPTZ,
  source_change_reason TEXT,                 -- 'dlc_installed'

  -- Version Tracking
  current_app_version TEXT,
  last_update_check TIMESTAMPTZ,
  last_update_installed TIMESTAMPTZ,

  -- Acknowledgment
  update_source_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, device_id)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_dlc_licenses_user ON dlc_licenses(user_id);
CREATE INDEX idx_dlc_licenses_package ON dlc_licenses(package_id);
CREATE INDEX idx_dlc_licenses_active ON dlc_licenses(is_active) WHERE is_active = true;
CREATE INDEX idx_dlc_installations_user ON dlc_installations(user_id);
CREATE INDEX idx_dlc_downloads_user ON dlc_downloads(user_id);
CREATE INDEX idx_age_verifications_user ON age_verifications(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================
ALTER TABLE dlc_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE age_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_update_sources ENABLE ROW LEVEL SECURITY;

-- Packages are publicly readable
CREATE POLICY "DLC packages are viewable by all" ON dlc_packages
  FOR SELECT USING (is_active = true);

-- Users can only see their own licenses
CREATE POLICY "Users can view own licenses" ON dlc_licenses
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own installations
CREATE POLICY "Users can view own installations" ON dlc_installations
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only see their own downloads
CREATE POLICY "Users can view own downloads" ON dlc_downloads
  FOR ALL USING (auth.uid() = user_id);

-- Users can only see their own age verification
CREATE POLICY "Users can view own age verification" ON age_verifications
  FOR ALL USING (auth.uid() = user_id);

-- Users can only see their own update source
CREATE POLICY "Users can view own update source" ON app_update_sources
  FOR ALL USING (auth.uid() = user_id);
```

---

## DLC Module Manifest Schema

Each DLC module has a `manifest.json`:

```json
{
  "id": "dlc-positions",
  "name": "Intimate Positions Guide",
  "version": "1.0.0",
  "description": {
    "safe": "Comprehensive guide to partner connection techniques with visual instructions",
    "full": "100+ intimate positions with detailed instructions, images, and expert tips"
  },
  "author": "Visionary Scanner Team",
  "license": "proprietary",

  "content": {
    "components": ["PositionsGallery", "PositionDetailView", "PositionCard", "PositionFilters"],
    "routes": [
      {
        "path": "/positions",
        "component": "PositionsGallery",
        "navItem": {
          "label": "Positions",
          "icon": "Heart",
          "order": 10
        }
      },
      {
        "path": "/positions/:id",
        "component": "PositionDetailView"
      }
    ],
    "dataFiles": ["positionsData.ts", "categories.ts"]
  },

  "requirements": {
    "minAppVersion": "1.0.0",
    "dependencies": [],
    "ageVerification": true
  },

  "distribution": {
    "downloadSize": "15MB",
    "installSize": "25MB",
    "checksum": "sha256:..."
  },

  "pricing": {
    "type": "one_time",
    "price": 9.99,
    "currency": "USD"
  }
}
```

---

## In-App DLC Store UI Design

### Storefront Layout (Safe Language)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         PREMIUM CONTENT STORE                                │
│                    Unlock Advanced Features                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌─ FEATURED BUNDLE ──────────────────────────────────────────────────────┐ │
│  │  🎁 ULTIMATE COMPLETE PACK                                    $49.99   │ │
│  │  The complete experience with all features unlocked forever            │ │
│  │  ✓ All 6 Premium Modules  ✓ Lifetime Access  ✓ Future Updates        │ │
│  │                                              [Learn More] [Purchase]   │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─ INDIVIDUAL PACKAGES ──────────────────────────────────────────────────┐ │
│  │                                                                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │ │
│  │  │ 📚 Intimate  │  │ 🎬 Advanced  │  │ 👥 Private   │                  │ │
│  │  │ Positions    │  │ Wellness     │  │ Community    │                  │ │
│  │  │ Guide        │  │ Videos       │  │ Access       │                  │ │
│  │  │              │  │              │  │              │                  │ │
│  │  │ 100+ guides  │  │ Expert demos │  │ Members only │                  │ │
│  │  │ $9.99        │  │ $14.99       │  │ $4.99/mo     │                  │ │
│  │  │ [Details]    │  │ [Details]    │  │ [Details]    │                  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                  │ │
│  │                                                                         │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │ │
│  │  │ 📊 Intimate  │  │ ⭐ Premium   │  │ 🛒 Creator   │                  │ │
│  │  │ Wellness     │  │ Adult        │  │ Marketplace  │                  │ │
│  │  │ Analytics    │  │ Features     │  │ Access       │                  │ │
│  │  │              │  │              │  │              │                  │ │
│  │  │ Track & sync │  │ Full suite   │  │ Expert content│                 │ │
│  │  │ $7.99        │  │ $19.99       │  │ $9.99/mo     │                  │ │
│  │  │ [Details]    │  │ [Details]    │  │ [Details]    │                  │ │
│  │  └──────────────┘  └──────────────┘  └──────────────┘                  │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ┌─ YOUR LIBRARY ─────────────────────────────────────────────────────────┐ │
│  │  No premium content installed yet.                                      │ │
│  │  Purchase above to unlock advanced features.                            │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
│                                                                              │
│  ⚠️ Note: Premium content is downloaded from our official website.         │
│     After installing premium content, app updates will also come from       │
│     our website instead of the app store.                                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Purchase & Installation Flow

### Flow Diagram

```
User clicks "Purchase" on DLC
         │
         ▼
┌─────────────────────┐
│ Age Verification    │
│ (18+ Confirmation)  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Update Source       │
│ Warning Modal       │
│ "Future updates     │
│ will come from      │
│ website only"       │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Redirect to         │
│ Official Website    │
│ (Opens in browser)  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Website Payment     │
│ (Stripe Checkout)   │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ License Generated   │
│ & Stored in DB      │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Return to App       │
│ (Deep Link)         │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Verify License      │
│ & Start Download    │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Download DLC        │
│ From Website CDN    │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Verify Checksum     │
│ & Install Module    │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Mark Update Source  │
│ as "Website"        │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ DLC Features        │
│ Now Available!      │
└─────────────────────┘
```

---

## Implementation Timeline

### Phase 1: Foundation (Week 1-2)

| Task                               | Files                          | Priority |
| ---------------------------------- | ------------------------------ | -------- |
| Create DLC directory structure     | `src/dlc/`, `src/dlc-modules/` | P0       |
| Implement DLC types and interfaces | `src/dlc/types.ts`             | P0       |
| Create DLC Manager core            | `src/dlc/DLCManager.ts`        | P0       |
| Create DLC Context                 | `src/contexts/DLCContext.tsx`  | P0       |
| Database migrations                | `supabase/migrations/*.sql`    | P0       |

### Phase 2: Move NSFW Content (Week 2-3)

| Task                    | Files                           | Priority |
| ----------------------- | ------------------------------- | -------- |
| Move positions module   | `src/dlc-modules/positions/*`   | P0       |
| Move videos module      | `src/dlc-modules/videos/*`      | P0       |
| Move community module   | `src/dlc-modules/community/*`   | P0       |
| Move analytics module   | `src/dlc-modules/analytics/*`   | P0       |
| Move advanced module    | `src/dlc-modules/advanced/*`    | P0       |
| Move marketplace module | `src/dlc-modules/marketplace/*` | P1       |
| Create module manifests | `*/manifest.json`               | P0       |
| Update all imports      | Various                         | P0       |

### Phase 3: DLC Store UI (Week 3-4)

| Task                    | Files                                               | Priority |
| ----------------------- | --------------------------------------------------- | -------- |
| Create DLC Storefront   | `src/components/dlc-store/DLCStorefront.tsx`        | P0       |
| Create Package Cards    | `src/components/dlc-store/DLCPackageCard.tsx`       | P0       |
| Create Purchase Modal   | `src/components/dlc-store/DLCPurchaseModal.tsx`     | P0       |
| Create Age Verification | `src/components/dlc-store/AgeVerificationModal.tsx` | P0       |
| Create Install Progress | `src/components/dlc-store/DLCInstallProgress.tsx`   | P1       |
| Update placeholders     | `src/components/placeholders/*`                     | P1       |

### Phase 4: Purchase & License (Week 4-5)

| Task                         | Files                            | Priority |
| ---------------------------- | -------------------------------- | -------- |
| Implement License Validator  | `src/dlc/DLCLicenseValidator.ts` | P0       |
| Implement Website API client | `src/lib/websiteApi.ts`          | P0       |
| Stripe integration for DLC   | Backend/Edge Function            | P0       |
| Deep linking for return      | App config                       | P1       |
| License key generation       | Backend                          | P0       |

### Phase 5: Download & Install (Week 5-6)

| Task                     | Files                             | Priority |
| ------------------------ | --------------------------------- | -------- |
| Implement DLC Downloader | `src/dlc/DLCDownloader.ts`        | P0       |
| Implement DLC Installer  | `src/dlc/DLCInstaller.ts`         | P0       |
| Dynamic module loading   | `src/lib/dlcLoader.ts`            | P0       |
| Update source tracking   | `src/lib/updateManager.ts`        | P0       |
| Update source banner     | `src/components/update-manager/*` | P1       |

### Phase 6: App Integration (Week 6-7)

| Task                      | Files                              | Priority |
| ------------------------- | ---------------------------------- | -------- |
| Update Index.tsx          | `src/pages/Index.tsx`              | P0       |
| Update Header navigation  | `src/components/Header.tsx`        | P0       |
| Update Settings           | `src/components/SettingsPanel.tsx` | P1       |
| Update feature flags      | `src/lib/featureFlags.ts`          | P0       |
| Conditional route loading | Router config                      | P0       |

### Phase 7: Build System (Week 7-8)

| Task                        | Files                              | Priority |
| --------------------------- | ---------------------------------- | -------- |
| Update Vite config          | `vite.config.ts`                   | P0       |
| Create DLC build config     | `vite.dlc.config.ts`               | P0       |
| DLC packaging script        | `scripts/package-dlc.js`           | P0       |
| Complete bundle build       | `scripts/build-complete-bundle.js` | P1       |
| Update package.json scripts | `package.json`                     | P0       |

### Phase 8: Testing & Polish (Week 8-9)

| Task                             | Priority |
| -------------------------------- | -------- |
| Test SFW build (no NSFW content) | P0       |
| Test DLC purchase flow           | P0       |
| Test DLC download/install        | P0       |
| Test update source switching     | P0       |
| Test license validation          | P0       |
| Test complete bundle             | P1       |
| Performance testing              | P1       |
| Security audit                   | P0       |

---

## Total File Count Summary

| Category       | New Files | Modified Files | Moved Files | Deleted Files   |
| -------------- | --------- | -------------- | ----------- | --------------- |
| DLC Core       | 7         | 0              | 0           | 0               |
| DLC Modules    | 30+       | 0              | 16          | 16 (after move) |
| DLC Store UI   | 9         | 0              | 0           | 0               |
| Placeholders   | 5         | 1              | 0           | 0               |
| Update Manager | 4         | 0              | 0           | 0               |
| Hooks          | 5         | 1              | 0           | 0               |
| Libraries      | 4         | 4              | 0           | 0               |
| Contexts       | 2         | 0              | 0           | 0               |
| Database       | 5         | 0              | 0           | 0               |
| Build Scripts  | 5         | 2              | 0           | 0               |
| Config         | 2         | 1              | 0           | 0               |
| **TOTAL**      | **~78**   | **~9**         | **~16**     | **~16**         |

---

## Success Criteria

### SFW App (Store Version)

- [ ] Zero NSFW content in codebase
- [ ] Zero NSFW references in UI text
- [ ] Passes Google Play review
- [ ] Passes Apple App Store review
- [ ] DLC Store shows safe descriptions only
- [ ] Links redirect to official website

### DLC System

- [ ] Each DLC module is self-contained
- [ ] Licenses validated server-side
- [ ] Download with integrity verification
- [ ] Dynamic loading works correctly
- [ ] Multiple DLCs can be installed
- [ ] Bundles install all included DLCs

### Update System

- [ ] Store updates work for SFW-only users
- [ ] Website updates work for DLC users
- [ ] Clear messaging about update source change
- [ ] User acknowledgment required
- [ ] No silent source switching

### Complete Bundle

- [ ] Website-only distribution
- [ ] All features pre-installed
- [ ] Discounted pricing works
- [ ] Updates from website only

---

## Risk Mitigation

| Risk                          | Mitigation                                                     |
| ----------------------------- | -------------------------------------------------------------- |
| Store rejection for DLC links | Use generic "Premium Content" language, no explicit references |
| DLC piracy                    | Server-side license validation, device binding, checksums      |
| Complex user experience       | Clear UI, step-by-step guidance, support documentation         |
| Update confusion              | Clear banners, explicit warnings before DLC install            |
| Payment issues                | Stripe for reliability, refund handling                        |

---

## Approval Checklist

Please confirm the following before implementation:

- [ ] **Architecture approved** - DLC module structure
- [ ] **Pricing approved** - Individual and bundle pricing
- [ ] **File changes approved** - Create, modify, move, delete plan
- [ ] **Database schema approved** - New tables and RLS
- [ ] **Timeline approved** - 8-9 week implementation
- [ ] **Store compliance approved** - Safe language approach

---

**Document Version**: 2.0  
**Created**: 2024-12-09  
**Status**: AWAITING APPROVAL  
**Estimated Implementation Time**: 8-9 weeks
