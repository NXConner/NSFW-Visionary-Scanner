# Android APK Build Setup

## Configuration Complete

All Android build configurations have been set up and are ready for building APK files.

### Files Created/Modified

1. **android/gradle.properties**
   - Enabled AndroidX (`android.useAndroidX=true`)
   - Enabled Jetifier (`android.enableJetifier=true`)
   - Suppressed compileSdk 35 warning
   - Configured R8 full mode
   - Set JVM memory to 2048MB

2. **android/app/proguard-rules.pro**
   - Created comprehensive ProGuard rules for:
     - Capacitor classes
     - Firebase classes
     - AndroidX libraries
     - CameraX, Biometric, Security libraries
     - Custom application classes

3. **android/build.gradle**
   - Updated compileSdk to 35
   - Updated Android Gradle Plugin to 8.5.2

4. **android/app/build.gradle**
   - Updated compileSdk to 35
   - Configured debug and release signing configs
   - Enabled ProGuard for release builds

5. **android/gradle/wrapper/gradle-wrapper.properties**
   - Updated Gradle version to 8.7

6. **android/local.properties**
   - Auto-configured Android SDK location

7. **build-all-apks.ps1**
   - Comprehensive build script that:
     - Checks prerequisites
     - Builds web app (if needed)
     - Syncs Capacitor
     - Builds both Debug and Release APKs
     - Provides detailed output and troubleshooting

## Building APKs and AABs

### Quick Build (All)
```powershell
.\build-all-apks.ps1
```
Builds both APKs (Debug & Release) and AAB (Android App Bundle)

### Build Options
```powershell
# Build only APKs (no AAB)
.\build-all-apks.ps1 -APKOnly

# Build only AAB for Google Play Store
.\build-all-apks.ps1 -AABOnly

# Skip cleaning previous builds
.\build-all-apks.ps1 -SkipClean

# Skip Capacitor sync
.\build-all-apks.ps1 -SkipSync

# Build only (skip web build and sync)
.\build-all-apks.ps1 -BuildOnly
```

### Manual Build Steps

1. **Build web app** (if needed):
   ```powershell
   npm run build
   ```

2. **Sync Capacitor**:
   ```powershell
   npx cap sync android
   ```

3. **Build APKs**:
   ```powershell
   cd android
   .\gradlew.bat assembleDebug    # Debug APK
   .\gradlew.bat assembleRelease   # Release APK
   cd ..
   ```

## Build Output Locations

### APK Files
- **Debug APK**: `android/app/build/outputs/apk/debug/app-debug.apk`
- **Release APK**: `android/app/build/outputs/apk/release/app-release.apk`

### AAB Files (Android App Bundle)
- **Release AAB**: `android/app/build/outputs/bundle/release/app-release.aab`
  - Required for Google Play Store uploads
  - Smaller file size than APK
  - Google Play generates optimized APKs for each device

## Requirements

- **Disk Space**: At least 5GB free (recommended 10GB+)
- **Android SDK**: Installed and configured
- **Java JDK**: Version 17 or higher
- **Gradle**: 8.7 (auto-downloaded via wrapper)

## Troubleshooting

### JVM Crashes / Out of Memory
- **Cause**: Low disk space or insufficient memory
- **Solution**: 
  - Free up at least 5GB disk space
  - Clean Gradle cache: `.\gradlew.bat clean --no-daemon`
  - Remove `.gradle` folder if corrupted

### Build Fails with "SDK location not found"
- **Solution**: The build script auto-configures this, but you can manually create `android/local.properties`:
  ```
  sdk.dir=C\:\\Users\\YourUsername\\AppData\\Local\\Android\\Sdk
  ```

### ProGuard Errors
- **Solution**: ProGuard rules are configured in `android/app/proguard-rules.pro`
- If you add new libraries, update the ProGuard rules accordingly

### Gradle Daemon Issues
- Use `--no-daemon` flag to avoid daemon-related issues
- Stop all Gradle daemons: `.\gradlew.bat --stop`

## Current Status

✅ All build configurations are complete
✅ ProGuard rules configured
✅ AndroidX enabled
✅ Gradle and AGP versions updated
⚠️ **Builds currently failing due to low disk space (2.24 GB available)**

## Next Steps

1. **Free up disk space** to at least 5GB (recommended 10GB+)
2. **Run the build script**: `.\build-all-apks.ps1`
3. **APKs will be generated** in the output directories listed above

## Build Variants

Currently configured build types:
- **Debug APK**: Unsigned, debuggable, includes debug symbols
- **Release APK**: Signed (if keystore configured), minified, optimized
- **Release AAB**: Android App Bundle for Google Play Store (signed if keystore configured)

### When to Use Each:
- **Debug APK**: Testing, development, internal distribution
- **Release APK**: Direct installation, sideloading, non-Play Store distribution
- **Release AAB**: Google Play Store uploads (required format)

## Signing Configuration

Release APKs require signing. The build.gradle is configured to use:
- `RELEASE_STORE_FILE` properties (if set)
- `MORPHOSCAN_STORE_FILE` properties (if set)
- Or create a keystore using `android-release-keystore.sh`

## Notes

- The build script automatically handles most configuration
- APK sizes typically range from 20-50MB depending on included assets
- First build takes longer (downloads dependencies)
- Subsequent builds are faster due to caching
