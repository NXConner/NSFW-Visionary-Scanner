# DLC Implementation - Files Checklist

## ✅ Quick Reference: All Required Files

### 📁 Database Migrations

**Location**: `supabase/migrations/`

- [ ] `20251206000000_dlc_licenses_and_pricing.sql`
- [ ] `20251207000024_enhanced_dlc_system.sql`

**Action**: Copy from NSFW branch or run `npm run db:push` to apply `supabase/migrations/`

---

### 📁 Library Files (src/lib/)

- [ ] `dlcManager.ts` - Core license management
- [ ] `enhancedDLCSystem.ts` - Enhanced DLC API functions
- [ ] `dlcContentLoader.ts` - **CREATE THIS** (content loading functions)

---

### 📁 React Components (src/components/)

- [ ] `EnhancedDLCSystem.tsx` - Main DLC store UI
- [ ] `DLCUnlock.tsx` - License activation component
- [ ] `DLCStatus.tsx` - DLC status display
- [ ] `DLCBadge.tsx` - **CREATE THIS** (premium badge component)
- [ ] `UpgradePrompt.tsx` - **CREATE THIS** (upgrade prompt component)

---

### 📁 React Hooks (src/hooks/)

- [ ] `useDLCContent.ts` - **CREATE THIS** (DLC content hook)

---

### 📁 Edge Functions (supabase/functions/)

- [ ] `get-dlc-content/index.ts` - Get DLC content package
- [ ] `check-dlc-updates/index.ts` - Check for updates
- [ ] `verify-dlc-license/index.ts` - Verify license keys

---

### 📁 Configuration Files

- [ ] `.env` - **UPDATE** (add DLC environment variables)
- [ ] `package.json` - ✅ Already has dependencies
- [ ] `vite.config.ts` - ✅ Already configured

---

### 📁 App Integration Files

- [ ] `src/pages/Index.tsx` - **UPDATE** (add DLC route)
- [ ] `src/components/Header.tsx` - **UPDATE** (add DLC link)
- [ ] `src/App.tsx` - **UPDATE** (if using separate routing)

---

## 📋 Copy Commands

### PowerShell Commands to Copy Files

```powershell
# From NSFW branch to main branch
# (Adjust paths as needed)

# Database migrations
Copy-Item supabase\migrations\20251206000000_dlc_licenses_and_pricing.sql -Destination main-branch-path\supabase\migrations\
Copy-Item supabase\migrations\20251207000024_enhanced_dlc_system.sql -Destination main-branch-path\supabase\migrations\

# Library files
Copy-Item src\lib\dlcManager.ts -Destination main-branch-path\src\lib\
Copy-Item src\lib\enhancedDLCSystem.ts -Destination main-branch-path\src\lib\

# Components
Copy-Item src\components\EnhancedDLCSystem.tsx -Destination main-branch-path\src\components\
Copy-Item src\components\DLCUnlock.tsx -Destination main-branch-path\src\components\
Copy-Item src\components\DLCStatus.tsx -Destination main-branch-path\src\components\

# Edge Functions
Copy-Item supabase\functions\get-dlc-content -Destination main-branch-path\supabase\functions\ -Recurse
Copy-Item supabase\functions\check-dlc-updates -Destination main-branch-path\supabase\functions\ -Recurse
Copy-Item supabase\functions\verify-dlc-license -Destination main-branch-path\supabase\functions\ -Recurse
```

---

## 🆕 Files to Create

### 1. `src/lib/dlcContentLoader.ts`

```typescript
import { supabase } from '@/integrations/supabase/client'
import { getDLCPurchases } from './enhancedDLCSystem'
import { hasDLCLicense } from './dlcManager'

export async function loadDLCPositions() {
  // Implementation from guide
}

export async function loadDLCVideos() {
  // Implementation from guide
}

export async function loadDLCEducation() {
  // Implementation from guide
}
```

---

### 2. `src/hooks/useDLCContent.ts`

```typescript
import { useState, useEffect } from 'react'
import { loadDLCPositions, loadDLCVideos, loadDLCEducation } from '@/lib/dlcContentLoader'
import { hasDLCLicense } from '@/lib/dlcManager'

export function useDLCContent() {
  // Implementation from guide
}
```

---

### 3. `src/components/DLCBadge.tsx`

```typescript
import { Badge } from '@/components/ui/badge'
import { Star } from 'lucide-react'

export const DLCBadge = () => {
  return (
    <Badge variant="premium">
      <Star className="w-3 h-3" />
      DLC
    </Badge>
  )
}
```

---

### 4. `src/components/UpgradePrompt.tsx`

```typescript
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Lock, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export const UpgradePrompt = ({ message, linkTo = '/dlc' }) => {
  // Implementation from guide
}
```

---

## 🔧 Environment Variables to Add

Add to `.env`:

```env
# DLC Configuration
VITE_DLC_ENABLED=true
VITE_DLC_CONTENT_URL=https://your-cdn-url.com/dlc

# Stripe (if not already added)
VITE_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_webhook_secret
```

---

## 📝 Integration Checklist

### Step 1: Copy Files
- [ ] Copy all database migrations
- [ ] Copy all library files
- [ ] Copy all components
- [ ] Copy all Edge Functions

### Step 2: Create New Files
- [ ] Create `dlcContentLoader.ts`
- [ ] Create `useDLCContent.ts` hook
- [ ] Create `DLCBadge.tsx` component
- [ ] Create `UpgradePrompt.tsx` component

### Step 3: Update Existing Files
- [ ] Update `.env` with DLC variables
- [ ] Update `Index.tsx` with DLC route
- [ ] Update `Header.tsx` with DLC link
- [ ] Update components to use DLC content

### Step 4: Database Setup
- [ ] Run SQL migrations
- [ ] Verify tables created
- [ ] Verify RLS policies

### Step 5: Deploy
- [ ] Deploy Edge Functions
- [ ] Test license activation
- [ ] Test content loading
- [ ] Test purchase flow

---

## 🚀 Quick Start Commands

```powershell
# 1. Install dependencies
npm install

# 2. Run database migrations
npm run db:push

# 3. Deploy Edge Functions
npm run deploy:functions

# 4. Start dev server
npm run dev
```

---

**See `DLC_IMPLEMENTATION_GUIDE.md` for detailed instructions.**

