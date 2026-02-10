# SFW/NSFW Modularization Plan

## Executive Summary

This document outlines a comprehensive plan to make the main branch **Safe For Work (SFW)** by default, while providing an optional **NSFW (Not Safe For Work) DLC add-on module** that users can download and install to upgrade their experience.

---

## Current State Analysis

### Branch Structure

| Branch                                             | Purpose                    | Status                          |
| -------------------------------------------------- | -------------------------- | ------------------------------- |
| `main`                                             | Primary development branch | Contains mixed SFW/NSFW content |
| `NSFW-Visionary-Scanner`                           | Full NSFW implementation   | 2 commits, comprehensive NSFW   |
| `visionary-scanner-NSFW`                           | Phased NSFW implementation | 15+ commits, detailed phases    |
| `cursor/build-nsfw-addon-modules-branch-*`         | DLC/addon work             | Experimental                    |
| `cursor/package-nsfw-content-as-optional-add-on-*` | Addon packaging            | Experimental                    |

### Current NSFW Content in Main Branch

#### Libraries (src/lib/)

| File                             | Content Type                                                                                 | Action Required                                |
| -------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------- |
| `nsfwAdvancedFeatures.ts`        | PornMD integration, multi-camera recording, intimate dates, seductive AI chat, sex positions | Move to DLC module                             |
| `nsfwCommunityForum.ts`          | NSFW community features                                                                      | Move to DLC module                             |
| `nsfwSexualWellnessAnalytics.ts` | Sexual wellness analytics                                                                    | Move to DLC module                             |
| `nsfwVideoContent.ts`            | NSFW video content                                                                           | Move to DLC module                             |
| `sexualWellness.ts`              | Sexual wellness tracking                                                                     | Partial - some can stay as SFW health tracking |
| `sexualHealthEducation.ts`       | Sexual health education                                                                      | Keep as SFW (medical/educational)              |
| `enhancedPositionsGallery.ts`    | Positions gallery features                                                                   | Move to DLC module                             |

#### Components (src/components/)

| Component                         | Content Type      | Action Required                   |
| --------------------------------- | ----------------- | --------------------------------- |
| `NSFWAdvancedFeatures.tsx`        | NSFW features UI  | Move to DLC module                |
| `NSFWVideoContent.tsx`            | NSFW video UI     | Move to DLC module                |
| `NSFWCommunityForum.tsx`          | NSFW forum UI     | Move to DLC module                |
| `NSFWSexualWellnessAnalytics.tsx` | NSFW analytics UI | Move to DLC module                |
| `PositionsGallery.tsx`            | Positions gallery | Move to DLC module                |
| `PositionDetailView.tsx`          | Position details  | Move to DLC module                |
| `SexualWellnessTracking.tsx`      | Wellness tracking | Modify - remove explicit content  |
| `SexualHealthEducation.tsx`       | Health education  | Keep as SFW (medical/educational) |

#### Data (src/data/)

| File               | Content Type                   | Action Required    |
| ------------------ | ------------------------------ | ------------------ |
| `positionsData.ts` | Explicit position descriptions | Move to DLC module |

#### Existing Infrastructure

| Component              | Status    | Notes                                        |
| ---------------------- | --------- | -------------------------------------------- |
| `featureFlags.ts`      | ✅ Exists | SFW/NSFW/Hybrid modes already implemented    |
| `dlcManager.ts`        | ⚠️ Stub   | License management needs full implementation |
| `enhancedDLCSystem.ts` | ⚠️ Stub   | DLC packs/bundles need full implementation   |
| `dlcContentLoader.ts`  | ⚠️ Stub   | Content loading needs implementation         |
| `useDLCContent.ts`     | ✅ Exists | Hook for React components                    |
| Build scripts          | ✅ Exists | `build:sfw`, `build:nsfw`, `build:hybrid`    |

---

## Architecture Plan

### 1. SFW Base Application (Main Branch)

The SFW version will include:

- ✅ Scanner features (measurements, health tracking)
- ✅ Health diary and journaling
- ✅ General health education
- ✅ Medical educational content
- ✅ Community forum (SFW topics only)
- ✅ Video library (educational, SFW)
- ✅ AI health assistant
- ✅ Progress tracking
- ✅ Prostate/testicular health (medical)
- ✅ Healthcare provider portal
- ✅ DLC Store/Marketplace UI
- ✅ Account management

### 2. NSFW DLC Module

The NSFW DLC will be a **separate downloadable package** containing:

- 📦 Positions Gallery (100+ positions)
- 📦 NSFW Video Content
- 📦 NSFW Community Forum
- 📦 Sexual Wellness Analytics (explicit)
- 📦 NSFW Advanced Features (PornMD, intimate dates, seductive AI)
- 📦 Multi-camera recording
- 📦 Partner sync features
- 📦 Adult content marketplace access

