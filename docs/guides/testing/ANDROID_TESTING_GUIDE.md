# Android APK Testing Guide

**Last Updated:** January 11, 2026  
**APK Version:** 1.0.0  
**Build Status:** ✅ Ready for Testing

---

## 📱 Quick Start

### Install Debug APK

1. Enable "Install from Unknown Sources" on your Android device
2. Transfer `android/app/build/outputs/apk/debug/app-debug.apk` to your device
3. Open the APK file on your device
4. Tap "Install"
5. Launch "MorphoScan Pro" from your app drawer

---

## ✅ Testing Checklist

### Initial Setup

- [ ] App installs successfully
- [ ] App launches without crashes
- [ ] Splash screen displays correctly
- [ ] Main screen loads properly

### Camera Permissions

- [ ] First launch: Camera permission prompt appears
- [ ] Grant permission: App continues normally
- [ ] Deny permission: Appropriate error message shown
- [ ] Settings: Can navigate to app settings to grant permission

### Scanner Functionality

- [ ] Scanner tab opens correctly
- [ ] Camera preview displays
- [ ] Camera starts within 3 seconds
- [ ] Preview is clear and responsive
- [ ] Can capture images
- [ ] Captured images save correctly
- [ ] Scanner settings accessible
- [ ] All scanner features work (zoom, focus, etc.)

### Page Navigation

- [ ] All tabs load correctly
- [ ] Navigation between tabs works smoothly
- [ ] No blank screens or loading errors
- [ ] Deep links work (if applicable)
- [ ] Back button navigation works

### Core Features

- [ ] 3D Viewer loads
- [ ] Health Diary accessible
- [ ] Progress tracking works
- [ ] Settings page loads
- [ ] Profile page accessible
- [ ] All DLC content loads (if applicable)

### Performance

- [ ] App starts in < 3 seconds
- [ ] Pages load in < 2 seconds
- [ ] No lag when switching tabs
- [ ] Camera preview is smooth (30fps+)
- [ ] No memory leaks (test for 10+ minutes)

### Error Handling

- [ ] Network errors handled gracefully
- [ ] Camera errors show user-friendly messages
- [ ] App doesn't crash on invalid input
- [ ] Error boundaries catch rendering errors

---

## 🔍 Detailed Test Scenarios

### Scenario 1: First Launch

1. Install APK on fresh device
2. Launch app
3. **Expected:** Permission prompt appears
4. Grant camera permission
5. **Expected:** App continues to main screen

### Scenario 2: Scanner Usage

1. Navigate to Scanner tab
2. Tap "Start Camera"
3. **Expected:** Camera preview appears within 3 seconds
4. Point camera at object
5. **Expected:** Preview is clear and responsive
6. Tap capture button
7. **Expected:** Image captured and saved

### Scenario 3: Permission Denial

1. Uninstall app
2. Reinstall APK
3. Deny camera permission when prompted
4. Navigate to Scanner tab
5. **Expected:** Error message: "Camera permission denied. Please allow camera access in your device settings and retry."
6. Go to device Settings > Apps > MorphoScan Pro > Permissions
7. Grant camera permission
8. Return to app
9. **Expected:** Scanner now works

### Scenario 4: Page Navigation

1. Test each tab:
   - Home/Index
   - Scanner
   - 3D Viewer
   - Health Diary
   - Progress Photos
   - Settings
   - Profile
2. **Expected:** All pages load without errors
3. Navigate back and forth
4. **Expected:** No crashes or blank screens

### Scenario 5: Background/Foreground

1. Open app
2. Start camera
3. Press home button (app goes to background)
4. Return to app
5. **Expected:** App resumes correctly
6. **Expected:** Camera may need to restart (normal behavior)

---

## 🐛 Known Issues & Workarounds

### Issue: Camera doesn't start

**Solution:**

- Check if camera permission is granted in device settings
- Restart the app
- Ensure no other app is using the camera

### Issue: Pages don't load

**Solution:**

- Clear app data and cache
- Reinstall the APK
- Check device storage space

### Issue: App crashes on launch

**Solution:**

- Check Android version (minimum: Android 6.0 / API 23)
- Ensure device has sufficient RAM (minimum: 2GB)
- Check device logs: `adb logcat | grep -i morphoscan`

---

## 📊 Test Results Template

```
Device: [Device Model]
Android Version: [e.g., Android 13]
API Level: [e.g., 33]
Test Date: [Date]

✅ Passed Tests:
- [List passed tests]

❌ Failed Tests:
- [List failed tests with details]

📝 Notes:
- [Any observations or issues]
```

---

## 🔧 Debugging Tools

### ADB Commands

```bash
# View app logs
adb logcat | grep -i morphoscan

# Install APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Uninstall app
adb uninstall com.morphoscan.pro

# Clear app data
adb shell pm clear com.morphoscan.pro

# Check permissions
adb shell dumpsys package com.morphoscan.pro | grep permission
```

### Chrome DevTools (Remote Debugging)

1. Enable USB debugging on device
2. Connect device via USB
3. Open Chrome and navigate to `chrome://inspect`
4. Click "inspect" next to your device
5. Debug WebView content

---

## 📱 Device Compatibility

### Minimum Requirements

- **Android Version:** 6.0 (API 23)
- **RAM:** 2GB minimum, 4GB recommended
- **Storage:** 100MB free space
- **Camera:** Rear camera required

### Tested Devices

- [ ] Add your tested devices here

### Known Compatible Devices

- Most modern Android devices (2018+)
- Samsung Galaxy series
- Google Pixel series
- OnePlus devices
- Xiaomi devices

---

## 🚀 Production Testing

Before releasing to production:

1. **Test on Multiple Devices**
   - Different manufacturers
   - Different Android versions
   - Different screen sizes

2. **Test Release APK**
   - Sign with production keystore
   - Test signed APK thoroughly
   - Verify ProGuard doesn't break functionality

3. **Performance Testing**
   - Battery usage
   - Memory usage
   - Network usage
   - Storage usage

4. **Security Testing**
   - Verify no sensitive data in logs
   - Check permission usage
   - Verify secure storage

---

## 📞 Reporting Issues

When reporting issues, include:

1. Device model and Android version
2. Steps to reproduce
3. Expected vs actual behavior
4. Screenshots or screen recordings
5. Logs (if available)

---

## ✅ Sign-Off

**Tester Name:** **\*\*\*\***\_**\*\*\*\***  
**Date:** **\*\*\*\***\_**\*\*\*\***  
**Status:** ☐ Passed ☐ Failed ☐ Needs Retest  
**Notes:** **\*\*\*\***\_**\*\*\*\***

---

**Ready for Production:** ☐ Yes ☐ No
