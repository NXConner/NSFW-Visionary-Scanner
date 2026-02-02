# Android Sync, Build, and GitHub Update Instructions

## Quick Start

Run the automated script:

```powershell
.\scripts\android-sync-build-git.ps1
```

## Manual Steps

### 1. Sync Android with Capacitor

```powershell
npx cap sync android
```

This syncs the web build (`dist` folder) with the Android project.

### 2. Build Android APK

#### Option A: Using Gradle (Command Line)

```powershell
cd android
.\gradlew.bat assembleRelease
cd ..
```

APK will be created at: `android\app\build\outputs\apk\release\app-release.apk`

#### Option B: Using Android Studio

1. Open Android Studio
2. File > Open > Select the `android` folder
3. Wait for Gradle sync
4. Build > Build Bundle(s) / APK(s) > Build APK(s)
5. APK location: `android\app\build\outputs\apk\release\`

### 3. Update GitHub Repository

```powershell
# Check status
git status

# Add all changes
git add .

# Commit changes
git commit -m "Sync Android, rebuild APK, and fix export issues"

# Push to GitHub
git push
```

## Troubleshooting

### Build Errors

If you encounter build errors related to exports:

- Check for circular export references
- Ensure all imports use correct paths
- Run `npm run build` first to verify web build works

### Gradle Issues

If Gradle wrapper is missing:

```powershell
.\init-android-build.ps1
```

### Sync Issues

If Capacitor sync fails:

1. Ensure `dist` folder exists (run `npm run build` first)
2. Check `capacitor.config.ts` is correct
3. Verify Android project structure is intact

## Files Modified

The following files were fixed for build issues:

- `src/dlc/core/DLCManager.ts` - Fixed export chain
- `src/dlc/core/index.ts` - Fixed export path
- `src/dlc/core/ContentLoader.ts` - Fixed import path
- `src/dlc/context/DLCContext.tsx` - Fixed import path
- `src/dlc/security/SecureDownloader.ts` - Fixed export
- `src/dlc/security/index.ts` - Fixed export path
- `src/components/CalibrationVerifyWizard.tsx` - Fixed export
- `src/components/ScanHistoryComparison.tsx` - Fixed export
- `src/components/NSFWCommunityForum.tsx` - Fixed export
- `src/components/SexualWellnessTracking.tsx` - Fixed export
- `src/components/SexualHealthEducation.tsx` - Fixed export
- `src/components/NSFWAdvancedFeatures.tsx` - Fixed export
- `src/components/PEProgressPhotos.tsx` - Fixed export
- `src/components/LiveSupportChat.tsx` - Fixed export
- `src/components/InteractiveLearning.tsx` - Fixed export
- `src/components/ExpertContentConsultations.tsx` - Fixed export
- `src/components/ExhaustiveReportGenerator.tsx` - Fixed export
- `src/components/CommunityForum.tsx` - Fixed export
- `src/components/AIEnhancedScanning.tsx` - Fixed export

## Notes

- APK files are not committed to git (in `.gitignore`)
- Only source code changes are committed
- Build artifacts remain local