### 3. DLC Distribution Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        SFW Base App                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │   Scanner   │  │   Health    │  │    DLC Store UI         │  │
│  │   Features  │  │   Diary     │  │  (Browse/Purchase/      │  │
│  │             │  │             │  │   Download NSFW)        │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Education  │  │  Community  │  │    DLC Manager          │  │
│  │  (SFW)      │  │  (SFW)      │  │  (License/Install)      │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ Download & Install
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NSFW DLC Module                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │  Positions  │  │   NSFW      │  │    NSFW Advanced        │  │
│  │   Gallery   │  │   Videos    │  │    Features             │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐  │
│  │    NSFW     │  │   Sexual    │  │    Adult Content        │  │
│  │   Forum     │  │  Wellness   │  │    Marketplace          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 1: Content Segregation (Week 1-2)

#### 1.1 Create NSFW Module Directory Structure

```
src/
├── nsfw-dlc/                    # NEW: NSFW DLC module
│   ├── components/              # NSFW React components
│   │   ├── NSFWAdvancedFeatures.tsx
│   │   ├── NSFWVideoContent.tsx
│   │   ├── NSFWCommunityForum.tsx
│   │   ├── NSFWSexualWellnessAnalytics.tsx
│   │   ├── PositionsGallery.tsx
│   │   ├── PositionDetailView.tsx
│   │   └── index.ts
│   ├── lib/                     # NSFW business logic
│   │   ├── nsfwAdvancedFeatures.ts
│   │   ├── nsfwVideoContent.ts
│   │   ├── nsfwCommunityForum.ts
│   │   ├── nsfwSexualWellnessAnalytics.ts
│   │   ├── enhancedPositionsGallery.ts
│   │   └── index.ts
│   ├── data/                    # NSFW data
│   │   ├── positionsData.ts
│   │   └── index.ts
│   ├── hooks/                   # NSFW-specific hooks
│   │   └── useNSFWContent.ts
│   ├── manifest.json            # DLC metadata
│   └── index.ts                 # Module entry point
├── components/                  # SFW components remain
├── lib/                         # SFW libraries remain
└── ...
```

#### 1.2 Move NSFW Files

- Move all NSFW components to `src/nsfw-dlc/components/`
- Move all NSFW libraries to `src/nsfw-dlc/lib/`
- Move positions data to `src/nsfw-dlc/data/`
- Update all imports within moved files

#### 1.3 Create DLC Manifest

```json
{
  "id": "nsfw-adult-content",
  "name": "Adult Content Pack",
  "version": "1.0.0",
  "description": "Unlock adult content including positions gallery, NSFW videos, intimate features, and more.",
  "contentRating": "18+",
  "size": "~50MB",
  "features": [
    "positions_gallery",
    "nsfw_videos",
    "nsfw_community",
    "sexual_wellness_analytics",
    "advanced_nsfw_features",
    "adult_marketplace"
  ],
  "price": {
    "one_time": 29.99,
    "subscription": 9.99
  },
  "dependencies": {
    "base_app_version": ">=1.0.0"
  }
}
```

---

### Phase 2: DLC Infrastructure (Week 2-3)

#### 2.1 Implement DLC Manager

- **License validation** - Server-side verification
- **Content download** - Secure download with integrity checks
- **Installation** - Dynamic module loading
- **Activation** - License key entry and validation
- **Deactivation** - Uninstall/disable DLC

#### 2.2 DLC Database Schema

```sql
-- DLC Packages
CREATE TABLE dlc_packages (
  id UUID PRIMARY KEY,
  package_name TEXT NOT NULL,
  package_slug TEXT UNIQUE NOT NULL,
  description TEXT,
  version TEXT NOT NULL,
  content_rating TEXT,
  price_one_time DECIMAL(10,2),
  price_subscription DECIMAL(10,2),
  download_url TEXT,
  checksum TEXT,
  size_bytes BIGINT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User DLC Licenses
CREATE TABLE dlc_licenses (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  package_id UUID REFERENCES dlc_packages(id),
  license_key TEXT UNIQUE NOT NULL,
  license_type TEXT CHECK (license_type IN ('one_time', 'subscription')),
  purchase_date TIMESTAMPTZ DEFAULT NOW(),
  expiration_date TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  device_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- DLC Downloads
CREATE TABLE dlc_downloads (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  package_id UUID REFERENCES dlc_packages(id),
  license_id UUID REFERENCES dlc_licenses(id),
  download_status TEXT,
  downloaded_at TIMESTAMPTZ,
  installed_at TIMESTAMPTZ,
  version TEXT
);
```

