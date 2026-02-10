# DLC Add-On Modular System - Complete Implementation Guide

## 📋 Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Required Files](#required-files)
4. [Database Setup](#database-setup)
5. [Implementation Steps](#implementation-steps)
6. [Creating DLC Content](#creating-dlc-content)
7. [Adding Content to App](#adding-content-to-app)
8. [Testing](#testing)
9. [Deployment](#deployment)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Overview

This guide provides step-by-step instructions for implementing the DLC (Downloadable Content) add-on modular system to your repository's main branch. The DLC system allows users to purchase and unlock premium content, features, and functionality.

**What You'll Learn**:
- How to set up the DLC system
- What files are needed
- How to create DLC content
- How to integrate content into the app
- How to test and deploy

---

## ✅ Prerequisites

### Required Software

1. **Node.js** (v18+)
   ```powershell
   node --version
   ```

2. **npm** or **yarn**
   ```powershell
   npm --version
   ```

3. **Git**
   ```powershell
   git --version
   ```

4. **Supabase Account**
   - Project created
   - API keys available
   - Database access

5. **Stripe Account** (for payments)
   - API keys
   - Webhook endpoint configured

### Required Knowledge

- React/TypeScript basics
- Supabase basics
- SQL basics
- Git workflow

---

## 📁 Required Files

### Core DLC Files

The following files are required for the DLC system:

#### 1. Database Migrations

**Location**: `supabase/migrations/`

**Files**:
- `20251206000000_dlc_licenses_and_pricing.sql` - Core DLC licenses and pricing
- `20251207000024_enhanced_dlc_system.sql` - Enhanced DLC system (packs, bundles, purchases)

**Purpose**: Creates all database tables, indexes, and RLS policies

---

#### 2. Library Files

**Location**: `src/lib/`

**Files**:
- `dlcManager.ts` - Core DLC license management
- `enhancedDLCSystem.ts` - Enhanced DLC system API functions

**Purpose**: Provides functions for DLC operations

**Key Functions**:
- `hasDLCLicense()` - Check if user has active license
- `activateDLCLicense()` - Activate a license key
- `getDLCLicense()` - Get current license
- `checkDLCUpdates()` - Check for content updates
- `downloadDLCContent()` - Download content package
- `getDLCPacks()` - Get available DLC packs
- `getDLCBundles()` - Get available bundles
- `purchaseDLC()` - Purchase a DLC pack
- `getDLCPurchases()` - Get user's purchases
- `getDownloadQueue()` - Get download queue
- `getDLCUpdates()` - Get available updates

---

#### 3. React Components

**Location**: `src/components/`

**Files**:
- `EnhancedDLCSystem.tsx` - Main DLC system UI
- `DLCUnlock.tsx` - License activation component
- `DLCStatus.tsx` - DLC status display

**Purpose**: User interface for DLC features

---

#### 4. Edge Functions

**Location**: `supabase/functions/`

**Files**:
- `get-dlc-content/index.ts` - Get DLC content package
- `check-dlc-updates/index.ts` - Check for updates
- `verify-dlc-license/index.ts` - Verify license keys

**Purpose**: Server-side DLC operations

---

#### 5. Configuration Files

**Location**: Root directory

**Files**:
- `package.json` - Dependencies and scripts
- `.env` - Environment variables
- `vite.config.ts` - Build configuration

---

## 🗄️ Database Setup

### Step 1: Run Database Migrations

**Option A: Using Supabase CLI Migrations (Recommended)**

```powershell
# Start local Supabase services (if needed)
npm run db:start

# Apply migrations from supabase/migrations/
npm run db:push
```

Then verify all required DLC tables and policies were created.

**Option B: Dashboard SQL (Manual)**

1. Open Supabase Dashboard
2. Go to SQL Editor
3. Run the needed files from `supabase/migrations/` in order
4. Verify all tables are created

### Step 2: Verify Tables

Check that these tables exist:
- `dlc_licenses`
- `dlc_packs`
- `dlc_bundles`
- `dlc_purchases`
- `dlc_download_queue`
- `dlc_content_library`
- `dlc_updates`
- `dlc_backup_status`
- `dlc_streaming_sessions`
- `pricing_tiers`
- `dlc_content_packages`

### Step 3: Verify RLS Policies

All tables should have Row Level Security enabled with appropriate policies.

---

## 🚀 Implementation Steps

### Step 1: Clone/Copy Required Files

If files don't exist, copy them from the NSFW branch:

```powershell
# Ensure you're on main branch
git checkout main

# Create necessary directories
mkdir -p src/lib
mkdir -p src/components
mkdir -p supabase/migrations
mkdir -p supabase/functions/get-dlc-content
mkdir -p supabase/functions/check-dlc-updates
mkdir -p supabase/functions/verify-dlc-license
```

**Files to Copy**:

1. **Database Migrations**:
   - Copy `supabase/migrations/20251206000000_dlc_licenses_and_pricing.sql`
   - Copy `supabase/migrations/20251207000024_enhanced_dlc_system.sql`

2. **Library Files**:
   - Copy `src/lib/dlcManager.ts`
   - Copy `src/lib/enhancedDLCSystem.ts`

3. **Components**:
   - Copy `src/components/EnhancedDLCSystem.tsx`
   - Copy `src/components/DLCUnlock.tsx`
   - Copy `src/components/DLCStatus.tsx`

4. **Edge Functions**:
   - Copy `supabase/functions/get-dlc-content/index.ts`
   - Copy `supabase/functions/check-dlc-updates/index.ts`
   - Copy `supabase/functions/verify-dlc-license/index.ts`

---

### Step 2: Install Dependencies

```powershell
# Install all dependencies
npm install

# Verify key dependencies are installed
npm list @supabase/supabase-js
npm list sonner
npm list lucide-react
```

**Required Dependencies** (should already be in package.json):
- `@supabase/supabase-js` - Supabase client
- `sonner` - Toast notifications
- `lucide-react` - Icons
- `react-router-dom` - Routing

---

### Step 3: Configure Environment Variables

Add to `.env` file:

```env
# Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Stripe (for payments)
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret

# DLC Configuration
VITE_DLC_ENABLED=true
VITE_DLC_CONTENT_URL=https://your-cdn-url.com/dlc
```

---

### Step 4: Add DLC Route to App

**File**: `src/pages/Index.tsx` or `src/App.tsx`

Add DLC route:

```typescript
import { EnhancedDLCSystem } from '@/components/EnhancedDLCSystem'

// In your routes
<Route path="/dlc" element={<EnhancedDLCSystem />} />
```

Or add to navigation:

```typescript
// In Header.tsx or navigation component
<NavLink to="/dlc">DLC Store</NavLink>
```

---

### Step 5: Deploy Edge Functions

```powershell
# Deploy all Edge Functions
npm run deploy:functions

# Or deploy individually
supabase functions deploy get-dlc-content
supabase functions deploy check-dlc-updates
supabase functions deploy verify-dlc-license
```

---

## 🎨 Creating DLC Content

### Step 1: Prepare Content Files

**Content Types**:
- **Positions**: JSON files with position data
- **Videos**: Video files (MP4, WebM)
- **Images**: Image files (JPEG, PNG, WebP)
- **Education**: Markdown/HTML content
- **3D Models**: 3D model files (OBJ, GLTF)

**Organization**:
```
dlc-content/
├── positions/
│   ├── advanced-positions-pack/
│   │   ├── positions.json
│   │   ├── images/
│   │   └── videos/
│   └── kinky-positions-pack/
├── videos/
│   ├── tutorial-series/
│   └── expert-interviews/
└── education/
    └── courses/
```

---

### Step 2: Upload Content to Storage

**Using Supabase Storage**:

```powershell
# Upload content files
# Use Supabase Dashboard > Storage or API
```

**Storage Buckets**:
- `dlc-content` - Main DLC content bucket
- `dlc-previews` - Preview images/videos

**Structure**:
```
dlc-content/
  {pack-id}/
    content/
      positions.json
      images/
      videos/
    previews/
      preview.jpg
      preview.mp4
```

---

### Step 3: Create DLC Pack in Database

**Method 1: Using SQL**

```sql
INSERT INTO dlc_packs (
  pack_name,
  description,
  pack_type,
  content_items,
  item_count,
  price,
  currency,
  preview_images,
  preview_video_url,
  tags,
  category,
  difficulty_level,
  is_active,
  is_featured,
  release_date
) VALUES (
  'Advanced Positions Pack',
  'A collection of 20 advanced sexual positions with detailed instructions and visual guides.',
  'positions',
  '[
    {
      "id": "pos-001",
      "name": "Advanced Position 1",
      "description": "...",
      "image_url": "https://...",
      "video_url": "https://...",
      "difficulty": "hard",
      "instructions": ["Step 1", "Step 2"]
    }
  ]'::jsonb,
  20,
  9.99,
  'USD',
  ARRAY['https://.../preview1.jpg', 'https://.../preview2.jpg'],
  'https://.../preview.mp4',
  ARRAY['advanced', 'positions', 'kinky'],
  'positions',
  'advanced',
  true,
  true,
  CURRENT_DATE
);
```

**Method 2: Using Admin Panel** (if created)

Create a custom admin interface to manage DLC packs.

**Method 3: Using API/Script**

Create a TypeScript script:

```typescript
// scripts/create-dlc-pack.ts
import { supabase } from '@/integrations/supabase/client'

async function createDLCPack() {
  const { data, error } = await supabase
    .from('dlc_packs')
    .insert({
      pack_name: 'Advanced Positions Pack',
      description: '...',
      pack_type: 'positions',
      content_items: [...], // Your content items
      item_count: 20,
      price: 9.99,
      currency: 'USD',
      // ... other fields
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating DLC pack:', error)
  } else {
    console.log('DLC pack created:', data)
  }
}
```

---

### Step 4: Create Content Items Structure

**For Positions Pack**:

```json
{
  "content_items": [
    {
      "id": "pos-001",
      "name": "Advanced Position Name",
      "description": "Detailed description",
      "category": "advanced",
      "difficulty": "hard",
      "instructions": [
        "Step 1: Description",
        "Step 2: Description"
      ],
      "tips": [
        "Tip 1",
        "Tip 2"
      ],
      "image_url": "https://storage.supabase.co/.../image.jpg",
      "video_url": "https://storage.supabase.co/.../video.mp4",
      "gif_url": "https://storage.supabase.co/.../demo.gif",
      "metadata": {
        "duration_minutes": 5,
        "comfort_level": "medium",
        "flexibility_required": "high"
      }
    }
  ]
}
```

**For Video Pack**:

```json
{
  "content_items": [
    {
      "id": "video-001",
      "title": "Video Title",
      "description": "Video description",
      "category": "tutorial",
      "video_url_sd": "https://.../video-sd.mp4",
      "video_url_hd": "https://.../video-hd.mp4",
      "video_url_4k": "https://.../video-4k.mp4",
      "thumbnail_url": "https://.../thumbnail.jpg",
      "duration_seconds": 600,
      "tags": ["tutorial", "beginner"],
      "metadata": {
        "instructor": "Expert Name",
        "language": "en",
        "subtitles_available": true
      }
    }
  ]
}
```

**For Education Pack**:

```json
{
  "content_items": [
    {
      "id": "course-001",
      "title": "Course Title",
      "description": "Course description",
      "category": "education",
      "lessons": [
        {
          "id": "lesson-001",
          "title": "Lesson Title",
          "content": "Markdown or HTML content",
          "video_url": "https://...",
          "duration_minutes": 15
        }
      ],
      "total_duration_minutes": 120,
      "certificate_available": true
    }
  ]
}
```

---

### Step 5: Upload Preview Content

**Preview Images**:
- Upload to `dlc-previews` bucket
- Recommended: 1920x1080 or 1280x720
- Formats: JPEG, PNG, WebP

**Preview Videos**:
- Upload to `dlc-previews` bucket
- Recommended: 30-60 seconds
- Formats: MP4, WebM
- Quality: 720p minimum

**Update Pack with Preview URLs**:

```sql
UPDATE dlc_packs
SET 
  preview_images = ARRAY[
    'https://storage.supabase.co/.../preview1.jpg',
    'https://storage.supabase.co/.../preview2.jpg'
  ],
  preview_video_url = 'https://storage.supabase.co/.../preview.mp4',
  preview_description = 'Watch this preview to see what''s included...'
WHERE id = 'pack-id';
```

---

## 🔌 Adding Content to App

### Step 1: Integrate DLC Check in Components

**Example: Positions Library Component**

```typescript
// src/components/PositionsLibrary.tsx
import { useEffect, useState } from 'react'
import { getDLCPurchases } from '@/lib/enhancedDLCSystem'
import { hasDLCLicense } from '@/lib/dlcManager'

export const PositionsLibrary = () => {
  const [hasDLC, setHasDLC] = useState(false)
  const [purchasedPacks, setPurchasedPacks] = useState([])

  useEffect(() => {
    checkDLCAccess()
  }, [])

  const checkDLCAccess = async () => {
    const hasLicense = await hasDLCLicense()
    setHasDLC(hasLicense)
    
    if (hasLicense) {
      const purchases = await getDLCPurchases()
      const positionPacks = purchases.filter(p => 
        p.pack_type === 'positions'
      )
      setPurchasedPacks(positionPacks)
    }
  }

  // Load DLC positions if user has access
  const loadDLCPositions = async () => {
    if (!hasDLC) return []

    const positions = []
    for (const purchase of purchasedPacks) {
      // Fetch pack content
      const { data: pack } = await supabase
        .from('dlc_packs')
        .select('content_items')
        .eq('id', purchase.pack_id)
        .single()

      if (pack?.content_items) {
        positions.push(...pack.content_items)
      }
    }
    return positions
  }

  // Render positions (base + DLC)
  return (
    <div>
      {/* Base positions */}
      <BasePositions />
      
      {/* DLC positions */}
      {hasDLC && <DLCPositions packs={purchasedPacks} />}
      
      {/* Upgrade prompt if no DLC */}
      {!hasDLC && <UpgradePrompt />}
    </div>
  )
}
```

---

### Step 2: Create Content Loader Functions

**File**: `src/lib/dlcContentLoader.ts`

```typescript
import { supabase } from '@/integrations/supabase/client'
import { getDLCPurchases } from './enhancedDLCSystem'
import { hasDLCLicense } from './dlcManager'

export interface DLCPosition {
  id: string
  name: string
  description: string
  category: string
  difficulty: string
  instructions: string[]
  tips: string[]
  image_url: string
  video_url?: string
  gif_url?: string
}

export async function loadDLCPositions(): Promise<DLCPosition[]> {
  const hasLicense = await hasDLCLicense()
  if (!hasLicense) {
    return []
  }

  const purchases = await getDLCPurchases()
  const positionPacks = purchases.filter(p => 
    p.pack_type === 'positions'
  )

  const allPositions: DLCPosition[] = []

  for (const purchase of positionPacks) {
    const { data: pack, error } = await supabase
      .from('dlc_packs')
      .select('content_items')
      .eq('id', purchase.pack_id)
      .single()

    if (error || !pack) continue

    const positions = pack.content_items as DLCPosition[]
    allPositions.push(...positions)
  }

  return allPositions
}

export async function loadDLCVideos(): Promise<any[]> {
  // Similar implementation for videos
}

export async function loadDLCEducation(): Promise<any[]> {
  // Similar implementation for education
}
```

---

### Step 3: Update Existing Components to Use DLC Content

**Example: Update Positions Component**

```typescript
// src/components/PositionsLibrary.tsx
import { loadDLCPositions } from '@/lib/dlcContentLoader'
import { getBasePositions } from '@/lib/positions'

export const PositionsLibrary = () => {
  const [positions, setPositions] = useState([])

  useEffect(() => {
    loadAllPositions()
  }, [])

  const loadAllPositions = async () => {
    // Load base positions
    const basePositions = await getBasePositions()
    
    // Load DLC positions
    const dlcPositions = await loadDLCPositions()
    
    // Combine and set
    setPositions([...basePositions, ...dlcPositions])
  }

  return (
    <div>
      {positions.map(position => (
        <PositionCard key={position.id} position={position} />
      ))}
    </div>
  )
}
```

---

### Step 4: Add DLC Store Access

**Add to Navigation**:

```typescript
// src/components/Header.tsx
import { Link } from 'react-router-dom'

<Link to="/dlc" className="nav-link">
  DLC Store
</Link>
```

**Add Route**:

```typescript
// src/App.tsx or src/pages/Index.tsx
import { EnhancedDLCSystem } from '@/components/EnhancedDLCSystem'

<Route path="/dlc" element={<EnhancedDLCSystem />} />
```

---

### Step 5: Add Purchase Flow

**Integration with Stripe**:

```typescript
// src/lib/dlcPurchase.ts
import { supabase } from '@/integrations/supabase/client'
import { loadStripe } from '@stripe/stripe-js'

export async function purchaseDLCPack(packId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('User not authenticated')
  }

  // Get pack details
  const { data: pack } = await supabase
    .from('dlc_packs')
    .select('*')
    .eq('id', packId)
    .single()

  if (!pack) {
    throw new Error('Pack not found')
  }

  // Create Stripe checkout session
  const { data, error } = await supabase.functions.invoke('create-checkout-session', {
    body: {
      packId: pack.id,
      packName: pack.pack_name,
      price: pack.price,
      currency: pack.currency,
      userId: user.id
    }
  })

  if (error || !data?.sessionId) {
    throw new Error('Failed to create checkout session')
  }

  // Redirect to Stripe checkout
  const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
  if (stripe) {
    await stripe.redirectToCheckout({ sessionId: data.sessionId })
  }
}
```

---

## 🧪 Testing

### Step 1: Test License Activation

```typescript
// Test script
import { activateDLCLicense, hasDLCLicense } from '@/lib/dlcManager'

async function testLicense() {
  // Test activation
  const result = await activateDLCLicense('TEST-LICENSE-KEY')
  console.log('Activation result:', result)

  // Test verification
  const hasLicense = await hasDLCLicense()
  console.log('Has license:', hasLicense)
}
```

### Step 2: Test Content Loading

```typescript
// Test content loading
import { loadDLCPositions } from '@/lib/dlcContentLoader'

async function testContentLoading() {
  const positions = await loadDLCPositions()
  console.log('Loaded positions:', positions.length)
  console.log('Positions:', positions)
}
```

### Step 3: Test Purchase Flow

1. Create a test DLC pack
2. Attempt purchase
3. Verify purchase is recorded
4. Verify content is accessible
5. Test download/stream

### Step 4: Test UI Components

1. Navigate to `/dlc`
2. Verify DLC store displays
3. Test pack browsing
4. Test purchase flow
5. Verify content appears after purchase

---

## 🚀 Deployment

### Step 1: Build Application

```powershell
# Build for production
npm run build

# Or build specific version
npm run build:hybrid:direct
```

### Step 2: Deploy Database

Ensure all migrations are applied to production database.

### Step 3: Deploy Edge Functions

```powershell
# Deploy all functions
npm run deploy:functions

# Or deploy individually
supabase functions deploy get-dlc-content --project-ref your-project-ref
supabase functions deploy check-dlc-updates --project-ref your-project-ref
supabase functions deploy verify-dlc-license --project-ref your-project-ref
```

### Step 4: Configure Production Environment

Update production `.env`:
- Production Supabase URLs
- Production Stripe keys
- Production CDN URLs
- Production storage buckets

### Step 5: Upload Content to Production Storage

Upload all DLC content files to production storage buckets.

### Step 6: Create Production DLC Packs

Create DLC packs in production database with production URLs.

---

## 📝 Creating DLC Content - Detailed Guide

### Creating a Positions Pack

**Step 1: Prepare Position Data**

Create `positions.json`:

```json
[
  {
    "id": "pos-001",
    "name": "Advanced Position 1",
    "description": "Detailed description of the position",
    "category": "advanced",
    "difficulty": "hard",
    "instructions": [
      "Step 1: Start in basic position",
      "Step 2: Move to intermediate position",
      "Step 3: Transition to advanced position"
    ],
    "tips": [
      "Use pillows for support",
      "Communicate with partner",
      "Take breaks if needed"
    ],
    "image_url": "https://storage.supabase.co/.../pos-001.jpg",
    "video_url": "https://storage.supabase.co/.../pos-001.mp4",
    "gif_url": "https://storage.supabase.co/.../pos-001.gif",
    "metadata": {
      "duration_minutes": 5,
      "comfort_level": "medium",
      "flexibility_required": "high",
      "strength_required": "medium"
    }
  }
]
```

**Step 2: Upload Media Files**

Upload to Supabase Storage:
- Images: `dlc-content/{pack-id}/images/`
- Videos: `dlc-content/{pack-id}/videos/`
- GIFs: `dlc-content/{pack-id}/gifs/`

**Step 3: Create Pack Record**

```sql
INSERT INTO dlc_packs (
  pack_name,
  description,
  pack_type,
  content_items,
  item_count,
  price,
  currency,
  preview_images,
  preview_video_url,
  tags,
  category,
  difficulty_level,
  is_active,
  is_featured,
  release_date
) VALUES (
  'Advanced Positions Pack',
  '20 advanced sexual positions with detailed instructions',
  'positions',
  '[...]'::jsonb, -- Your positions.json content
  20,
  9.99,
  'USD',
  ARRAY['https://.../preview1.jpg'],
  'https://.../preview.mp4',
  ARRAY['advanced', 'positions'],
  'positions',
  'advanced',
  true,
  true,
  CURRENT_DATE
);
```

---

### Creating a Video Pack

**Step 1: Prepare Video Metadata**

```json
[
  {
    "id": "video-001",
    "title": "Tutorial Video Title",
    "description": "Video description",
    "category": "tutorial",
    "video_url_sd": "https://.../video-sd.mp4",
    "video_url_hd": "https://.../video-hd.mp4",
    "video_url_4k": "https://.../video-4k.mp4",
    "thumbnail_url": "https://.../thumbnail.jpg",
    "duration_seconds": 600,
    "tags": ["tutorial", "beginner"],
    "metadata": {
      "instructor": "Expert Name",
      "language": "en",
      "subtitles_available": true
    }
  }
]
```

**Step 2: Upload Videos**

Upload to storage with multiple qualities:
- SD: 480p
- HD: 1080p
- 4K: 2160p

**Step 3: Create Pack**

Similar to positions pack, but with `pack_type = 'videos'`

---

### Creating a Bundle

**Step 1: Select Packs**

Choose which packs to include in bundle.

**Step 2: Calculate Pricing**

```sql
-- Calculate bundle price
SELECT 
  SUM(price) as original_price,
  SUM(price) * 0.7 as bundle_price, -- 30% discount
  (SUM(price) * 0.3 / SUM(price)) * 100 as discount_percentage
FROM dlc_packs
WHERE id IN ('pack-id-1', 'pack-id-2', 'pack-id-3');
```

**Step 3: Create Bundle**

```sql
INSERT INTO dlc_bundles (
  bundle_name,
  description,
  pack_ids,
  pack_count,
  bundle_price,
  original_price,
  discount_percentage,
  preview_image_url,
  is_active,
  is_featured,
  is_limited_time,
  expires_at
) VALUES (
  'Complete Collection Bundle',
  'All position packs at a discounted price',
  ARRAY['pack-id-1', 'pack-id-2', 'pack-id-3']::uuid[],
  3,
  19.99,
  29.97,
  33.33,
  'https://.../bundle-preview.jpg',
  true,
  true,
  true,
  NOW() + INTERVAL '30 days'
);
```

---

## 🔄 Adding Content to App - Detailed Steps

### Step 1: Create Content Integration Hook

**File**: `src/hooks/useDLCContent.ts`

```typescript
import { useState, useEffect } from 'react'
import { loadDLCPositions, loadDLCVideos, loadDLCEducation } from '@/lib/dlcContentLoader'
import { hasDLCLicense } from '@/lib/dlcManager'

export function useDLCContent() {
  const [hasDLC, setHasDLC] = useState(false)
  const [positions, setPositions] = useState([])
  const [videos, setVideos] = useState([])
  const [education, setEducation] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadContent()
  }, [])

  const loadContent = async () => {
    setLoading(true)
    try {
      const hasLicense = await hasDLCLicense()
      setHasDLC(hasLicense)

      if (hasLicense) {
        const [dlcPositions, dlcVideos, dlcEducation] = await Promise.all([
          loadDLCPositions(),
          loadDLCVideos(),
          loadDLCEducation()
        ])

        setPositions(dlcPositions)
        setVideos(dlcVideos)
        setEducation(dlcEducation)
      }
    } catch (error) {
      console.error('Error loading DLC content:', error)
    } finally {
      setLoading(false)
    }
  }

  return {
    hasDLC,
    positions,
    videos,
    education,
    loading,
    reload: loadContent
  }
}
```

---

### Step 2: Integrate into Positions Component

**File**: `src/components/PositionsLibrary.tsx`

```typescript
import { useDLCContent } from '@/hooks/useDLCContent'
import { getBasePositions } from '@/lib/positions'

export const PositionsLibrary = () => {
  const { hasDLC, positions: dlcPositions, loading } = useDLCContent()
  const [basePositions, setBasePositions] = useState([])
  const [allPositions, setAllPositions] = useState([])

  useEffect(() => {
    loadBasePositions()
  }, [])

  useEffect(() => {
    // Combine base and DLC positions
    setAllPositions([...basePositions, ...dlcPositions])
  }, [basePositions, dlcPositions])

  const loadBasePositions = async () => {
    const positions = await getBasePositions()
    setBasePositions(positions)
  }

  return (
    <div>
      <h2>Positions Library</h2>
      
      {/* Base Positions */}
      <section>
        <h3>Base Positions</h3>
        {basePositions.map(pos => (
          <PositionCard key={pos.id} position={pos} />
        ))}
      </section>

      {/* DLC Positions */}
      {hasDLC && (
        <section>
          <h3>Premium Positions</h3>
          {dlcPositions.map(pos => (
            <PositionCard 
              key={pos.id} 
              position={pos} 
              isPremium={true}
            />
          ))}
        </section>
      )}

      {/* Upgrade Prompt */}
      {!hasDLC && (
        <UpgradePrompt 
          message="Unlock premium positions with DLC"
          linkTo="/dlc"
        />
      )}
    </div>
  )
}
```

---

### Step 3: Add DLC Badge/Indicator

**Component**: `src/components/DLCBadge.tsx`

```typescript
import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'

export const DLCBadge = () => {
  return (
    <Badge variant="premium" className="flex items-center gap-1">
      <Star className="w-3 h-3" />
      DLC
    </Badge>
  )
}
```

Use in content cards:

```typescript
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <CardTitle>{position.name}</CardTitle>
      {isPremium && <DLCBadge />}
    </div>
  </CardHeader>
  {/* ... */}
</Card>
```

---

### Step 4: Add Purchase Prompt

**Component**: `src/components/UpgradePrompt.tsx`

```typescript
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lock, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export const UpgradePrompt = ({ 
  message, 
  linkTo = '/dlc' 
}: { 
  message: string
  linkTo?: string 
}) => {
  return (
    <Card className="border-dashed">
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3">
          <Lock className="w-5 h-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <Link to={linkTo}>
          <Button variant="outline" size="sm">
            Upgrade
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  )
}
```

---

## 🛠️ File Structure Summary

### Required File Structure

```
project-root/
├── src/
│   ├── lib/
│   │   ├── dlcManager.ts              ✅ Required
│   │   ├── enhancedDLCSystem.ts       ✅ Required
│   │   └── dlcContentLoader.ts        ⭐ Create this
│   ├── components/
│   │   ├── EnhancedDLCSystem.tsx       ✅ Required
│   │   ├── DLCUnlock.tsx              ✅ Required
│   │   ├── DLCStatus.tsx              ✅ Required
│   │   └── DLCBadge.tsx               ⭐ Create this
│   ├── hooks/
│   │   └── useDLCContent.ts           ⭐ Create this
│   └── pages/
│       └── Index.tsx                  ⚠️ Update to add DLC route
├── supabase/
│   ├── migrations/
│   │   ├── 20251206000000_dlc_licenses_and_pricing.sql      ✅ Required
│   │   └── 20251207000024_enhanced_dlc_system.sql           ✅ Required
│   └── functions/
│       ├── get-dlc-content/
│       │   └── index.ts               ✅ Required
│       ├── check-dlc-updates/
│       │   └── index.ts               ✅ Required
│       └── verify-dlc-license/
│           └── index.ts               ✅ Required
├── .env                                ⚠️ Update with DLC config
└── package.json                        ✅ Already has dependencies
```

---

## 📋 Implementation Checklist

### Phase 1: Setup
- [ ] Clone/copy all required files
- [ ] Install dependencies
- [ ] Configure environment variables
- [ ] Run database migrations
- [ ] Verify tables created
- [ ] Deploy Edge Functions

### Phase 2: Integration
- [ ] Add DLC route to app
- [ ] Add DLC to navigation
- [ ] Test DLC store access
- [ ] Test license activation
- [ ] Test content loading

### Phase 3: Content Creation
- [ ] Create first DLC pack
- [ ] Upload content files
- [ ] Create preview content
- [ ] Test pack display
- [ ] Test purchase flow

### Phase 4: Content Integration
- [ ] Create content loader functions
- [ ] Create useDLCContent hook
- [ ] Integrate into existing components
- [ ] Add DLC badges
- [ ] Add upgrade prompts

### Phase 5: Testing
- [ ] Test license verification
- [ ] Test content loading
- [ ] Test purchase flow
- [ ] Test download/stream
- [ ] Test UI components

### Phase 6: Deployment
- [ ] Build application
- [ ] Deploy to production
- [ ] Upload production content
- [ ] Create production packs
- [ ] Test production flow

---

## 🔧 Troubleshooting

### Issue: DLC packs not showing

**Solution**:
1. Check `is_active = true` in database
2. Verify RLS policies allow viewing
3. Check user authentication
4. Verify pack exists in database

---

### Issue: Content not loading after purchase

**Solution**:
1. Verify purchase was recorded
2. Check `is_active = true` on purchase
3. Verify content_items JSON is valid
4. Check storage URLs are accessible
5. Verify user has active license

---

### Issue: License activation fails

**Solution**:
1. Verify license key is correct
2. Check license is not expired
3. Verify Edge Function is deployed
4. Check network connectivity
5. Verify Supabase credentials

---

### Issue: Downloads not working

**Solution**:
1. Check storage bucket permissions
2. Verify file URLs are correct
3. Check download queue status
4. Verify user has download permission
5. Check network connectivity

---

## 📚 Additional Resources

### Documentation Files
- `DLC_FEATURE_DESCRIPTION.md` - Complete feature description
- `supabase/migrations/*.sql` - Canonical database setup scripts
- `exports/full_schema_export.sql` - Reference schema snapshot
- `API_REFERENCE.md` - API documentation

### Code Examples
- `src/lib/dlcManager.ts` - License management examples
- `src/lib/enhancedDLCSystem.ts` - DLC API examples
- `src/components/EnhancedDLCSystem.tsx` - UI examples

---

## 🎯 Quick Start Summary

1. **Copy Files**: Copy all DLC files to main branch
2. **Run Migrations**: Execute SQL migrations in Supabase
3. **Deploy Functions**: Deploy Edge Functions
4. **Create Pack**: Create your first DLC pack
5. **Upload Content**: Upload content files to storage
6. **Integrate**: Add DLC content to app components
7. **Test**: Test purchase and content access
8. **Deploy**: Deploy to production

---

**Last Updated**: 2024-12-08  
**Version**: 1.0.0

