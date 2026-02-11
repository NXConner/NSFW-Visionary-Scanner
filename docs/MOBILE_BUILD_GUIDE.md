# GrowthTracker Mobile Build Guide

This guide covers building GrowthTracker for Android and iOS platforms using Capacitor.

## App Information

| Property    | Value                                        |
| ----------- | -------------------------------------------- |
| App Name    | GrowthTracker                                |
| Bundle ID   | app.lovable.0b696f8a6a684651ba80ae9256f5e910 |
| Version     | 1.0.0                                        |
| Min Android | API 24 (Android 7.0)                         |
| Min iOS     | iOS 14.0                                     |

## Prerequisites

### For Android:

- [Node.js](https://nodejs.org/) (v18 or later)
- [Android Studio](https://developer.android.com/studio)
- Android SDK (API level 24+)
- Java JDK 17+

### For iOS:

- macOS with [Xcode](https://developer.apple.com/xcode/) (14.0+)
- [CocoaPods](https://cocoapods.org/)
- Apple Developer Account (for App Store deployment)

## Quick Start

### Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd morphoscan

# Install dependencies
npm install
```

## Building for Android

### Option 1: Using Build Script (Recommended)

**Windows:**

```batch
scripts\build-android.bat
```

**macOS/Linux:**

```bash
chmod +x scripts/build-android.sh
./scripts/build-android.sh
```

### Option 2: Manual Build

```bash
# Build web app
npm run build

# Add Android platform (first time only)
npx cap add android

# Sync changes
npx cap sync android

# Open in Android Studio
npx cap open android
```

In Android Studio:

1. Build → Generate Signed Bundle / APK
2. Select APK or Android App Bundle (AAB)
3. Create or select signing key
4. Build Release

### APK Output Locations

- Debug: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release: `android/app/build/outputs/apk/release/app-release-unsigned.apk`

## Building for iOS

### Using Build Script

```bash
chmod +x scripts/build-ios.sh
./scripts/build-ios.sh
```

### Manual Build

```bash
# Build web app
npm run build

# Add iOS platform (first time only)
npx cap add ios

# Sync changes
npx cap sync ios

# Install CocoaPods dependencies
cd ios/App && pod install && cd ../..

# Open in Xcode
npx cap open ios
```

In Xcode:

1. Select your development team
2. Product → Archive
3. Distribute App → App Store Connect

## Google Play Store Deployment

### 1. Create Signing Key

```bash
# Generate release keystore
keytool -genkey -v -keystore growthtracker-release.keystore \
  -alias growthtracker -keyalg RSA -keysize 2048 -validity 10000

# You'll be prompted for:
# - Keystore password (save this securely!)
# - Key password (can be same as keystore)
# - Name, Organization, Location info
```

**⚠️ IMPORTANT:** Store your keystore file and passwords securely! If lost, you cannot update your app.

### 2. Configure Signing in `android/app/build.gradle`

```gradle
android {
    signingConfigs {
        release {
            storeFile file("growthtracker-release.keystore")
            storePassword System.getenv("KEYSTORE_PASSWORD") ?: "your_keystore_password"
            keyAlias "growthtracker"
            keyPassword System.getenv("KEY_PASSWORD") ?: "your_key_password"
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### 3. Create `android/app/proguard-rules.pro`

```proguard
# Keep Capacitor classes
-keep class com.getcapacitor.** { *; }
-keep class com.google.firebase.** { *; }

# Keep annotations
-keepattributes *Annotation*

# WebView JavaScript interface
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
```

### 4. Build Release Bundle

```bash
cd android

# Clean previous builds
./gradlew clean

# Build signed AAB (recommended for Play Store)
./gradlew bundleRelease

# OR build signed APK
./gradlew assembleRelease
```

**Output locations:**

- AAB: `android/app/build/outputs/bundle/release/app-release.aab`
- APK: `android/app/build/outputs/apk/release/app-release.apk`

### 5. Upload to Play Console

1. Go to [Google Play Console](https://play.google.com/console)
2. Click "Create app"
3. Fill in app details:
   - App name: GrowthTracker
   - Default language: English
   - App or game: App
   - Free or paid: Your choice
4. Complete store listing (see docs/STORE_LISTING.md)
5. Set up content rating questionnaire
6. Configure privacy policy URL
7. Upload AAB to Production → Create new release
8. Submit for review (typically 1-7 days)

## Apple App Store Deployment

### 1. Prerequisites

- Apple Developer Program membership ($99/year)
- macOS with Xcode 14+
- Valid signing certificate and provisioning profile

### 2. Configure App in Xcode

1. Open `ios/App/App.xcworkspace`
2. Select "App" target → Signing & Capabilities
3. Set Team to your Apple Developer Team
4. Set Bundle Identifier: `app.lovable.0b696f8a6a684651ba80ae9256f5e910`
5. Enable capabilities:
   - Push Notifications
   - Background Modes (Remote notifications)

### 3. Configure App Icons

In Xcode:

1. Open `ios/App/App/Assets.xcassets`
2. Select AppIcon
3. Drag icons to each slot OR use Asset Catalog Creator tool

Required sizes (all PNG, no alpha):

- 1024x1024 (App Store)
- 180x180 (iPhone @3x)
- 120x120 (iPhone @2x)
- 167x167 (iPad Pro)
- 152x152 (iPad)
- 76x76 (iPad @1x)

### 4. Create App Store Connect Entry

1. Go to [App Store Connect](https://appstoreconnect.apple.com)
2. My Apps → + → New App
3. Fill required fields:
   - Platform: iOS
   - Name: GrowthTracker
   - Primary Language: English
   - Bundle ID: Select from dropdown
   - SKU: GROWTHTRACKER001

### 5. Archive and Upload

```bash
# In Xcode:
# 1. Select "Any iOS Device" as build target
# 2. Product → Archive
# 3. Wait for build to complete
# 4. Window → Organizer
# 5. Select archive → Distribute App
# 6. Choose "App Store Connect"
# 7. Follow prompts to upload
```

### 6. Submit for Review

In App Store Connect:

1. Select your app
2. Click "+ Version or Platform" if needed
3. Fill all required fields:
   - Screenshots (see docs/STORE_LISTING.md)
   - App description
   - Keywords
   - Support URL
   - Privacy Policy URL
4. Select build from uploaded archives
5. Answer export compliance questions
6. Click "Submit for Review"

**Review timeline:** Typically 24-48 hours, but can take up to 7 days

## Push Notifications Setup

### Android (Firebase Cloud Messaging)

1. Create project at [Firebase Console](https://console.firebase.google.com)
2. Add Android app with package name
3. Download `google-services.json` to `android/app/`
4. Enable Cloud Messaging in Firebase project settings

### iOS (Apple Push Notification Service)

1. Enable Push Notifications in Xcode Capabilities
2. Create APNs Key in Apple Developer portal
3. Upload key to your push notification service

## Troubleshooting

### Android Build Issues

**Gradle sync failed:**

```bash
cd android
./gradlew clean
./gradlew --refresh-dependencies
```

**JDK version issues:**
Ensure JAVA_HOME points to JDK 17+

### iOS Build Issues

**CocoaPods issues:**

```bash
cd ios/App
pod deintegrate
pod install --repo-update
```

**Signing issues:**

- Ensure valid Apple Developer membership
- Check provisioning profiles in Xcode

### Common Issues

**Web app not loading:**

- Check `capacitor.config.ts` server URL
- For production, remove/comment the server.url setting

**Assets not updating:**

```bash
npx cap sync
```

## Environment Configuration

### Development (Hot Reload)

The `capacitor.config.ts` includes a server URL for development hot reload:

```typescript
server: {
  url: 'https://your-preview-url.lovableproject.com',
  cleartext: true
}
```

### Production Build

Comment out or remove the server config for production builds to use the bundled web app.

## Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Developer Guide](https://developer.android.com/guide)
- [iOS App Store Guidelines](https://developer.apple.com/app-store/guidelines/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