#### 2.3 Implement Stripe Integration for DLC

- One-time purchase flow
- Subscription flow
- License generation on successful payment
- Refund handling

---

### Phase 3: Dynamic Loading System (Week 3-4)

#### 3.1 Create DLC Loader

```typescript
// src/lib/dlcLoader.ts
export interface DLCModule {
  id: string;
  name: string;
  version: string;
  components: Record<string, React.ComponentType>;
  routes: RouteConfig[];
  navigationItems: NavigationItem[];
}

export async function loadDLCModule(packageId: string): Promise<DLCModule | null> {
  // 1. Verify license
  // 2. Check if downloaded
  // 3. Dynamically import module
  // 4. Return module interface
}

export async function unloadDLCModule(packageId: string): Promise<void> {
  // Clean up loaded module
}
```

#### 3.2 Update App Router

- Conditionally add NSFW routes when DLC is loaded
- Guard NSFW routes with license checks
- Lazy-load NSFW components

#### 3.3 Update Navigation

- Conditionally show NSFW menu items
- Show DLC store/upgrade prompts for locked content
- Badge indicators for available DLC

---

### Phase 4: SFW Cleanup (Week 4)

#### 4.1 Update Index.tsx

- Remove direct NSFW component imports
- Add conditional rendering based on DLC status
- Add DLC upsell placeholders

#### 4.2 Update Feature Flags

```typescript
// Enhanced feature flags
export const isNSFWAvailable = async (): Promise<boolean> => {
  const appVersion = getAppVersion();

  // SFW build - check for DLC
  if (appVersion === "sfw") {
    return await isDLCInstalled("nsfw-adult-content");
  }

  // NSFW build - always available
  if (appVersion === "nsfw") {
    return true;
  }

  // Hybrid - check DLC
  if (appVersion === "hybrid") {
    return await hasDLCLicense("nsfw-adult-content");
  }

  return false;
};
```

#### 4.3 Create SFW Placeholder Components

- "Unlock with DLC" cards for locked features
- Feature preview without explicit content
- Clear upgrade CTAs

---

### Phase 5: Build System Updates (Week 4-5)

#### 5.1 Update Vite Configuration

```typescript
// vite.config.ts
export default defineConfig(({ mode }) => {
  const appVersion = process.env.VITE_APP_VERSION || "sfw";

  return {
    // ... existing config
    define: {
      __APP_VERSION__: JSON.stringify(appVersion),
    },
    build: {
      rollupOptions: {
        // Exclude NSFW module in SFW builds
        external: appVersion === "sfw" ? [/^\.\/nsfw-dlc/] : [],
      },
    },
  };
});
```

#### 5.2 Create Separate Build Targets

```json
{
  "scripts": {
    "build:sfw": "cross-env VITE_APP_VERSION=sfw vite build",
    "build:nsfw": "cross-env VITE_APP_VERSION=nsfw vite build",
    "build:dlc": "vite build --config vite.dlc.config.ts",
    "package:dlc": "node scripts/package-dlc.js"
  }
}
```

#### 5.3 DLC Packaging Script

- Bundle NSFW module separately
- Generate checksum
- Create downloadable package
- Upload to CDN/storage

---

### Phase 6: DLC Store UI (Week 5)

#### 6.1 Create DLC Store Component

```typescript
// src/components/DLCStore.tsx
export const DLCStore = () => {
  const { availablePacks, ownedPacks, isLoading } = useDLCContent();

  return (
    <div>
      <h2>Content Packs</h2>

      {/* Available Packs */}
      <section>
        <h3>Available for Purchase</h3>
        {availablePacks.map(pack => (
          <DLCPackCard
            key={pack.id}
            pack={pack}
            onPurchase={handlePurchase}
            onPreview={handlePreview}
          />
        ))}
      </section>

      {/* Owned Packs */}
      <section>
        <h3>Your Packs</h3>
        {ownedPacks.map(pack => (
          <OwnedDLCCard
            key={pack.id}
            pack={pack}
            onInstall={handleInstall}
            onUninstall={handleUninstall}
          />
        ))}
      </section>
    </div>
  );
};
```

#### 6.2 Purchase Flow

1. User browses DLC store
2. Clicks "Purchase" on NSFW pack
3. Age verification modal
4. Stripe checkout
5. License generated and stored
6. Download begins
7. Installation completes
8. NSFW features unlocked

---

### Phase 7: Testing & Validation (Week 5-6)

#### 7.1 Test Scenarios

