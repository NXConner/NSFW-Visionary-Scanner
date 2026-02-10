# Remaining Tasks - Complete List

## 2025-12 Finish Plan (What remains now)

### Phase A — Codebase health (fast, high leverage)

- [ ] **Split remaining oversized components (>500 lines)** into feature folders with stable wrapper exports:
  - `src/components/PumpingSection.tsx` → `src/components/pumping/*`
  - `src/components/ProgressCharts.tsx` → `src/components/progressCharts/*`
  - `src/components/ComprehensiveHealthMonitoring.tsx` → `src/components/comprehensiveHealthMonitoring/*`
  - `src/components/CalibrationWizard.tsx` → `src/components/calibrationWizard/*`
  - `src/components/Model3DViewer.tsx` → `src/components/model3dViewer/*`
  - `src/components/PERoutineBuilder.tsx` → `src/components/peRoutineBuilder/*`
  - (Plus any remaining large `src/lib/*.ts` utilities)
- [ ] **Lint warning burn-down** (currently many warnings, 0 errors):
  - `jsx-a11y/*` accessibility warnings (labels, keyboard handlers, etc.)
  - `react-hooks/exhaustive-deps` (safely fix deps or refactor callbacks)
  - Reduce `any` usage by introducing types (prefer local interfaces / shared types)
- [ ] **Stability guardrails**
  - Keep each touched file under ~200–300 lines when feasible (hard cap 500)
  - Avoid duplicate logic when splitting—centralize in `index.ts` and shared modules

### Phase B — Tests (lock in behavior)

- [ ] **Unit tests**
  - Settings: theme + IndexedDB wallpaper persistence + feature-flag overrides
  - Scanner: render smoke + key state transitions
- [ ] **E2E tests (Playwright)**
  - Core flow: auth → navigate → settings → scanner (smoke + navigation)

### Phase C — Production hardening

- [ ] **Wallpaper persistence verification**
  - Upload image/video wallpaper → reload → persists
  - Clear wallpaper → IndexedDB blob cleared + UI updated
- [ ] **Accessibility sweep**
  - Keyboard navigation, focus states, labels, reduced motion
- [ ] **Performance sweep**
  - Reduce re-renders in heavy pages, memoize expensive computations
  - Confirm bundle chunk sizes remain stable
- [ ] **Final verification**
  - `npm run lint` (no errors)
  - `npm run test:run`
  - `npm run build`

## ✅ Recently Completed

- NSFW Visual Content Integration (all components enhanced)
- Image fetching from GitHub repositories
- Color inversion system
- Visual content management system
- Step-by-step visual guides

---

## 🔴 High Priority (Critical for Launch)

### 1. Payment Integration

- **Status**: Not Started
- **Priority**: CRITICAL
- **Effort**: 2-3 days
- **Tasks**:
  - Complete Stripe subscription setup
  - Implement webhook handlers for subscription events
  - Create billing portal integration
  - Add subscription management UI
  - Test payment flows (test mode)
  - Handle subscription upgrades/downgrades
  - Implement subscription status checks

### 2. Production Build Testing

- **Status**: Not Started
- **Priority**: CRITICAL
- **Effort**: 2-3 days
- **Tasks**:
  - Test on physical Android devices
  - Test on physical iOS devices
  - Verify all features work on mobile
  - Test offline functionality
  - Test push notifications
  - Performance testing
  - Battery usage testing
  - Memory leak testing

### 3. Push Notification Backend

- **Status**: Partially Complete (Edge Function exists)
- **Priority**: HIGH
- **Effort**: 1-2 hours
- **Tasks**:
  - Configure FCM service account
  - Test remote push notifications
  - Set up notification triggers
  - Implement notification scheduling
  - Add notification preferences

### 4. App Store Submission

- **Status**: Not Started
- **Priority**: HIGH (Phase 4 - User requested to stop here)
- **Effort**: 1-2 days
- **Tasks**:
  - Generate signed Android APK
  - Generate signed iOS IPA
  - Google Play Console setup
  - Apple App Store Connect setup
  - Create store listings
  - Submit for review

---

## 🟡 Medium Priority

### 5. Social Login

- **Status**: Not Started
- **Priority**: MEDIUM
- **Effort**: 1-2 days
- **Tasks**:
  - Google Sign-in integration
  - Apple Sign-in integration
  - Update auth flow
  - Handle OAuth callbacks

