# Build Output Documentation

## 2026-02-11 — Android Unit Tests + APK Rebuild

**Project:** NSFW-Visionary-Scanner  
**Build Date:** February 11, 2026  
**Unit Tests:** ✅ PASSED (`./gradlew test`)  
**Build Tasks:** ✅ SUCCESS (`./gradlew clean assembleDebug assembleRelease`)

---

## APK Details (Feb 11, 2026)

|            Variant | File Path                                                                   |       File Size | Build Time (UTC)    | SHA-256                                                            |
| -----------------: | --------------------------------------------------------------------------- | --------------: | ------------------- | ------------------------------------------------------------------ |
|              Debug | `/workspace/android/app/build/outputs/apk/debug/app-debug.apk`              | 7,790,020 bytes | 2026-02-11 06:45:49 | `56a1545c5d2369a854478815e7f6c1b15e84f8e588af440754af3aab6934344d` |
| Release (unsigned) | `/workspace/android/app/build/outputs/apk/release/app-release-unsigned.apk` | 6,262,638 bytes | 2026-02-11 06:46:23 | `4c129aded40740303a169a4a500106aa4512066ff7a9d155a3dfd2b7ca73b3e0` |

---

## Commands Executed (Feb 11, 2026)

```bash
# Node deps for Capacitor Android subprojects
npm ci --no-audit --no-fund

# Android unit tests
cd android
export ANDROID_SDK_ROOT=/home/ubuntu/android-sdk
export ANDROID_HOME=$ANDROID_SDK_ROOT
./gradlew --no-daemon test

# Rebuild APKs
./gradlew --no-daemon clean assembleDebug assembleRelease
```

---

## 2026-02-10 — Debug APK (Previous Entry)

**Project:** NSFW-Visionary-Scanner  
**Build Date:** February 10, 2026  
**Build Type:** Debug APK  
**Build Status:** ✅ SUCCESS

---

## APK Details

| Property       | Value                                                                                   |
| -------------- | --------------------------------------------------------------------------------------- |
| **File Path**  | `/home/ubuntu/nsfw-visionary-scanner/android/app/build/outputs/apk/debug/app-debug.apk` |
| **File Size**  | 9.8 MB (10,224,857 bytes)                                                               |
| **Build Time** | 2026-02-10 22:33:27 UTC                                                                 |
| **Package ID** | `com.morphoscan.pro`                                                                    |
| **App Name**   | MorphoScan Pro                                                                          |
| **Target SDK** | 35 (Android 15)                                                                         |
| **Min SDK**    | 23 (Android 6.0)                                                                        |

---

## Build Configuration

```json
{
  "appId": "com.morphoscan.pro",
  "appName": "MorphoScan Pro",
  "webDir": "dist",
  "android": {
    "webContentsDebuggingEnabled": true
  }
}
```

---

## Build Commands Executed

```bash
# 1. Build web assets
npm run build

# 2. Sync with Capacitor
npx cap sync android

# 3. Build debug APK
cd android && ./gradlew assembleDebug
```

---

## P2 Fixes Implemented

### 1. Partner Sync Labeling (Fixed)

- Updated UI text to describe admin email auto-connection feature
- Added note explaining pre-configured admin email pairs are automatically connected
- Updated i18n translations with `partnerSync.connection.autoConnectNote`
- Admin emails configured: `n8ter8@gmail.com` ↔ `slkchick_360@yahoo.com`

### 2. Console Warnings (Fixed)

- Added placeholder Stripe key in `.env` to suppress initialization warnings
- Updated `src/lib/stripe.ts` to only log warnings in development mode
- Stripe key check now ignores `pk_test_placeholder` value

### 3. Health Diary Routing (Fixed)

- Corrected shortcut routes in `src/lib/mobileWearableFeatures/shortcuts.ts`
- Changed `/diary` → `diary` (consistent with tab routing system)
- Changed `/scanner` → `scanner`
- Changed `/routines` → `routines`

---

## Environment Variables Added

```env
# Partner Sync - Auto-connect these email pairs
VITE_PARTNER_PAIR_EMAIL_1=n8ter8@gmail.com
VITE_PARTNER_PAIR_EMAIL_2=slkchick_360@yahoo.com

# Stripe - Set to placeholder to suppress warnings
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_placeholder
```

---

## Web Build Output

Successfully built to `dist/` directory:

- 193 precached entries (7346.11 KiB)
- Service Worker generated (sw.js)
- All chunks optimized

---

## Installation Instructions

### For Testing (Debug APK)

1. Enable "Install from Unknown Sources" on Android device
2. Transfer APK to device via USB, email, or cloud storage
3. Open APK file to install
4. Grant requested permissions when prompted

### For Release Build

```bash
cd android && ./gradlew assembleRelease
```

Note: Requires signing configuration in `android/app/build.gradle`

---

## Notes

1. Debug APK has web debugging enabled (chrome://inspect)
2. APK can be installed directly on Android devices (API 23+)
3. For production, replace Stripe placeholder with real publishable key
4. Partner Sync auto-connects configured admin email pairs on login

---

_Build completed successfully on February 10, 2026_