| Scenario                                       | Expected Result                               |
| ---------------------------------------------- | --------------------------------------------- |
| SFW build without DLC                          | No NSFW content visible, DLC store accessible |
| SFW build with DLC purchased but not installed | DLC store shows "Install" option              |
| SFW build with DLC installed                   | NSFW content accessible                       |
| NSFW build                                     | All content accessible, no DLC required       |
| Hybrid build without DLC                       | SFW content only, DLC prompts shown           |
| Hybrid build with DLC                          | Full content accessible                       |
| License expiration                             | NSFW content locked, renewal prompt           |
| DLC uninstall                                  | NSFW content removed, data preserved          |

#### 7.2 Store Compliance

- App Store (iOS) - SFW only, no NSFW references
- Play Store (Android) - SFW only, DLC via website
- Direct download - Full NSFW available

---

## File Changes Summary

### Files to MOVE to `src/nsfw-dlc/`

```
src/lib/nsfwAdvancedFeatures.ts → src/nsfw-dlc/lib/
src/lib/nsfwVideoContent.ts → src/nsfw-dlc/lib/
src/lib/nsfwCommunityForum.ts → src/nsfw-dlc/lib/
src/lib/nsfwSexualWellnessAnalytics.ts → src/nsfw-dlc/lib/
src/lib/enhancedPositionsGallery.ts → src/nsfw-dlc/lib/

src/components/NSFWAdvancedFeatures.tsx → src/nsfw-dlc/components/
src/components/NSFWVideoContent.tsx → src/nsfw-dlc/components/
src/components/NSFWCommunityForum.tsx → src/nsfw-dlc/components/
src/components/NSFWSexualWellnessAnalytics.tsx → src/nsfw-dlc/components/
src/components/PositionsGallery.tsx → src/nsfw-dlc/components/
src/components/PositionDetailView.tsx → src/nsfw-dlc/components/

src/data/positionsData.ts → src/nsfw-dlc/data/
```

### Files to MODIFY

```
src/pages/Index.tsx - Remove NSFW imports, add DLC conditional loading
src/components/Header.tsx - Conditionally show NSFW menu items
src/lib/featureFlags.ts - Add DLC-aware feature checks
src/lib/dlcManager.ts - Full implementation
src/lib/enhancedDLCSystem.ts - Full implementation
src/hooks/useDLCContent.ts - Add installation/download hooks
```

### Files to CREATE

```
src/nsfw-dlc/manifest.json
src/nsfw-dlc/index.ts
src/nsfw-dlc/components/index.ts
src/nsfw-dlc/lib/index.ts
src/nsfw-dlc/data/index.ts
src/lib/dlcLoader.ts
src/lib/dlcInstaller.ts
src/components/DLCStore.tsx
src/components/DLCPackCard.tsx
src/components/DLCUnlockPrompt.tsx
vite.dlc.config.ts
scripts/package-dlc.js
supabase/migrations/XXX_dlc_tables.sql
```

---

## Risk Assessment

| Risk                    | Impact | Mitigation                                |
| ----------------------- | ------ | ----------------------------------------- |
| App Store rejection     | High   | Ensure SFW build has zero NSFW references |
| DLC piracy              | Medium | Server-side license validation, checksums |
| Breaking existing users | High   | Migration path, data preservation         |
| Performance degradation | Medium | Lazy loading, code splitting              |
| Complex maintenance     | Medium | Clear module boundaries, documentation    |

---

## Success Criteria

- [ ] SFW build passes App Store review
- [ ] SFW build contains zero NSFW content
- [ ] DLC purchase flow works end-to-end
- [ ] DLC download and installation works
- [ ] NSFW content only accessible with valid license
- [ ] License expiration properly locks content
- [ ] All existing functionality preserved
- [ ] No breaking changes for current users
- [ ] Build times remain acceptable
- [ ] Bundle sizes optimized

---

## Timeline Summary

| Week | Phase               | Deliverables                     |
| ---- | ------------------- | -------------------------------- |
| 1-2  | Content Segregation | NSFW module created, files moved |
| 2-3  | DLC Infrastructure  | License system, database schema  |
| 3-4  | Dynamic Loading     | Module loader, route guards      |
| 4    | SFW Cleanup         | Index.tsx updated, placeholders  |
| 4-5  | Build System        | Separate builds, DLC packaging   |
| 5    | DLC Store           | Store UI, purchase flow          |
| 5-6  | Testing             | Full test coverage               |

**Total Estimated Time: 6 weeks**

---

## Approval Required

Please confirm this plan before implementation begins:

1. ✅ Approve the overall architecture
2. ✅ Approve the file reorganization
3. ✅ Approve the DLC pricing model
4. ✅ Approve the timeline

---

**Document Version**: 1.0  
**Created**: 2024-12-09  
**Status**: AWAITING APPROVAL