### 6. Biometric Authentication

- **Status**: Partially Complete (App Lock exists)
- **Priority**: MEDIUM
- **Effort**: 1 day
- **Tasks**:
  - Enhance existing app lock
  - Add Face ID support (iOS)
  - Add Touch ID support (iOS)
  - Add Fingerprint support (Android)
  - Improve UX

### 7. Email Confirmation Flow

- **Status**: Not Started
- **Priority**: MEDIUM
- **Effort**: 1 day
- **Tasks**:
  - Require email verification
  - Send verification emails
  - Block access until verified
  - Resend verification emails
  - Handle verification tokens

### 8. Account Deletion

- **Status**: Not Started
- **Priority**: MEDIUM (GDPR requirement)
- **Effort**: 1 day
- **Tasks**:
  - Create account deletion UI
  - Implement data deletion logic
  - Delete all user data (Supabase + local)
  - Send confirmation email
  - Handle subscription cancellation

### 9. Data Retention Policy

- **Status**: Not Started
- **Priority**: MEDIUM (GDPR requirement)
- **Effort**: 1 day
- **Tasks**:
  - Define retention periods
  - Implement auto-cleanup cron job
  - Add user preferences for retention
  - Notify users before deletion

### 10. Rate Limiting

- **Status**: Not Started
- **Priority**: MEDIUM
- **Effort**: 1 day
- **Tasks**:
  - Implement rate limiting middleware
  - Add rate limits to API endpoints
  - Add rate limits to Edge Functions
  - Handle rate limit errors gracefully
  - Add rate limit headers

### 11. Analytics Dashboard

- **Status**: Not Started
- **Priority**: MEDIUM
- **Effort**: 2-3 days
- **Tasks**:
  - Privacy-compliant analytics
  - Usage tracking
  - Feature usage metrics
  - Error tracking
  - Performance metrics
  - Admin dashboard

---

## 🔵 Technical Debt

### 12. Unit Tests

- **Status**: Partially Complete (Vitest setup exists)
- **Priority**: MEDIUM
- **Effort**: 3-5 days
- **Tasks**:
  - Increase test coverage to 80%+
  - Test all hooks
  - Test all utilities
  - Test all components
  - Test edge cases

### 13. E2E Tests

- **Status**: Partially Complete (Playwright setup exists)
- **Priority**: MEDIUM
- **Effort**: 2-3 days
- **Tasks**:
  - Test critical user flows
  - Test authentication flow
  - Test scanner flow
  - Test subscription flow
  - Test data sync flow

### 14. Performance Audit

- **Status**: Not Started
- **Priority**: MEDIUM
- **Effort**: 1 day
- **Tasks**:
  - Run Lighthouse audit
  - Fix performance issues
  - Optimize images
  - Reduce bundle size
  - Improve Core Web Vitals

### 15. Bundle Size Optimization

- **Status**: Not Started
- **Priority**: MEDIUM
- **Effort**: 1-2 days
- **Tasks**:
  - Analyze bundle size
  - Implement code splitting
  - Lazy load routes
  - Lazy load heavy components
  - Tree shaking optimization

### 16. Error Boundary Components

- **Status**: Not Started
- **Priority**: MEDIUM
- **Effort**: 1 day
- **Tasks**:
  - Create error boundary component
  - Wrap critical sections
  - Add error reporting
  - Add fallback UI
  - Handle async errors

---

## 📋 Execution Plan

### Phase 1: Critical Infrastructure (Start Here)

1. ✅ Payment Integration
2. ✅ Production Build Testing
3. ✅ Push Notification Backend

### Phase 2: Compliance & Security

4. ✅ Email Confirmation Flow
5. ✅ Account Deletion
6. ✅ Data Retention Policy
7. ✅ Rate Limiting

### Phase 3: User Experience

8. ✅ Social Login
9. ✅ Biometric Authentication
10. ✅ Analytics Dashboard

### Phase 4: Quality & Performance

11. ✅ Unit Tests (increase coverage)
12. ✅ E2E Tests
13. ✅ Performance Audit
14. ✅ Bundle Size Optimization
15. ✅ Error Boundary Components

### Phase 5: App Store (User requested to stop here)

16. ⏸️ App Store Submission

---

## 🎯 Next Steps

Starting with **Payment Integration** as it's critical for monetization and required before app store submission.
