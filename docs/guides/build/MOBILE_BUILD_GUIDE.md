# MorphoScan Pro — Mobile Build Guide (Canonical)

This is the canonical guide for building MorphoScan Pro for Android and iOS with Capacitor.

If you’re looking for the overall “what’s left” plan, see `docs/tracking/CONSOLIDATED_DOCS_MASTER.md`.

## Canonical app identifiers (current repo)

- **Android applicationId**: `com.morphoscan.pro` (see `android/app/build.gradle`)
- **iOS bundle id**: `com.morphoscan.pro` (see `ios/App/App/Info.plist`)

> ✅ `capacitor.config.ts` is aligned to `com.morphoscan.pro` / MorphoScan Pro.

## Prerequisites

- Node.js 18+
- Android Studio + SDK (Android)
- JDK 17+
- macOS + Xcode + CocoaPods (iOS)

## Build web assets (Capacitor)

> ✅ **Important**: Mobile builds must set `CAPACITOR_BUILD=1` so the bundle is packaged for the
> Capacitor local server. Skipping this can produce an APK that boots into a permanent loader.

**PowerShell (recommended):**
```powershell
npm install
$env:CAPACITOR_BUILD="1"
$env:VITE_PLATFORM="capacitor"

# Choose one (match your distribution channel):
npm run build:sfw:direct
# npm run build:nsfw:direct
# npm run build:hybrid:direct
```

**Bash (CI/Linux):**
```bash
npm install
CAPACITOR_BUILD=1 VITE_PLATFORM=capacitor npm run build:sfw:direct
```

## Android

### Sync Capacitor assets

```bash
npx cap sync android
```

### Release signing (how this repo expects it)

`android/app/build.gradle` supports **either** `RELEASE_*` **or** `MORPHOSCAN_*` Gradle properties. Put these in **`android/gradle.properties`** (do not commit):

- `MORPHOSCAN_STORE_FILE=/absolute/path/to/keystore.jks`
- `MORPHOSCAN_STORE_PASSWORD=...`
- `MORPHOSCAN_KEY_ALIAS=...`
- `MORPHOSCAN_KEY_PASSWORD=...`

### Build outputs

Debug APK:

```bash
cd android && ./gradlew assembleDebug
```

Release AAB (Play Store):

```bash
cd android && ./gradlew bundleRelease
```

Outputs:

- `android/app/build/outputs/apk/debug/app-debug.apk`
- `android/app/build/outputs/bundle/release/app-release.aab`

## iOS (requires macOS)

### Sync Capacitor assets

```bash
npx cap sync ios
```

### Open Xcode

```bash
npx cap open ios
```

In Xcode:

- Ensure Signing & Capabilities is configured for your team
- Product → Archive → Distribute App

## Push notifications

- Remote push setup: `docs/guides/integrations/notifications/FCM_SETUP.md`
- iOS already declares `remote-notification` background mode in `ios/App/App/Info.plist`.

## Production build gotcha

- Capacitor dev `server.url` must be disabled for production builds.
- This repo already disables it when `NODE_ENV=production`.
