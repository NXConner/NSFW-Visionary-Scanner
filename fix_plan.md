# NSFW-Visionary-Scanner Fix Plan

## "One Touch and Done" Approach - Fixes Grouped by File

---

## P0 Critical Fixes

### 1. src/pages/AdminDashboard.tsx
**Issue:** Admin Dashboard accessible without authentication - /admin route exposed  
**Fix:** Add authentication guard using useAuth hook to redirect unauthenticated users

```tsx
// Add: Import useAuth and useNavigate
// Add: Early return with redirect if user is not admin
```

### 2. src/dlc/core/DLCManager.ts
**Issue:** Age Verification doesn't persist (fails silently)  
**Fix:** Add localStorage fallback for age verification persistence

```ts
// Add localStorage write on successful verification
// Add localStorage read as fallback when DB check fails
```

### 3. src/dlc/context/DLCContext.tsx
**Issue:** Age Verification state doesn't initialize from localStorage  
**Fix:** Initialize isAgeVerified state from localStorage if DB unavailable

---

## P1 High Priority Fixes

### 4. .env (Already Fixed)
**Issue:** NSFW routes return 404  
**Status:** ✅ VITE_DISTRIBUTION_CHANNEL=direct already exists

### 5. src/pages/Index.tsx (or indexTabContent.tsx)
**Issue:** Health Tab returns 404 within Progress page  
**Fix:** Ensure "health" tab routes to valid content component

### 6. src/contexts/AchievementContext.tsx
**Issue:** Achievement System stuck loading (infinite spinner)  
**Fix:** Add timeout fallback and error handling for initialization

### 7. src/contexts/AuthContext.tsx
**Issue:** Session persistence issues across navigation  
**Fix:** Improve session restoration with localStorage fallback

---

## Implementation Order

1. ✅ Check .env (already has VITE_DISTRIBUTION_CHANNEL=direct)
2. ✅ AdminDashboard.tsx - Add auth guard
3. ✅ DLCManager.ts + DLCContext.tsx - Fix age verification persistence
4. ✅ tabRouting.ts - Fix health tab routing
5. ✅ AchievementContext.tsx - Fix loading issue
6. ✅ AuthContext.tsx - Fix session persistence
7. 🏗️ Build debug APK (in progress)

---

## Files to Modify Summary

| File | Fix Type | Priority |
|------|----------|----------|
| src/pages/AdminDashboard.tsx | Auth Guard | P0 |
| src/dlc/core/DLCManager.ts | Age Verification Persistence | P0 |
| src/dlc/context/DLCContext.tsx | Age Verification Init | P0 |
| src/pages/indexTabContent.tsx | Health Tab Route | P1 |
| src/contexts/AchievementContext.tsx | Loading Timeout | P1 |
| src/contexts/AuthContext.tsx | Session Persistence | P1 |

---

*Generated: 2026-02-10*
