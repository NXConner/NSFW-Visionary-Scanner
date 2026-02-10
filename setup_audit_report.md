# NSFW-Visionary-Scanner Setup Audit Report

**Date:** February 10, 2026  
**Project:** NSFW-Visionary-Scanner  
**Location:** `/home/ubuntu/nsfw-visionary-scanner`

---

## 1. Dependencies Installation

✅ **Status:** Completed

```bash
npm install
```

- Installed 1141 packages
- 7 vulnerabilities detected (1 moderate, 6 high) - recommend running `npm audit fix`
- Some deprecated packages noted (sourcemap-codec, tar, node-domexception)

---

## 2. Environment Configuration

✅ **Status:** Configured

### .env File Contents

| Variable | Value | Status |
|----------|-------|--------|
| `VITE_SUPABASE_URL` | `https://thajylrvfzjmerqqkmjv.supabase.co` | ✅ Set |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `eyJhbG...` (truncated) | ✅ Set |
| `VITE_SUPABASE_PROJECT_ID` | `thajylrvfzjmerqqkmjv` | ✅ Set |
| `VITE_APP_VERSION` | `nsfw` | ✅ Set |
| `VITE_DISTRIBUTION_CHANNEL` | `direct` | ✅ Set |
| `VITE_ADMIN_EMAIL` | `slkchick_360@yahoo.com` | ✅ Set |
| `VITE_ADMIN_SUPER_EMAIL` | `n8ter8@gmail.com` | ✅ Set |
| `VITE_PARTNER_PAIR_EMAIL_1` | `n8ter8@gmail.com` | ✅ Set |
| `VITE_PARTNER_PAIR_EMAIL_2` | `slkchick_360@yahoo.com` | ✅ Set |

### Partner Sync Configuration
- Partner pair auto-connection is configured for both admin emails
- Both emails bypass email verification (configured in code)

---

## 3. Supabase User Roles

⚠️ **Status:** Users Not Found (Pending Sign-up)

### Role Assignment Script
Created: `scripts/add-user-roles.ts`

### Attempted Assignments:
| Email | Target Role | Status |
|-------|-------------|--------|
| `n8ter8@gmail.com` | `super_admin` | ⚠️ User not in profiles table yet |
| `slkchick_360@yahoo.com` | `admin` | ⚠️ User not in profiles table yet |

### Action Required:
1. Users must sign up first in the application
2. After sign-up, run: `npx tsx scripts/add-user-roles.ts`
3. The script checks for existing roles before adding (idempotent)

### Database Schema:
- `user_roles` table exists with `app_role` enum
- Supported roles: `user`, `pro`, `admin`, `super_admin`
- Super admin role migration: `20251215030000_add_super_admin_role.sql`

---

## 4. NSFW Navigation Audit

✅ **Status:** All routes verified

### Navigation Structure

#### Sidebar Navigation (`src/components/appShell/AppSidebar.tsx`)
The NSFW Content category is conditionally rendered based on:
- `BUILD_ALLOW_ADULT_BUNDLE` flag
- User has NSFW DLC unlocked OR is super_admin
- Age verification completed

#### Route Definitions (`src/App.tsx`)

| Route | Component | Build Flag Required |
|-------|-----------|---------------------|
| `/nsfw` | `NSFWDashboardPage` | `BUILD_ALLOW_ADULT_BUNDLE` |
| `/nsfw/landing` | `NSFWAddOnsLandingPage` | `BUILD_ALLOW_ADULT_BUNDLE` |
| `/nsfw/topics` | `NSFWTopicsPage` | `BUILD_ALLOW_ADULT_BUNDLE` |

### NSFW Menu Items & Tab Mapping

| Menu Item | Tab ID | Component | Status |
|-----------|--------|-----------|--------|
| Intimate Education | `nsfw-cock-worshiping` | `LazyNSFWEducationHub` | ✅ Working |
| NSFW Videos | `nsfw-videos` | `LazyNSFWVideoContent` | ✅ Working |
| NSFW Forum | `nsfw-forum` | `LazyNSFWCommunityForum` | ✅ Working |
| NSFW Analytics | `nsfw-wellness-analytics` | `LazyNSFWSexualWellnessAnalytics` | ✅ Working |
| NSFW Advanced | `nsfw-advanced` | `LazyNSFWAdvancedFeatures` | ✅ Working |

### Navigation Catalog (`src/lib/navigation/navCatalog.ts`)

All NSFW items are defined in the `NAV_CATEGORIES` array under "NSFW Content" category with `nsfwOnly: true` flag.

### DLC Feature Gates
Each NSFW tab is wrapped with:
1. `NsfwSessionGate` - Session-level NSFW access control
2. `DlcFeatureGate` - DLC purchase verification

| Feature | DLC Required |
|---------|--------------|
| `intimate_education` | Intimate Education add-on |
| `video_library` | Video Library DLC |
| `private_forum` | Private Community DLC |
| `wellness_analytics` | Wellness Analytics DLC |

### Broken Routes / Missing Components
✅ **None Found** - All NSFW menu items have corresponding routes and components.

---

## 5. Dev Server

✅ **Status:** Running

- URL: `http://localhost:8080`
- Configuration fix applied: Added `cacheDir: "node_modules/.vite"` to `vite.config.ts`

### Server Configuration
```javascript
{
  host: "0.0.0.0",
  port: 8080,
  strictPort: true,
  allowedHosts: true,
  cors: true
}
```

---

## Summary

| Task | Status |
|------|--------|
| Install npm dependencies | ✅ Complete |
| Configure .env file | ✅ Complete |
| Add Supabase user roles | ⚠️ Waiting for user sign-up |
| Audit NSFW navigation | ✅ Complete - No issues |
| Start dev server | ✅ Running on port 8080 |

### Next Steps
1. Have admin users sign up in the application
2. Run `npx tsx scripts/add-user-roles.ts` to assign roles
3. Consider running `npm audit fix` to address vulnerabilities

### Key Files Reference
- Admin manager: `src/lib/auth/adminManager.ts`
- Feature access: `src/hooks/useFeatureAccess.tsx`
- Partner sync: `src/lib/partners/partnerSync.ts`
- NSFW routes: `src/App.tsx`
- Sidebar nav: `src/components/appShell/AppSidebar.tsx`
- Nav catalog: `src/lib/navigation/navCatalog.ts`
- Tab content: `src/pages/indexTabContent.tsx`
