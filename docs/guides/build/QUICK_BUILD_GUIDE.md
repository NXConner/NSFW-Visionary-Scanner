# Quick Build Guide — MorphoScan Pro

If you only read one doc first, read:

- `docs/guides/build/MOBILE_BUILD_GUIDE.md`

## Android (debug)

```bash
npm install
npm run build
npx cap sync android
# build debug apk
cd android && ./gradlew assembleDebug
```

Output:

- `android/app/build/outputs/apk/debug/app-debug.apk`

## Android (release)

Follow signing setup in `docs/guides/build/MOBILE_BUILD_GUIDE.md`, then:

```bash
npm run build
npx cap sync android
cd android && ./gradlew bundleRelease
```

Output:

- `android/app/build/outputs/bundle/release/app-release.aab`

## iOS (requires macOS)

```bash
npm install
npm run build
npx cap sync ios
npx cap open ios
```

In Xcode:

- Product → Archive → Distribute App

## Canonical IDs (current repo)

- Android applicationId: `com.morphoscan.pro` (see `android/app/build.gradle`)
- iOS bundle id: `com.morphoscan.pro` (see `ios/App/App/Info.plist`)
