# Production Build Testing Guide

## Overview
This guide provides comprehensive testing procedures for Android and iOS production builds before app store submission.

## Pre-Testing Checklist

### Environment Setup
- [ ] Production build configuration verified
- [ ] All environment variables set correctly
- [ ] API endpoints pointing to production
- [ ] Stripe keys switched to production (if applicable)
- [ ] Supabase project in production mode
- [ ] All secrets properly configured

### Build Preparation
- [ ] Android APK/AAB signed with release keystore
- [ ] iOS IPA signed with distribution certificate
- [ ] App version numbers incremented
- [ ] Build numbers incremented
- [ ] App icons and splash screens correct
- [ ] Bundle identifiers correct

## Android Testing

### Device Requirements
Test on minimum 3 devices:
- [ ] Android 10+ (API 29+)
- [ ] Android 12+ (API 31+)
- [ ] Android 14+ (API 34+)
- [ ] Different screen sizes (phone, tablet)
- [ ] Different manufacturers (Samsung, Google, OnePlus, etc.)

### Installation Testing
- [ ] Install from APK file
- [ ] Install from Google Play Internal Testing
- [ ] Verify app icon appears
- [ ] Verify app name is correct
- [ ] Check app version in settings

### Core Functionality Testing

#### Authentication
- [ ] Sign up with email/password
- [ ] Sign in with existing account
- [ ] Password reset flow
- [ ] "Remember Me" functionality
- [ ] Sign out
- [ ] Session persistence after app restart

#### Scanner Features
- [ ] Camera permission request
- [ ] Camera opens correctly
- [ ] Object detection works
- [ ] Measurement calculations accurate
- [ ] Multi-angle capture
- [ ] Image upload scanning
- [ ] Scan history saves
- [ ] Scan reports generate correctly

#### Health Diary
- [ ] Create diary entry
- [ ] Edit diary entry
- [ ] Delete diary entry
- [ ] Calendar view displays correctly
- [ ] Filter by date range
- [ ] Export diary data

#### Progress Tracking
- [ ] Charts display correctly
- [ ] Data points accurate
- [ ] Progress photos upload
- [ ] Before/after comparison works
- [ ] Analytics calculations correct

#### PE Features
- [ ] PE Guide displays
- [ ] Routine Builder creates routines
- [ ] Routine execution tracking
- [ ] Positions Gallery loads
- [ ] Visual content displays (images/GIFs/videos)
- [ ] Pumping tracker works

#### AI Features
- [ ] AI Health Chatbot responds
- [ ] AI Scan Analysis processes images
- [ ] AI Routine Recommendations generate
- [ ] Error handling for AI failures

#### Subscription & Payments
- [ ] View pricing plans
- [ ] Create subscription (test mode)
- [ ] Payment form works
- [ ] Subscription status updates
- [ ] Cancel subscription
- [ ] Reactivate subscription
- [ ] Billing portal access
- [ ] Feature access based on tier

### Performance Testing
- [ ] App launches in < 3 seconds
- [ ] No memory leaks during extended use
- [ ] Smooth scrolling and animations
- [ ] Images load efficiently
- [ ] No excessive battery drain
- [ ] Network requests optimized
- [ ] Offline functionality works

### Offline Testing
- [ ] App works without internet
- [ ] Data syncs when connection restored
- [ ] Offline queue processes correctly
- [ ] Error messages for network failures

### Security Testing
- [ ] App lock (PIN/Biometric) works
- [ ] Data encryption verified
- [ ] No sensitive data in logs
- [ ] API keys not exposed
- [ ] Authentication tokens secure

### UI/UX Testing
- [ ] Dark mode works correctly
- [ ] Light mode works correctly
- [ ] Font size adjustments work
- [ ] Color-blind modes functional
- [ ] RTL language support (Arabic)
- [ ] All text readable
- [ ] Buttons tappable (minimum 44x44px)
- [ ] No layout breaks on different screens
- [ ] Safe area insets respected

### Accessibility Testing
- [ ] Screen reader compatibility
- [ ] Keyboard navigation
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA
- [ ] Alt text for images

### Edge Cases
- [ ] Handle low storage space
- [ ] Handle low memory
- [ ] Handle network interruptions
- [ ] Handle camera unavailable
- [ ] Handle permission denials
- [ ] Handle invalid input
- [ ] Handle API errors gracefully

## iOS Testing

### Device Requirements
Test on minimum 3 devices:
- [ ] iPhone 12+ (iOS 15+)
- [ ] iPhone 14+ (iOS 16+)
- [ ] iPhone 15+ (iOS 17+)
- [ ] iPad (if supported)
- [ ] Different screen sizes

### Installation Testing
- [ ] Install via TestFlight
- [ ] Install via Xcode (development)
- [ ] Verify app icon
- [ ] Verify app name
- [ ] Check app version

### Core Functionality Testing
(Same as Android - refer to Android section)

### iOS-Specific Testing
- [ ] Face ID authentication
- [ ] Touch ID authentication
- [ ] Haptic feedback works
- [ ] Safe area insets on notch devices
- [ ] Status bar styling correct
- [ ] Home indicator respected
- [ ] App Store review guidelines compliance

### Performance Testing
- [ ] App launches quickly
- [ ] Smooth 60fps animations
- [ ] No memory warnings
- [ ] Battery usage acceptable
- [ ] Network efficiency

## Cross-Platform Testing

### Feature Parity
- [ ] All features work on both platforms
- [ ] UI consistent across platforms
- [ ] Behavior matches between platforms

### Data Sync
- [ ] Data syncs between devices
- [ ] Cloud backup works
- [ ] Restore from backup works

## Regression Testing

### Critical Paths
- [ ] User can sign up and use app
- [ ] User can create subscription
- [ ] User can perform scan
- [ ] User can track progress
- [ ] User can access all premium features

## Performance Benchmarks

### Android
- App launch: < 3 seconds
- Screen transitions: < 300ms
- Image load: < 2 seconds
- API response: < 1 second
- Memory usage: < 200MB

### iOS
- App launch: < 2 seconds
- Screen transitions: < 200ms
- Image load: < 1.5 seconds
- API response: < 1 second
- Memory usage: < 150MB

## Bug Reporting Template

```
**Device**: [Device model and OS version]
**App Version**: [Version number]
**Steps to Reproduce**:
1. 
2. 
3. 

**Expected Behavior**:
[What should happen]

**Actual Behavior**:
[What actually happens]

**Screenshots**:
[Attach screenshots]

**Logs**:
[Attach relevant logs]
```

## Testing Tools

### Android
- Android Studio Logcat
- Firebase Crashlytics
- Google Play Console Pre-launch reports
- Android Debug Bridge (ADB)

### iOS
- Xcode Console
- TestFlight feedback
- Instruments (performance profiling)
- Console.app

## Sign-Off Checklist

- [ ] All critical bugs fixed
- [ ] Performance benchmarks met
- [ ] Security audit passed
- [ ] Accessibility requirements met
- [ ] App Store guidelines compliance verified
- [ ] Privacy policy and terms accessible
- [ ] Support contact information available
- [ ] Tested on minimum required devices
- [ ] No crashes in 24-hour test period
- [ ] All features functional

## Next Steps After Testing

1. Fix all critical bugs
2. Address performance issues
3. Update version numbers
4. Create release notes
5. Prepare app store assets
6. Submit for review

---

**Note**: This testing should be performed by multiple testers on different devices to ensure comprehensive coverage.

