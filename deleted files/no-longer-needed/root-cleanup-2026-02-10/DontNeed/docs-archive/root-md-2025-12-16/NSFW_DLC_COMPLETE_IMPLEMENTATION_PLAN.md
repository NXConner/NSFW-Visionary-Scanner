# NSFW DLC Add-On System - Complete Implementation Plan (Final)

## Document Info

- **Version**: 3.0 (Final)
- **Created**: 2024-12-09
- **Status**: APPROVED - READY FOR IMPLEMENTATION
- **Timeline**: 12-13 weeks
- **Backup Branch**: `backup/main-pre-sfw-nsfw-modularization-20251209`

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Distribution Model](#distribution-model)
3. [DLC Package Catalog](#dlc-package-catalog)
4. [Technical Architecture](#technical-architecture)
5. [File Changes Complete List](#file-changes-complete-list)
6. [Database Schema](#database-schema)
7. [Security Implementation](#security-implementation)
8. [Platform-Specific Handling](#platform-specific-handling)
9. [Analytics & A/B Testing](#analytics--ab-testing)
10. [Internationalization](#internationalization)
11. [Gamification System](#gamification-system)
12. [Support Integration](#support-integration)
13. [Implementation Phases](#implementation-phases)
14. [Testing Strategy](#testing-strategy)

---

## Executive Summary

This plan transforms the app into a **SFW base app** (distributed via Google Play/Apple App Store) with **modular NSFW DLC add-ons** purchasable from the official website. All DLC packages are **self-contained bundles** with no external dependencies.

### Key Features

- ✅ 6 self-contained DLC bundles (no dependencies)
- ✅ Platform-specific download handlers (iOS/Android/Web)
- ✅ Gift codes & promotional system
- ✅ Content versioning with delta updates
- ✅ License binding & content encryption
- ✅ Full analytics & A/B testing
- ✅ 10+ language localization
- ✅ Gamification & engagement
- ✅ Lazy content loading & storage management
- ✅ Comprehensive subscription management
- ✅ Self-service support diagnostics
- ✅ Complete test infrastructure

---

## Distribution Model

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              DISTRIBUTION CHANNELS                               │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                  │
│  ┌────────────────────┐  ┌────────────────────┐  ┌────────────────────────────┐ │
│  │   GOOGLE PLAY      │  │   APPLE APP STORE  │  │   OFFICIAL WEBSITE         │ │
│  │   STORE            │  │                    │  │   (domain TBD)             │ │
│  ├────────────────────┤  ├────────────────────┤  ├────────────────────────────┤ │
│  │ • SFW Version Only │  │ • SFW Version Only │  │ • SFW (Discounted $4.99)   │ │
│  │ • Price: $9.99     │  │ • Price: $9.99     │  │ • Individual DLC Packs     │ │
│  │ • Auto Updates ✓   │  │ • Auto Updates ✓   │  │ • Complete NSFW Bundle     │ │
│  │ • Store Compliant  │  │ • Store Compliant  │  │ • All Future Updates       │ │
│  │ • In-App DLC Store │  │ • In-App DLC Store │  │ • Adult Content OK         │ │
│  │   (links to web)   │  │   (links to web)   │  │ • Direct Download          │ │
│  └─────────┬──────────┘  └─────────┬──────────┘  └──────────────┬─────────────┘ │
│            │                       │                            │               │
│            └───────────┬───────────┘                            │               │
│                        │                                        │               │
│                        ▼                                        ▼               │
│  ┌─────────────────────────────────────┐   ┌───────────────────────────────────┐│
│  │         SFW APP EXPERIENCE          │   │       NSFW FULL EXPERIENCE        ││
│  │                                     │   │                                   ││
│  │  • Health Scanner & Measurements    │   │  • Everything in SFW PLUS:        ││
│  │  • Health Diary & Journaling        │   │  • 100+ Positions Gallery         ││
│  │  • Men's Health Education (SFW)     │   │  • NSFW Video Library             ││
│  │  • AI Health Assistant              │   │  • Intimate Wellness Analytics    ││
│  │  • Community Forum (SFW topics)     │   │  • Multi-Camera Recording         ││
│  │  • Wellness Metrics (generic)       │   │  • Intimate Date Planner          ││
│  │  • Progress Tracking                │   │  • AI Companion Chat              ││
│  │  • DLC Store (safe descriptions)    │   │  • Private Adult Community        ││
│  │                                     │   │  • Creator Marketplace            ││
│  │  Updates: Google Play / App Store   │   │  Updates: Website Only            ││
│  └─────────────────────────────────────┘   └───────────────────────────────────┘│
│                                                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Update Source Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            UPDATE SOURCE LOGIC                                │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  User downloads from Store                                                    │
│           │                                                                   │
│           ▼                                                                   │
│  ┌─────────────────────┐                                                      │
│  │  SFW App (Pure)     │ ──────► Updates from: GOOGLE PLAY / APP STORE       │
│  │  No DLC Installed   │                                                      │
│  └──────────┬──────────┘                                                      │
│             │                                                                  │
│             │ User purchases DLC from website                                 │
│             │ User acknowledges update source change                          │
│             │ User installs DLC                                               │
│             ▼                                                                  │
│  ┌─────────────────────┐                                                      │
│  │  SFW + DLC (Hybrid) │ ──────► Updates from: WEBSITE ONLY                  │
│  │  Some DLC Installed │         (No longer store compliant)                  │
│  └──────────┬──────────┘                                                      │
│             │                                                                  │
│             │ User purchases Complete Bundle                                  │
│             ▼                                                                  │
│  ┌─────────────────────┐                                                      │
│  │  NSFW (Complete)    │ ──────► Updates from: WEBSITE ONLY                  │
│  │  All DLC Installed  │                                                      │
│  └─────────────────────┘                                                      │
│                                                                               │
│  ⚠️  IMPORTANT: Once ANY DLC is installed, app updates MUST come from        │
│      website. User is warned and must acknowledge before first DLC install.  │
│                                                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## DLC Package Catalog

### Self-Contained Bundle Packages (No Dependencies)

All packages include everything needed - no external requirements.

#### Tier 1: Entry Level Packs

| ID              | Name                     | Store-Safe Description                                                                                     | Contents                                                                                                                              | Price  |
| --------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| `dlc-positions` | **Positions Collection** | "Comprehensive guide to partner connection techniques with visual instructions and expert tips for adults" | • 100+ Position Gallery<br>• Position Details & Instructions<br>• Favorites & Playlists<br>• Category Filters<br>• Difficulty Ratings | $9.99  |
| `dlc-videos`    | **Video Library**        | "Premium video library featuring expert demonstrations and educational wellness content for adults"        | • NSFW Video Library<br>• HD Streaming<br>• Offline Downloads<br>• Playlists<br>• Progress Tracking                                   | $14.99 |

#### Tier 2: Enhanced Bundles

| ID             | Name                         | Store-Safe Description                                                             | Contents                                                                                                                                                                    | Price  | Savings |
| -------------- | ---------------------------- | ---------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ | ------- |
| `dlc-intimate` | **Intimate Experience Pack** | "Complete intimate wellness toolkit with guides, tracking, and partner features"   | • Everything in Positions Collection<br>• Intimate Wellness Analytics<br>• Partner Sync & Sharing<br>• Relationship Insights<br>• Custom Reports                            | $14.99 | 25%     |
| `dlc-creator`  | **Creator & Community Pack** | "Join our exclusive community with premium content from verified wellness experts" | • Everything in Video Library<br>• Private Community Forum<br>• Expert Q&A Access<br>• Creator Marketplace<br>• Exclusive Content                                           | $19.99 | 30%     |
| `dlc-advanced` | **Advanced Features Pack**   | "Premium suite of advanced features for the complete intimate experience"          | • Everything in Positions Collection<br>• Everything in Video Library<br>• Multi-Camera Recording<br>• Intimate Date Planner<br>• AI Companion Chat<br>• Partner Video Sync | $29.99 | 40%     |

#### Tier 3: Complete Packages

| ID                 | Name                       | Store-Safe Description                                                                 | Contents                                                                                                    | Price    | Savings |
| ------------------ | -------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | -------- | ------- |
| `dlc-complete`     | **Ultimate Complete Pack** | "The complete experience - all premium features unlocked forever with lifetime access" | • ALL DLC Features<br>• Lifetime Access<br>• All Future Content<br>• Priority Support                       | $39.99   | 50%+    |
| `dlc-subscription` | **All-Access Pass**        | "Full access to everything with continuous updates and priority support"               | • ALL DLC Features<br>• Continuous Updates<br>• New Content First<br>• Priority Support<br>• Cancel Anytime | $9.99/mo |

#### Direct Website Packages

| ID                  | Name                       | Description                                                           | Price  |
| ------------------- | -------------------------- | --------------------------------------------------------------------- | ------ |
| `app-complete-nsfw` | **Complete Adult Edition** | Full app with all NSFW features pre-installed (website download only) | $39.99 |
| `app-sfw-direct`    | **Wellness Suite Direct**  | SFW version at discounted price (website download)                    | $4.99  |

### Feature Distribution Matrix

| Feature                    | Positions | Videos | Intimate | Creator | Advanced | Complete | Subscription |
| -------------------------- | :-------: | :----: | :------: | :-----: | :------: | :------: | :----------: |
| Positions Gallery (100+)   |    ✅     |   ❌   |    ✅    |   ❌    |    ✅    |    ✅    |      ✅      |
| Position Details/Favorites |    ✅     |   ❌   |    ✅    |   ❌    |    ✅    |    ✅    |      ✅      |
| NSFW Video Library         |    ❌     |   ✅   |    ❌    |   ✅    |    ✅    |    ✅    |      ✅      |
| Video Streaming/Download   |    ❌     |   ✅   |    ❌    |   ✅    |    ✅    |    ✅    |      ✅      |
| Wellness Analytics         |    ❌     |   ❌   |    ✅    |   ❌    |    ❌    |    ✅    |      ✅      |
| Partner Sync               |    ❌     |   ❌   |    ✅    |   ❌    |    ❌    |    ✅    |      ✅      |
| Community Forum            |    ❌     |   ❌   |    ❌    |   ✅    |    ❌    |    ✅    |      ✅      |
| Creator Marketplace        |    ❌     |   ❌   |    ❌    |   ✅    |    ❌    |    ✅    |      ✅      |
| Multi-Camera Recording     |    ❌     |   ❌   |    ❌    |   ❌    |    ✅    |    ✅    |      ✅      |
| Intimate Date Planner      |    ❌     |   ❌   |    ❌    |   ❌    |    ✅    |    ✅    |      ✅      |
| AI Companion Chat          |    ❌     |   ❌   |    ❌    |   ❌    |    ✅    |    ✅    |      ✅      |
| **Price**                  |   $9.99   | $14.99 |  $14.99  | $19.99  |  $29.99  |  $39.99  |   $9.99/mo   |

### Smart Upgrade Pricing

| Already Owns                | Upgrade To              | Price    | Calculation              |
| --------------------------- | ----------------------- | -------- | ------------------------ |
| Positions ($9.99)           | Intimate ($14.99)       | $5.00    | Full price - owned value |
| Positions ($9.99)           | Advanced ($29.99)       | $20.00   | Full price - owned value |
| Videos ($14.99)             | Advanced ($29.99)       | $15.00   | Full price - owned value |
| Positions + Videos ($24.98) | Advanced ($29.99)       | $5.01    | Only new features        |
| Any Pack                    | Complete ($39.99)       | Varies   | Discounted appropriately |
| Any Pack                    | Subscription ($9.99/mo) | $9.99/mo | No discount (ongoing)    |

---

## Technical Architecture

### Directory Structure

```
src/
├── dlc/                                    # Core DLC Management System
│   ├── core/
│   │   ├── DLCManager.ts                   # Main DLC orchestrator
│   │   ├── DLCRegistry.ts                  # Package registry
│   │   └── types.ts                        # Type definitions
│   │
│   ├── license/
│   │   ├── LicenseValidator.ts             # Server-side validation
│   │   ├── LicenseCache.ts                 # Offline license caching
│   │   ├── DeviceBinding.ts                # Device fingerprinting
│   │   └── LicenseTypes.ts                 # License type definitions
│   │
│   ├── download/
│   │   ├── DownloadManager.ts              # Cross-platform download orchestrator
│   │   ├── IOSDownloader.ts                # iOS-specific (Background URL Session)
│   │   ├── AndroidDownloader.ts            # Android-specific (DownloadManager)
│   │   ├── WebDownloader.ts                # Web-specific (Service Worker)
│   │   └── DownloadProgress.ts             # Progress tracking
│   │
│   ├── install/
│   │   ├── DLCInstaller.ts                 # Installation logic
│   │   ├── ContentDecryptor.ts             # Decrypt protected content
│   │   ├── IntegrityChecker.ts             # Checksum verification
│   │   └── ModuleLoader.ts                 # Dynamic module loading
│   │
│   ├── update/
│   │   ├── UpdateChecker.ts                # Check for DLC updates
│   │   ├── DeltaUpdater.ts                 # Incremental updates
│   │   ├── UpdateSourceManager.ts          # Store vs Website updates
│   │   └── VersionManager.ts               # Version compatibility
│   │
│   ├── security/
│   │   ├── ContentEncryption.ts            # AES encryption for content
│   │   ├── TamperDetection.ts              # Detect modified files
│   │   ├── SecureStorage.ts                # Encrypted local storage
│   │   └── AbuseDetection.ts               # Detect license abuse
│   │
│   ├── promo/
│   │   ├── PromoCodeManager.ts             # Promo code redemption
│   │   ├── GiftCodeManager.ts              # Gift code system
│   │   └── AffiliateManager.ts             # Affiliate tracking
│   │
│   └── index.ts                            # Main exports
│
├── dlc-modules/                            # Self-Contained DLC Modules
│   ├── core/                               # Shared core components
│   │   ├── positions/
│   │   │   ├── components/
│   │   │   │   ├── PositionsGallery.tsx
│   │   │   │   ├── PositionDetailView.tsx
│   │   │   │   ├── PositionCard.tsx
│   │   │   │   ├── PositionFilters.tsx
│   │   │   │   ├── FavoritesManager.tsx
│   │   │   │   └── index.ts
│   │   │   ├── data/
│   │   │   │   ├── positionsData.ts
│   │   │   │   ├── categories.ts
│   │   │   │   └── index.ts
│   │   │   ├── hooks/
│   │   │   │   ├── usePositions.ts
│   │   │   │   ├── useFavorites.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── videos/
│   │   │   ├── components/
│   │   │   │   ├── VideoLibrary.tsx
│   │   │   │   ├── VideoPlayer.tsx
│   │   │   │   ├── VideoCard.tsx
│   │   │   │   ├── PlaylistManager.tsx
│   │   │   │   ├── OfflineManager.tsx
│   │   │   │   └── index.ts
│   │   │   ├── lib/
│   │   │   │   ├── videoStreaming.ts
│   │   │   │   ├── downloadManager.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── analytics/
│   │   │   ├── components/
│   │   │   │   ├── WellnessAnalytics.tsx
│   │   │   │   ├── PartnerSync.tsx
│   │   │   │   ├── IntimateReports.tsx
│   │   │   │   ├── TrendCharts.tsx
│   │   │   │   └── index.ts
│   │   │   ├── lib/
│   │   │   │   ├── analyticsEngine.ts
│   │   │   │   ├── partnerConnection.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── community/
│   │   │   ├── components/
│   │   │   │   ├── CommunityForum.tsx
│   │   │   │   ├── PrivateGroups.tsx
│   │   │   │   ├── ExpertQA.tsx
│   │   │   │   ├── CreatorMarketplace.tsx
│   │   │   │   └── index.ts
│   │   │   ├── lib/
│   │   │   │   ├── forumApi.ts
│   │   │   │   ├── marketplaceApi.ts
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   └── advanced/
│   │       ├── components/
│   │       │   ├── MultiCameraRecording.tsx
│   │       │   ├── IntimateDatePlanner.tsx
│   │       │   ├── AICompanionChat.tsx
│   │       │   ├── PartnerVideoSync.tsx
│   │       │   └── index.ts
│   │       ├── lib/
│   │       │   ├── cameraManager.ts
│   │       │   ├── datePlannerApi.ts
│   │       │   ├── aiChatApi.ts
│   │       │   └── index.ts
│   │       └── index.ts
│   │
│   ├── bundles/                            # Bundle configurations
│   │   ├── positions-bundle/
│   │   │   ├── manifest.json
│   │   │   ├── index.ts
│   │   │   └── routes.ts
│   │   ├── videos-bundle/
│   │   │   ├── manifest.json
│   │   │   ├── index.ts
│   │   │   └── routes.ts
│   │   ├── intimate-bundle/
│   │   │   ├── manifest.json
│   │   │   ├── index.ts
│   │   │   └── routes.ts
│   │   ├── creator-bundle/
│   │   │   ├── manifest.json
│   │   │   ├── index.ts
│   │   │   └── routes.ts
│   │   ├── advanced-bundle/
│   │   │   ├── manifest.json
│   │   │   ├── index.ts
│   │   │   └── routes.ts
│   │   └── complete-bundle/
│   │       ├── manifest.json
│   │       ├── index.ts
│   │       └── routes.ts
│   │
│   └── index.ts
│
├── components/
│   ├── dlc-store/                          # In-App DLC Store (SFW Safe)
│   │   ├── DLCStorefront.tsx               # Main store page
│   │   ├── DLCPackageCard.tsx              # Package display card
│   │   ├── DLCBundleCard.tsx               # Bundle display card
│   │   ├── DLCFeatureList.tsx              # Feature comparison
│   │   ├── DLCPurchaseModal.tsx            # Purchase flow
│   │   ├── DLCPreviewModal.tsx             # Content preview
│   │   ├── DLCInstallProgress.tsx          # Download/install UI
│   │   ├── DLCLibrary.tsx                  # User's purchased DLC
│   │   ├── DLCUpgradeCard.tsx              # Smart upgrade offers
│   │   ├── AgeVerificationModal.tsx        # 18+ verification
│   │   ├── UpdateSourceWarning.tsx         # Update source change warning
│   │   ├── PromoCodeInput.tsx              # Promo code entry
│   │   ├── GiftCodeInput.tsx               # Gift code redemption
│   │   └── index.ts
│   │
│   ├── dlc-management/                     # DLC Settings & Management
│   │   ├── DLCSettings.tsx                 # DLC section in settings
│   │   ├── DeviceManager.tsx               # Multi-device management
│   │   ├── StorageManager.tsx              # DLC storage management
│   │   ├── SubscriptionManager.tsx         # Subscription controls
│   │   ├── DownloadQueue.tsx               # Download queue UI
│   │   ├── UpdateManager.tsx               # DLC update UI
│   │   ├── LicenseInfo.tsx                 # License details
│   │   └── index.ts
│   │
│   ├── placeholders/                       # Locked Feature Placeholders
│   │   ├── PositionsPlaceholder.tsx
│   │   ├── VideosPlaceholder.tsx
│   │   ├── AnalyticsPlaceholder.tsx
│   │   ├── CommunityPlaceholder.tsx
│   │   ├── AdvancedPlaceholder.tsx
│   │   ├── MarketplacePlaceholder.tsx
│   │   ├── GenericDLCPlaceholder.tsx       # Reusable placeholder
│   │   └── index.ts
│   │
│   ├── update-manager/                     # App Update Management
│   │   ├── UpdateChecker.tsx
│   │   ├── UpdateDownloader.tsx
│   │   ├── UpdateSourceBanner.tsx
│   │   ├── UpdateAvailableModal.tsx
│   │   └── index.ts
│   │
│   ├── support/                            # Support Integration
│   │   ├── DLCSupportDiagnostics.tsx       # Diagnostic tool
│   │   ├── TroubleshootingWizard.tsx       # Self-service fixes
│   │   ├── RefundRequest.tsx               # Refund flow
│   │   └── index.ts
│   │
│   ├── gamification/                       # Gamification System
│   │   ├── AchievementBadge.tsx
│   │   ├── AchievementList.tsx
│   │   ├── StreakCounter.tsx
│   │   ├── ProgressTracker.tsx
│   │   ├── DailyFeatured.tsx
│   │   ├── OnboardingTour.tsx
│   │   └── index.ts
│   │
│   └── health/                             # SFW Health Components (Keep in base)
│       ├── WellnessMetricsTracker.tsx      # Renamed from SexualWellness (SFW)
│       ├── MensHealthEducation.tsx         # Renamed, kept SFW
│       └── index.ts
│
├── hooks/
│   ├── dlc/
│   │   ├── useDLCStore.ts                  # Store state
│   │   ├── useDLCInstallation.ts           # Installation state
│   │   ├── useDLCLicense.ts                # License management
│   │   ├── useDLCDownload.ts               # Download progress
│   │   ├── useDLCContent.ts                # Content access
│   │   ├── useDLCUpdates.ts                # Update checking
│   │   ├── useUpdateSource.ts              # Update source tracking
│   │   ├── useAgeVerification.ts           # Age verification state
│   │   ├── usePromoCode.ts                 # Promo code handling
│   │   ├── useGiftCode.ts                  # Gift code handling
│   │   ├── useDeviceBinding.ts             # Device management
│   │   ├── useStorageManagement.ts         # Storage tracking
│   │   └── index.ts
│   │
│   └── gamification/
│       ├── useAchievements.ts
│       ├── useStreaks.ts
│       ├── useDailyFeatured.ts
│       └── index.ts
│
├── contexts/
│   ├── DLCContext.tsx                      # DLC state provider
│   ├── UpdateContext.tsx                   # Update state provider
│   ├── GamificationContext.tsx             # Gamification state
│   └── index.ts
│
├── lib/
│   ├── dlc/
│   │   ├── dlcApi.ts                       # DLC API client
│   │   ├── websiteApi.ts                   # Website API client
│   │   ├── paymentApi.ts                   # Payment processing
│   │   └── index.ts
│   │
│   ├── analytics/
│   │   ├── dlcAnalytics.ts                 # DLC-specific analytics
│   │   ├── conversionTracking.ts           # Conversion funnel
│   │   ├── abTesting.ts                    # A/B test framework
│   │   └── index.ts
│   │
│   ├── i18n/
│   │   ├── dlcTranslations.ts              # DLC string translations
│   │   ├── currencies.ts                   # Currency formatting
│   │   ├── regions.ts                      # Regional settings
│   │   └── index.ts
│   │
│   ├── storage/
│   │   ├── lazyContentLoader.ts            # On-demand content loading
│   │   ├── storageQuota.ts                 # Storage management
│   │   ├── cacheManager.ts                 # Content caching
│   │   └── index.ts
│   │
│   └── support/
│       ├── diagnostics.ts                  # Diagnostic data collection
│       ├── troubleshooting.ts              # Auto-fix logic
│       ├── refunds.ts                      # Refund processing
│       └── index.ts
│
└── services/
    └── dlc/
        ├── DLCService.ts                   # Main DLC service
        ├── LicenseService.ts               # License management
        ├── DownloadService.ts              # Download orchestration
        ├── InstallService.ts               # Installation service
        └── index.ts
```

---

## File Changes Complete List

### Files to CREATE (New) - 120+ files

#### DLC Core System (25 files)

```
src/dlc/core/DLCManager.ts
src/dlc/core/DLCRegistry.ts
src/dlc/core/types.ts
src/dlc/license/LicenseValidator.ts
src/dlc/license/LicenseCache.ts
src/dlc/license/DeviceBinding.ts
src/dlc/license/LicenseTypes.ts
src/dlc/download/DownloadManager.ts
src/dlc/download/IOSDownloader.ts
src/dlc/download/AndroidDownloader.ts
src/dlc/download/WebDownloader.ts
src/dlc/download/DownloadProgress.ts
src/dlc/install/DLCInstaller.ts
src/dlc/install/ContentDecryptor.ts
src/dlc/install/IntegrityChecker.ts
src/dlc/install/ModuleLoader.ts
src/dlc/update/UpdateChecker.ts
src/dlc/update/DeltaUpdater.ts
src/dlc/update/UpdateSourceManager.ts
src/dlc/update/VersionManager.ts
src/dlc/security/ContentEncryption.ts
src/dlc/security/TamperDetection.ts
src/dlc/security/SecureStorage.ts
src/dlc/security/AbuseDetection.ts
src/dlc/promo/PromoCodeManager.ts
src/dlc/promo/GiftCodeManager.ts
src/dlc/promo/AffiliateManager.ts
src/dlc/index.ts
```

#### DLC Modules - Core Components (30 files)

```
src/dlc-modules/core/positions/components/PositionsGallery.tsx
src/dlc-modules/core/positions/components/PositionDetailView.tsx
src/dlc-modules/core/positions/components/PositionCard.tsx
src/dlc-modules/core/positions/components/PositionFilters.tsx
src/dlc-modules/core/positions/components/FavoritesManager.tsx
src/dlc-modules/core/positions/components/index.ts
src/dlc-modules/core/positions/data/positionsData.ts
src/dlc-modules/core/positions/data/categories.ts
src/dlc-modules/core/positions/data/index.ts
src/dlc-modules/core/positions/hooks/usePositions.ts
src/dlc-modules/core/positions/hooks/useFavorites.ts
src/dlc-modules/core/positions/hooks/index.ts
src/dlc-modules/core/positions/index.ts

src/dlc-modules/core/videos/components/VideoLibrary.tsx
src/dlc-modules/core/videos/components/VideoPlayer.tsx
src/dlc-modules/core/videos/components/VideoCard.tsx
src/dlc-modules/core/videos/components/PlaylistManager.tsx
src/dlc-modules/core/videos/components/OfflineManager.tsx
src/dlc-modules/core/videos/components/index.ts
src/dlc-modules/core/videos/lib/videoStreaming.ts
src/dlc-modules/core/videos/lib/downloadManager.ts
src/dlc-modules/core/videos/lib/index.ts
src/dlc-modules/core/videos/index.ts

src/dlc-modules/core/analytics/components/*.tsx (5 files)
src/dlc-modules/core/analytics/lib/*.ts (3 files)
src/dlc-modules/core/community/components/*.tsx (5 files)
src/dlc-modules/core/community/lib/*.ts (3 files)
src/dlc-modules/core/advanced/components/*.tsx (5 files)
src/dlc-modules/core/advanced/lib/*.ts (4 files)
```

#### DLC Bundles (18 files)

```
src/dlc-modules/bundles/positions-bundle/manifest.json
src/dlc-modules/bundles/positions-bundle/index.ts
src/dlc-modules/bundles/positions-bundle/routes.ts
src/dlc-modules/bundles/videos-bundle/manifest.json
src/dlc-modules/bundles/videos-bundle/index.ts
src/dlc-modules/bundles/videos-bundle/routes.ts
src/dlc-modules/bundles/intimate-bundle/manifest.json
src/dlc-modules/bundles/intimate-bundle/index.ts
src/dlc-modules/bundles/intimate-bundle/routes.ts
src/dlc-modules/bundles/creator-bundle/manifest.json
src/dlc-modules/bundles/creator-bundle/index.ts
src/dlc-modules/bundles/creator-bundle/routes.ts
src/dlc-modules/bundles/advanced-bundle/manifest.json
src/dlc-modules/bundles/advanced-bundle/index.ts
src/dlc-modules/bundles/advanced-bundle/routes.ts
src/dlc-modules/bundles/complete-bundle/manifest.json
src/dlc-modules/bundles/complete-bundle/index.ts
src/dlc-modules/bundles/complete-bundle/routes.ts
```

#### DLC Store UI (14 files)

```
src/components/dlc-store/DLCStorefront.tsx
src/components/dlc-store/DLCPackageCard.tsx
src/components/dlc-store/DLCBundleCard.tsx
src/components/dlc-store/DLCFeatureList.tsx
src/components/dlc-store/DLCPurchaseModal.tsx
src/components/dlc-store/DLCPreviewModal.tsx
src/components/dlc-store/DLCInstallProgress.tsx
src/components/dlc-store/DLCLibrary.tsx
src/components/dlc-store/DLCUpgradeCard.tsx
src/components/dlc-store/AgeVerificationModal.tsx
src/components/dlc-store/UpdateSourceWarning.tsx
src/components/dlc-store/PromoCodeInput.tsx
src/components/dlc-store/GiftCodeInput.tsx
src/components/dlc-store/index.ts
```

#### DLC Management UI (9 files)

```
src/components/dlc-management/DLCSettings.tsx
src/components/dlc-management/DeviceManager.tsx
src/components/dlc-management/StorageManager.tsx
src/components/dlc-management/SubscriptionManager.tsx
src/components/dlc-management/DownloadQueue.tsx
src/components/dlc-management/UpdateManager.tsx
src/components/dlc-management/LicenseInfo.tsx
src/components/dlc-management/index.ts
```

#### Placeholders (8 files)

```
src/components/placeholders/PositionsPlaceholder.tsx (update)
src/components/placeholders/VideosPlaceholder.tsx
src/components/placeholders/AnalyticsPlaceholder.tsx
src/components/placeholders/CommunityPlaceholder.tsx
src/components/placeholders/AdvancedPlaceholder.tsx
src/components/placeholders/MarketplacePlaceholder.tsx
src/components/placeholders/GenericDLCPlaceholder.tsx
src/components/placeholders/index.ts
```

#### Update Manager UI (5 files)

```
src/components/update-manager/UpdateChecker.tsx
src/components/update-manager/UpdateDownloader.tsx
src/components/update-manager/UpdateSourceBanner.tsx
src/components/update-manager/UpdateAvailableModal.tsx
src/components/update-manager/index.ts
```

#### Support UI (4 files)

```
src/components/support/DLCSupportDiagnostics.tsx
src/components/support/TroubleshootingWizard.tsx
src/components/support/RefundRequest.tsx
src/components/support/index.ts
```

#### Gamification UI (7 files)

```
src/components/gamification/AchievementBadge.tsx
src/components/gamification/AchievementList.tsx
src/components/gamification/StreakCounter.tsx
src/components/gamification/ProgressTracker.tsx
src/components/gamification/DailyFeatured.tsx
src/components/gamification/OnboardingTour.tsx
src/components/gamification/index.ts
```

#### Hooks (18 files)

```
src/hooks/dlc/useDLCStore.ts
src/hooks/dlc/useDLCInstallation.ts
src/hooks/dlc/useDLCLicense.ts
src/hooks/dlc/useDLCDownload.ts
src/hooks/dlc/useDLCContent.ts
src/hooks/dlc/useDLCUpdates.ts
src/hooks/dlc/useUpdateSource.ts
src/hooks/dlc/useAgeVerification.ts
src/hooks/dlc/usePromoCode.ts
src/hooks/dlc/useGiftCode.ts
src/hooks/dlc/useDeviceBinding.ts
src/hooks/dlc/useStorageManagement.ts
src/hooks/dlc/index.ts
src/hooks/gamification/useAchievements.ts
src/hooks/gamification/useStreaks.ts
src/hooks/gamification/useDailyFeatured.ts
src/hooks/gamification/index.ts
```

#### Contexts (4 files)

```
src/contexts/DLCContext.tsx
src/contexts/UpdateContext.tsx
src/contexts/GamificationContext.tsx
src/contexts/index.ts
```

#### Libraries (15 files)

```
src/lib/dlc/dlcApi.ts
src/lib/dlc/websiteApi.ts
src/lib/dlc/paymentApi.ts
src/lib/dlc/index.ts
src/lib/analytics/dlcAnalytics.ts
src/lib/analytics/conversionTracking.ts
src/lib/analytics/abTesting.ts
src/lib/analytics/index.ts
src/lib/i18n/dlcTranslations.ts
src/lib/i18n/currencies.ts
src/lib/i18n/regions.ts
src/lib/i18n/index.ts
src/lib/storage/lazyContentLoader.ts
src/lib/storage/storageQuota.ts
src/lib/storage/cacheManager.ts
src/lib/storage/index.ts
src/lib/support/diagnostics.ts
src/lib/support/troubleshooting.ts
src/lib/support/refunds.ts
src/lib/support/index.ts
```

#### Services (5 files)

```
src/services/dlc/DLCService.ts
src/services/dlc/LicenseService.ts
src/services/dlc/DownloadService.ts
src/services/dlc/InstallService.ts
src/services/dlc/index.ts
```

#### Database Migrations (10 files)

```
supabase/migrations/20241209_001_dlc_packages.sql
supabase/migrations/20241209_002_dlc_licenses.sql
supabase/migrations/20241209_003_dlc_installations.sql
supabase/migrations/20241209_004_dlc_downloads.sql
supabase/migrations/20241209_005_age_verification.sql
supabase/migrations/20241209_006_update_sources.sql
supabase/migrations/20241209_007_gift_codes.sql
supabase/migrations/20241209_008_promo_codes.sql
supabase/migrations/20241209_009_achievements.sql
supabase/migrations/20241209_010_dlc_analytics.sql
```

#### Build Scripts (6 files)

```
scripts/build-dlc-module.js
scripts/package-dlc.js
scripts/deploy-dlc.js
scripts/build-complete-bundle.js
scripts/encrypt-dlc-content.js
scripts/generate-checksums.js
vite.dlc.config.ts
```

#### Configuration Files (5 files)

```
dlc.config.json
dlc-manifest.json
dlc-pricing.json
dlc-translations/en.json
dlc-translations/es.json (+ 8 more languages)
```

#### Test Files (15+ files)

```
src/__tests__/dlc/DLCManager.test.ts
src/__tests__/dlc/LicenseValidator.test.ts
src/__tests__/dlc/DownloadManager.test.ts
src/__tests__/dlc/DLCInstaller.test.ts
src/__tests__/dlc/PromoCodeManager.test.ts
src/__tests__/dlc/GiftCodeManager.test.ts
src/__tests__/components/DLCStorefront.test.tsx
src/__tests__/components/DLCPurchaseModal.test.tsx
src/__tests__/hooks/useDLCLicense.test.ts
src/__tests__/hooks/useDLCDownload.test.ts
e2e/dlc-purchase-flow.spec.ts
e2e/dlc-install-flow.spec.ts
e2e/dlc-upgrade-flow.spec.ts
```

### Files to MODIFY (Existing) - 15 files

| File                               | Changes                                                             |
| ---------------------------------- | ------------------------------------------------------------------- |
| `src/pages/Index.tsx`              | Remove NSFW imports, add DLC conditional loading, add DLC store tab |
| `src/components/Header.tsx`        | Add DLC Store nav, conditionally show NSFW tabs                     |
| `src/components/SettingsPanel.tsx` | Add DLC management section                                          |
| `src/App.tsx` or `src/main.tsx`    | Wrap with DLC/Update/Gamification contexts                          |
| `src/lib/featureFlags.ts`          | Add DLC-aware feature checks                                        |
| `src/lib/dlcManager.ts`            | Replace stub with full implementation                               |
| `src/lib/enhancedDLCSystem.ts`     | Replace stub with full implementation                               |
| `src/lib/dlcContentLoader.ts`      | Replace stub with full implementation                               |
| `src/hooks/useDLCContent.ts`       | Expand with new functionality                                       |
| `src/components/DLCBadge.tsx`      | Update for new DLC system                                           |
| `src/components/DLCStatus.tsx`     | Update for new DLC system                                           |
| `src/components/DLCUnlock.tsx`     | Update for website redirect flow                                    |
| `package.json`                     | Add DLC build scripts                                               |
| `vite.config.ts`                   | Add DLC module exclusion                                            |
| `tsconfig.json`                    | Add DLC module paths                                                |

### Files to MOVE (Relocate to DLC Modules) - 16 files

| Current Location                                 | New Location                                 |
| ------------------------------------------------ | -------------------------------------------- |
| `src/components/PositionsGallery.tsx`            | `src/dlc-modules/core/positions/components/` |
| `src/components/PositionDetailView.tsx`          | `src/dlc-modules/core/positions/components/` |
| `src/data/positionsData.ts`                      | `src/dlc-modules/core/positions/data/`       |
| `src/hooks/usePositionImages.ts`                 | `src/dlc-modules/core/positions/hooks/`      |
| `src/lib/enhancedPositionsGallery.ts`            | `src/dlc-modules/core/positions/lib/`        |
| `src/components/NSFWVideoContent.tsx`            | `src/dlc-modules/core/videos/components/`    |
| `src/lib/nsfwVideoContent.ts`                    | `src/dlc-modules/core/videos/lib/`           |
| `src/components/NSFWCommunityForum.tsx`          | `src/dlc-modules/core/community/components/` |
| `src/lib/nsfwCommunityForum.ts`                  | `src/dlc-modules/core/community/lib/`        |
| `src/components/NSFWSexualWellnessAnalytics.tsx` | `src/dlc-modules/core/analytics/components/` |
| `src/lib/nsfwSexualWellnessAnalytics.ts`         | `src/dlc-modules/core/analytics/lib/`        |
| `src/components/NSFWAdvancedFeatures.tsx`        | `src/dlc-modules/core/advanced/components/`  |
| `src/lib/nsfwAdvancedFeatures.ts`                | `src/dlc-modules/core/advanced/lib/`         |
| `src/components/PremiumContentMarketplace.tsx`   | `src/dlc-modules/core/community/components/` |
| `src/lib/premiumContentMarketplace.ts`           | `src/dlc-modules/core/community/lib/`        |

### Files to KEEP in SFW Base (Rename/Modify) - 2 files

| Current                                     | Action           | New Name                           |
| ------------------------------------------- | ---------------- | ---------------------------------- |
| `src/components/SexualHealthEducation.tsx`  | Rename, keep SFW | `MensHealthEducation.tsx`          |
| `src/components/SexualWellnessTracking.tsx` | Split            | `WellnessMetricsTracker.tsx` (SFW) |

---

## Database Schema

### Complete SQL Migration

```sql
-- ============================================
-- MIGRATION: 20241209_001_dlc_packages.sql
-- DLC Packages Table
-- ============================================

CREATE TABLE IF NOT EXISTS dlc_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id TEXT UNIQUE NOT NULL,
  package_name TEXT NOT NULL,
  package_type TEXT NOT NULL CHECK (package_type IN ('individual', 'bundle', 'subscription')),

  -- Descriptions
  safe_description TEXT NOT NULL,
  full_description TEXT,
  marketing_tagline TEXT,

  -- Pricing
  price_usd DECIMAL(10,2) NOT NULL,
  price_type TEXT NOT NULL CHECK (price_type IN ('one_time', 'subscription')),
  subscription_interval TEXT CHECK (subscription_interval IN ('monthly', 'yearly')),

  -- Regional Pricing (JSONB)
  regional_pricing JSONB DEFAULT '{}',

  -- Features included
  features JSONB NOT NULL DEFAULT '[]',
  included_packages TEXT[],

  -- Distribution
  download_url TEXT,
  download_size_bytes BIGINT,
  checksum_sha256 TEXT,
  encryption_key_id TEXT,

  -- Versioning
  version TEXT NOT NULL DEFAULT '1.0.0',
  content_version TEXT DEFAULT '2024.12.1',
  min_app_version TEXT,
  max_app_version TEXT,

  -- Content changelog
  content_changelog JSONB DEFAULT '[]',

  -- Status
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,

  -- Metadata
  content_rating TEXT DEFAULT '18+',
  preview_images TEXT[],
  preview_video_url TEXT,

  -- Localization
  localized_names JSONB DEFAULT '{}',
  localized_descriptions JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MIGRATION: 20241209_002_dlc_licenses.sql
-- DLC Licenses Table
-- ============================================

CREATE TABLE IF NOT EXISTS dlc_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL REFERENCES dlc_packages(package_id),

  -- License Info
  license_key TEXT UNIQUE NOT NULL,
  license_type TEXT NOT NULL CHECK (license_type IN ('one_time', 'subscription', 'gift', 'promo')),

  -- Purchase Info
  purchase_date TIMESTAMPTZ DEFAULT NOW(),
  purchase_price DECIMAL(10,2),
  purchase_currency TEXT DEFAULT 'USD',
  payment_provider TEXT,
  payment_id TEXT,

  -- Subscription Info
  subscription_status TEXT CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'paused')),
  subscription_start TIMESTAMPTZ,
  subscription_end TIMESTAMPTZ,
  subscription_pause_until TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT true,

  -- Activation
  is_active BOOLEAN DEFAULT true,
  activated_at TIMESTAMPTZ,
  deactivated_at TIMESTAMPTZ,

  -- Device Binding
  max_devices INTEGER DEFAULT 3,

  -- Offline Support
  offline_cache_expires_at TIMESTAMPTZ,
  last_online_validation TIMESTAMPTZ,
  grace_period_until TIMESTAMPTZ,

  -- Refund
  refunded_at TIMESTAMPTZ,
  refund_reason TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, package_id)
);

-- ============================================
-- MIGRATION: 20241209_003_dlc_license_devices.sql
-- Device Binding Table
-- ============================================

CREATE TABLE IF NOT EXISTS dlc_license_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  license_id UUID NOT NULL REFERENCES dlc_licenses(id) ON DELETE CASCADE,

  -- Device Info
  device_id TEXT NOT NULL,
  device_fingerprint TEXT,
  device_name TEXT,
  device_platform TEXT CHECK (device_platform IN ('android', 'ios', 'web')),
  device_model TEXT,

  -- Status
  is_primary BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,

  -- Usage
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  last_validation_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(license_id, device_id)
);

-- ============================================
-- MIGRATION: 20241209_004_dlc_installations.sql
-- DLC Installations Table
-- ============================================

CREATE TABLE IF NOT EXISTS dlc_installations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  license_id UUID NOT NULL REFERENCES dlc_licenses(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL REFERENCES dlc_packages(package_id),
  device_id TEXT NOT NULL,

  -- Installation Info
  installed_version TEXT NOT NULL,
  content_version TEXT,
  install_date TIMESTAMPTZ DEFAULT NOW(),
  install_source TEXT CHECK (install_source IN ('manual', 'auto_update', 'restore')),

  -- Device Info
  device_platform TEXT,
  device_model TEXT,
  app_version TEXT,

  -- Storage
  storage_used_bytes BIGINT,
  cached_content_bytes BIGINT,

  -- Status
  is_installed BOOLEAN DEFAULT true,
  is_corrupted BOOLEAN DEFAULT false,
  last_integrity_check TIMESTAMPTZ,
  last_used_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(license_id, device_id)
);

-- ============================================
-- MIGRATION: 20241209_005_dlc_downloads.sql
-- DLC Downloads Table
-- ============================================

CREATE TABLE IF NOT EXISTS dlc_downloads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL REFERENCES dlc_packages(package_id),
  license_id UUID REFERENCES dlc_licenses(id),
  device_id TEXT NOT NULL,

  -- Download Info
  download_url TEXT NOT NULL,
  download_type TEXT CHECK (download_type IN ('full', 'delta', 'content_update')),

  -- Progress
  download_status TEXT DEFAULT 'pending' CHECK (download_status IN ('pending', 'downloading', 'paused', 'completed', 'failed', 'cancelled')),
  download_progress INTEGER DEFAULT 0,
  download_speed_bps BIGINT,

  -- Timing
  download_started_at TIMESTAMPTZ,
  download_completed_at TIMESTAMPTZ,

  -- File Info
  file_size_bytes BIGINT,
  downloaded_bytes BIGINT DEFAULT 0,
  checksum_expected TEXT,
  checksum_verified BOOLEAN,

  -- Error Handling
  error_message TEXT,
  error_code TEXT,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MIGRATION: 20241209_006_age_verification.sql
-- Age Verification Table
-- ============================================

CREATE TABLE IF NOT EXISTS age_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Verification
  verified_at TIMESTAMPTZ DEFAULT NOW(),
  verification_method TEXT CHECK (verification_method IN ('self_declared', 'id_check', 'credit_card')),
  declared_age INTEGER,
  date_of_birth DATE,
  is_verified BOOLEAN DEFAULT false,

  -- Legal
  terms_accepted BOOLEAN DEFAULT false,
  terms_accepted_at TIMESTAMPTZ,
  terms_version TEXT,
  adult_content_consent BOOLEAN DEFAULT false,

  -- Audit
  ip_address INET,
  user_agent TEXT,
  country_code TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- ============================================
-- MIGRATION: 20241209_007_update_sources.sql
-- App Update Sources Table
-- ============================================

CREATE TABLE IF NOT EXISTS app_update_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id TEXT NOT NULL,

  -- Source Tracking
  original_install_source TEXT NOT NULL CHECK (original_install_source IN ('google_play', 'app_store', 'website', 'direct')),
  current_update_source TEXT NOT NULL CHECK (current_update_source IN ('store', 'website')),
  source_changed_at TIMESTAMPTZ,
  source_change_reason TEXT,

  -- Version Tracking
  current_app_version TEXT,
  last_update_check TIMESTAMPTZ,
  last_update_installed TIMESTAMPTZ,
  available_update_version TEXT,

  -- Acknowledgment
  update_source_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, device_id)
);

-- ============================================
-- MIGRATION: 20241209_008_gift_codes.sql
-- Gift Codes Table
-- ============================================

CREATE TABLE IF NOT EXISTS dlc_gift_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  package_id TEXT NOT NULL REFERENCES dlc_packages(package_id),

  -- Purchase
  purchased_by UUID REFERENCES auth.users(id),
  purchase_price DECIMAL(10,2),
  purchased_at TIMESTAMPTZ DEFAULT NOW(),

  -- Redemption
  redeemed_by UUID REFERENCES auth.users(id),
  redeemed_at TIMESTAMPTZ,

  -- Details
  gift_message TEXT,
  recipient_email TEXT,

  -- Expiration
  expires_at TIMESTAMPTZ,

  -- Status
  is_active BOOLEAN DEFAULT true,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- MIGRATION: 20241209_009_promo_codes.sql
-- Promotional Codes Table
-- ============================================

CREATE TABLE IF NOT EXISTS dlc_promo_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,

  -- Discount
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free')),
  discount_value DECIMAL(10,2) NOT NULL,

  -- Applicability
  applies_to TEXT[] DEFAULT ARRAY['all'],

  -- Limits
  max_redemptions INTEGER,
  current_redemptions INTEGER DEFAULT 0,
  max_per_user INTEGER DEFAULT 1,

  -- Validity
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,

  -- Affiliate
  affiliate_id UUID REFERENCES auth.users(id),
  affiliate_commission DECIMAL(5,2),

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Metadata
  campaign_name TEXT,
  created_by UUID REFERENCES auth.users(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dlc_promo_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promo_code_id UUID NOT NULL REFERENCES dlc_promo_codes(id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  package_id TEXT NOT NULL,

  original_price DECIMAL(10,2),
  discount_applied DECIMAL(10,2),
  final_price DECIMAL(10,2),

  redeemed_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(promo_code_id, user_id, package_id)
);

-- ============================================
-- MIGRATION: 20241209_010_achievements.sql
-- Gamification Tables
-- ============================================

CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  category TEXT,

  -- Requirements
  requirement_type TEXT,
  requirement_value INTEGER,

  -- Rewards
  reward_type TEXT,
  reward_value TEXT,

  -- Display
  is_hidden BOOLEAN DEFAULT false,
  display_order INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  achievement_id TEXT NOT NULL REFERENCES achievements(achievement_id),

  progress INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, achievement_id)
);

CREATE TABLE IF NOT EXISTS user_streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  streak_type TEXT NOT NULL,

  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, streak_type)
);

-- ============================================
-- MIGRATION: 20241209_011_dlc_analytics.sql
-- Analytics Tables
-- ============================================

CREATE TABLE IF NOT EXISTS dlc_analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  session_id TEXT,

  event_type TEXT NOT NULL,
  event_data JSONB,

  -- Context
  package_id TEXT,
  device_platform TEXT,
  app_version TEXT,

  -- A/B Testing
  experiment_id TEXT,
  variant_id TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dlc_ab_experiments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,

  -- Variants
  variants JSONB NOT NULL,

  -- Targeting
  target_percentage DECIMAL(5,2) DEFAULT 100,
  target_criteria JSONB,

  -- Status
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dlc_ab_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  experiment_id TEXT NOT NULL REFERENCES dlc_ab_experiments(experiment_id),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  variant_id TEXT NOT NULL,

  assigned_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(experiment_id, user_id)
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_dlc_licenses_user ON dlc_licenses(user_id);
CREATE INDEX IF NOT EXISTS idx_dlc_licenses_package ON dlc_licenses(package_id);
CREATE INDEX IF NOT EXISTS idx_dlc_licenses_active ON dlc_licenses(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_dlc_installations_user ON dlc_installations(user_id);
CREATE INDEX IF NOT EXISTS idx_dlc_installations_device ON dlc_installations(device_id);
CREATE INDEX IF NOT EXISTS idx_dlc_downloads_user ON dlc_downloads(user_id);
CREATE INDEX IF NOT EXISTS idx_dlc_downloads_status ON dlc_downloads(download_status);
CREATE INDEX IF NOT EXISTS idx_dlc_analytics_user ON dlc_analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_dlc_analytics_event ON dlc_analytics_events(event_type);
CREATE INDEX IF NOT EXISTS idx_dlc_analytics_time ON dlc_analytics_events(created_at);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_gift_codes_code ON dlc_gift_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON dlc_promo_codes(code);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE dlc_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_license_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_installations ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_downloads ENABLE ROW LEVEL SECURITY;
ALTER TABLE age_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_update_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_gift_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE dlc_analytics_events ENABLE ROW LEVEL SECURITY;

-- Packages are publicly readable
CREATE POLICY "DLC packages are viewable by all" ON dlc_packages
  FOR SELECT USING (is_active = true);

-- Users can only see their own data
CREATE POLICY "Users can view own licenses" ON dlc_licenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own devices" ON dlc_license_devices
  FOR SELECT USING (
    license_id IN (SELECT id FROM dlc_licenses WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can manage own devices" ON dlc_license_devices
  FOR ALL USING (
    license_id IN (SELECT id FROM dlc_licenses WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can view own installations" ON dlc_installations
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own downloads" ON dlc_downloads
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own age verification" ON age_verifications
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own update source" ON app_update_sources
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own achievements" ON user_achievements
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own streaks" ON user_streaks
  FOR ALL USING (auth.uid() = user_id);

-- Promo codes are publicly readable (code only)
CREATE POLICY "Promo codes are checkable" ON dlc_promo_codes
  FOR SELECT USING (is_active = true AND valid_until > NOW());

-- Gift codes viewable by purchaser or redeemer
CREATE POLICY "Gift codes viewable by involved parties" ON dlc_gift_codes
  FOR SELECT USING (purchased_by = auth.uid() OR redeemed_by = auth.uid());
```

---

## Implementation Phases

### Phase 1: Foundation (Weeks 1-2)

| Task                               | Files                             | Priority | Status |
| ---------------------------------- | --------------------------------- | -------- | ------ |
| Create DLC directory structure     | `src/dlc/*`                       | P0       | ⬜     |
| Implement DLC types and interfaces | `src/dlc/core/types.ts`           | P0       | ⬜     |
| Create DLC Manager core            | `src/dlc/core/DLCManager.ts`      | P0       | ⬜     |
| Create DLC Registry                | `src/dlc/core/DLCRegistry.ts`     | P0       | ⬜     |
| Implement License Validator        | `src/dlc/license/*`               | P0       | ⬜     |
| Implement Offline Cache            | `src/dlc/license/LicenseCache.ts` | P0       | ⬜     |
| Create DLC Context                 | `src/contexts/DLCContext.tsx`     | P0       | ⬜     |
| Database migrations (1-6)          | `supabase/migrations/*`           | P0       | ⬜     |
| Create test mode infrastructure    | `src/__tests__/dlc/*`             | P0       | ⬜     |

### Phase 2: Content Migration (Weeks 2-3)

| Task                            | Files                              | Priority | Status |
| ------------------------------- | ---------------------------------- | -------- | ------ |
| Move Positions module           | `src/dlc-modules/core/positions/*` | P0       | ⬜     |
| Move Videos module              | `src/dlc-modules/core/videos/*`    | P0       | ⬜     |
| Move Analytics module           | `src/dlc-modules/core/analytics/*` | P0       | ⬜     |
| Move Community module           | `src/dlc-modules/core/community/*` | P0       | ⬜     |
| Move Advanced module            | `src/dlc-modules/core/advanced/*`  | P0       | ⬜     |
| Create bundle configurations    | `src/dlc-modules/bundles/*`        | P0       | ⬜     |
| Create bundle manifests         | `*/manifest.json`                  | P0       | ⬜     |
| Update all imports              | Various                            | P0       | ⬜     |
| Split SexualWellness (SFW/NSFW) | Components                         | P0       | ⬜     |
| Rename SexualHealthEducation    | `MensHealthEducation.tsx`          | P1       | ⬜     |

### Phase 3: Security (Week 3)

| Task                         | Files                                   | Priority | Status |
| ---------------------------- | --------------------------------------- | -------- | ------ |
| Implement Content Encryption | `src/dlc/security/ContentEncryption.ts` | P0       | ⬜     |
| Implement Device Binding     | `src/dlc/license/DeviceBinding.ts`      | P0       | ⬜     |
| Implement Tamper Detection   | `src/dlc/security/TamperDetection.ts`   | P0       | ⬜     |
| Implement Abuse Detection    | `src/dlc/security/AbuseDetection.ts`    | P1       | ⬜     |
| Implement Secure Storage     | `src/dlc/security/SecureStorage.ts`     | P0       | ⬜     |

### Phase 4: Download System (Weeks 3-4)

| Task                        | Files                                   | Priority | Status |
| --------------------------- | --------------------------------------- | -------- | ------ |
| Create Download Manager     | `src/dlc/download/DownloadManager.ts`   | P0       | ⬜     |
| iOS-specific downloader     | `src/dlc/download/IOSDownloader.ts`     | P0       | ⬜     |
| Android-specific downloader | `src/dlc/download/AndroidDownloader.ts` | P0       | ⬜     |
| Web-specific downloader     | `src/dlc/download/WebDownloader.ts`     | P0       | ⬜     |
| Progress tracking           | `src/dlc/download/DownloadProgress.ts`  | P0       | ⬜     |
| Lazy content loading        | `src/lib/storage/lazyContentLoader.ts`  | P1       | ⬜     |
| Storage management          | `src/lib/storage/storageQuota.ts`       | P1       | ⬜     |

### Phase 5: DLC Store UI (Weeks 4-5)

| Task                    | Files                                               | Priority | Status |
| ----------------------- | --------------------------------------------------- | -------- | ------ |
| Create DLC Storefront   | `src/components/dlc-store/DLCStorefront.tsx`        | P0       | ⬜     |
| Create Package Cards    | `src/components/dlc-store/DLCPackageCard.tsx`       | P0       | ⬜     |
| Create Bundle Cards     | `src/components/dlc-store/DLCBundleCard.tsx`        | P0       | ⬜     |
| Create Preview Modal    | `src/components/dlc-store/DLCPreviewModal.tsx`      | P1       | ⬜     |
| Create Purchase Modal   | `src/components/dlc-store/DLCPurchaseModal.tsx`     | P0       | ⬜     |
| Create Age Verification | `src/components/dlc-store/AgeVerificationModal.tsx` | P0       | ⬜     |
| Create Update Warning   | `src/components/dlc-store/UpdateSourceWarning.tsx`  | P0       | ⬜     |
| Create Install Progress | `src/components/dlc-store/DLCInstallProgress.tsx`   | P0       | ⬜     |
| Update placeholders     | `src/components/placeholders/*`                     | P1       | ⬜     |

### Phase 6: Purchase & Promo System (Weeks 5-6)

| Task                      | Files                               | Priority | Status |
| ------------------------- | ----------------------------------- | -------- | ------ |
| Website API client        | `src/lib/dlc/websiteApi.ts`         | P0       | ⬜     |
| Payment API client        | `src/lib/dlc/paymentApi.ts`         | P0       | ⬜     |
| Stripe integration        | Backend/Edge Functions              | P0       | ⬜     |
| Promo Code Manager        | `src/dlc/promo/PromoCodeManager.ts` | P1       | ⬜     |
| Gift Code Manager         | `src/dlc/promo/GiftCodeManager.ts`  | P1       | ⬜     |
| Affiliate Manager         | `src/dlc/promo/AffiliateManager.ts` | P2       | ⬜     |
| Smart upgrade pricing     | DLC logic                           | P1       | ⬜     |
| Database migrations (7-9) | `supabase/migrations/*`             | P1       | ⬜     |

### Phase 7: Install & Update System (Weeks 6-7)

| Task                  | Files                                   | Priority | Status |
| --------------------- | --------------------------------------- | -------- | ------ |
| DLC Installer         | `src/dlc/install/DLCInstaller.ts`       | P0       | ⬜     |
| Content Decryptor     | `src/dlc/install/ContentDecryptor.ts`   | P0       | ⬜     |
| Integrity Checker     | `src/dlc/install/IntegrityChecker.ts`   | P0       | ⬜     |
| Module Loader         | `src/dlc/install/ModuleLoader.ts`       | P0       | ⬜     |
| Update Checker        | `src/dlc/update/UpdateChecker.ts`       | P0       | ⬜     |
| Delta Updater         | `src/dlc/update/DeltaUpdater.ts`        | P1       | ⬜     |
| Update Source Manager | `src/dlc/update/UpdateSourceManager.ts` | P0       | ⬜     |
| Version Manager       | `src/dlc/update/VersionManager.ts`      | P0       | ⬜     |

### Phase 8: App Integration (Weeks 7-8)

| Task                      | Files                              | Priority | Status |
| ------------------------- | ---------------------------------- | -------- | ------ |
| Update Index.tsx          | `src/pages/Index.tsx`              | P0       | ⬜     |
| Update Header navigation  | `src/components/Header.tsx`        | P0       | ⬜     |
| Update Settings           | `src/components/SettingsPanel.tsx` | P0       | ⬜     |
| Update feature flags      | `src/lib/featureFlags.ts`          | P0       | ⬜     |
| Conditional route loading | Router config                      | P0       | ⬜     |
| DLC Management UI         | `src/components/dlc-management/*`  | P1       | ⬜     |
| Update Manager UI         | `src/components/update-manager/*`  | P1       | ⬜     |

### Phase 9: Analytics & Gamification (Weeks 8-9)

| Task                        | Files                                            | Priority | Status |
| --------------------------- | ------------------------------------------------ | -------- | ------ |
| DLC Analytics               | `src/lib/analytics/dlcAnalytics.ts`              | P1       | ⬜     |
| Conversion Tracking         | `src/lib/analytics/conversionTracking.ts`        | P1       | ⬜     |
| A/B Testing Framework       | `src/lib/analytics/abTesting.ts`                 | P1       | ⬜     |
| Achievement System          | `src/components/gamification/*`                  | P2       | ⬜     |
| Streak Tracking             | `src/hooks/gamification/*`                       | P2       | ⬜     |
| Onboarding Tour             | `src/components/gamification/OnboardingTour.tsx` | P2       | ⬜     |
| Database migrations (10-11) | `supabase/migrations/*`                          | P1       | ⬜     |

### Phase 10: Internationalization (Week 9)

| Task                 | Files                        | Priority | Status |
| -------------------- | ---------------------------- | -------- | ------ |
| Translation system   | `src/lib/i18n/*`             | P2       | ⬜     |
| Regional pricing     | `src/lib/i18n/currencies.ts` | P2       | ⬜     |
| Language files (10+) | `dlc-translations/*.json`    | P2       | ⬜     |

### Phase 11: Support Integration (Week 10)

| Task                   | Files                                              | Priority | Status |
| ---------------------- | -------------------------------------------------- | -------- | ------ |
| Diagnostics tool       | `src/components/support/DLCSupportDiagnostics.tsx` | P1       | ⬜     |
| Troubleshooting wizard | `src/components/support/TroubleshootingWizard.tsx` | P1       | ⬜     |
| Refund request flow    | `src/components/support/RefundRequest.tsx`         | P1       | ⬜     |
| Support libraries      | `src/lib/support/*`                                | P1       | ⬜     |

### Phase 12: Build System (Weeks 10-11)

| Task                        | Files                              | Priority | Status |
| --------------------------- | ---------------------------------- | -------- | ------ |
| Update Vite config          | `vite.config.ts`                   | P0       | ⬜     |
| Create DLC build config     | `vite.dlc.config.ts`               | P0       | ⬜     |
| DLC packaging script        | `scripts/package-dlc.js`           | P0       | ⬜     |
| Content encryption script   | `scripts/encrypt-dlc-content.js`   | P0       | ⬜     |
| Checksum generation         | `scripts/generate-checksums.js`    | P0       | ⬜     |
| Complete bundle build       | `scripts/build-complete-bundle.js` | P1       | ⬜     |
| Update package.json scripts | `package.json`                     | P0       | ⬜     |

### Phase 13: Testing & QA (Weeks 11-13)

| Task                                | Priority | Status |
| ----------------------------------- | -------- | ------ |
| Unit tests for DLC core             | P0       | ⬜     |
| Unit tests for license system       | P0       | ⬜     |
| Unit tests for download system      | P0       | ⬜     |
| Integration tests                   | P0       | ⬜     |
| E2E purchase flow tests             | P0       | ⬜     |
| E2E install flow tests              | P0       | ⬜     |
| E2E upgrade flow tests              | P0       | ⬜     |
| Offline mode testing                | P0       | ⬜     |
| Platform-specific testing (iOS)     | P0       | ⬜     |
| Platform-specific testing (Android) | P0       | ⬜     |
| Security audit                      | P0       | ⬜     |
| Performance testing                 | P1       | ⬜     |
| Rollback testing                    | P0       | ⬜     |
| Store compliance review             | P0       | ⬜     |

---

## Summary

### Total Files

| Category            | Count    |
| ------------------- | -------- |
| Files to CREATE     | 120+     |
| Files to MODIFY     | 15       |
| Files to MOVE       | 16       |
| Database Migrations | 11       |
| Build Scripts       | 6        |
| Test Files          | 15+      |
| **TOTAL**           | **180+** |

### Timeline

| Phase                    | Duration        | Weeks |
| ------------------------ | --------------- | ----- |
| Foundation               | 2 weeks         | 1-2   |
| Content Migration        | 1.5 weeks       | 2-3   |
| Security                 | 1 week          | 3     |
| Download System          | 1.5 weeks       | 3-4   |
| DLC Store UI             | 2 weeks         | 4-5   |
| Purchase & Promo         | 1.5 weeks       | 5-6   |
| Install & Update         | 1.5 weeks       | 6-7   |
| App Integration          | 1.5 weeks       | 7-8   |
| Analytics & Gamification | 1 week          | 8-9   |
| Internationalization     | 1 week          | 9     |
| Support Integration      | 0.5 weeks       | 10    |
| Build System             | 1 week          | 10-11 |
| Testing & QA             | 2 weeks         | 11-13 |
| **TOTAL**                | **12-13 weeks** |       |

---

## Status: READY FOR IMPLEMENTATION

**Backup Branch**: `backup/main-pre-sfw-nsfw-modularization-20251209`

**Next Step**: Begin Phase 1 - Foundation

Reply **"go"** to begin implementation.
