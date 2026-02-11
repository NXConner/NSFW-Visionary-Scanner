# Android Security Configuration

This document outlines the security measures implemented in the Android APK builds.

## Security Features Enabled

### 1. ProGuard/R8 Code Obfuscation

- **Code shrinking**: Removes unused classes, methods, and fields
- **Code obfuscation**: Renames classes and methods to prevent reverse engineering
- **Optimization**: Multiple optimization passes for performance
- **Log stripping**: All `Log.d()`, `Log.v()`, `Log.i()` calls removed in release builds

### 2. Network Security

- **HTTPS Only**: All cleartext (HTTP) traffic is blocked
- **Certificate Pinning Ready**: Network security config supports certificate pinning
- **Domain restrictions**: Only trusted domains (morphoscanpro.com, supabase.co) are configured

### 3. Data Protection

- **Encrypted Storage**: Using AndroidX Security Crypto for sensitive data
- **Backup Exclusions**: Sensitive files excluded from cloud backups:
  - `auth_tokens.xml`
  - `secure_storage.xml`
  - `device_id.xml`
  - `license_data.xml`
- **No Legacy External Storage**: `requestLegacyExternalStorage="false"`

### 4. Build Security

- **minifyEnabled**: Code shrinking enabled for release builds
- **shrinkResources**: Unused resources removed
- **zipAlignEnabled**: APK optimization for performance
- **multiDexEnabled**: Support for large apps

## Building a Signed Release APK

### Prerequisites

1. Java JDK 17
2. Android SDK (API 34+)
3. A signing keystore

### Generate a Signing Keystore

```bash
keytool -genkey -v -keystore morphoscan-release.keystore \
  -alias morphoscan \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

### Configure Signing

Create `android/keystore.properties` (DO NOT commit this file):

```properties
MORPHOSCAN_STORE_FILE=../morphoscan-release.keystore
MORPHOSCAN_STORE_PASSWORD=your_store_password
MORPHOSCAN_KEY_ALIAS=morphoscan
MORPHOSCAN_KEY_PASSWORD=your_key_password
```

### Build Release APK

```bash
# From project root
npm run build
npx cap sync android

# From android directory
cd android
./gradlew assembleRelease
```

The signed APK will be at: `android/app/build/outputs/apk/release/app-release.apk`

### Build Release AAB (for Google Play)

```bash
./gradlew bundleRelease
```

The signed AAB will be at: `android/app/build/outputs/bundle/release/app-release.aab`

## Security Checklist for Production

- [ ] Generate a strong signing keystore (RSA 2048-bit minimum)
- [ ] Store keystore securely (never commit to git)
- [ ] Enable Google Play App Signing
- [ ] Test with `./gradlew lint` for security issues
- [ ] Run APK through security scanner (e.g., MobSF)
- [ ] Verify HTTPS-only traffic with network inspector
- [ ] Test biometric authentication flows
- [ ] Verify sensitive data is not in backups

## Files Modified for Security

| File                                                       | Purpose                         |
| ---------------------------------------------------------- | ------------------------------- |
| `android/app/proguard-rules.pro`                           | Main ProGuard rules             |
| `android/proguard-rules.pro`                               | Root-level ProGuard rules       |
| `android/app/src/main/res/xml/network_security_config.xml` | HTTPS enforcement               |
| `android/app/src/main/res/xml/backup_rules.xml`            | Backup exclusions (Android <12) |
| `android/app/src/main/res/xml/data_extraction_rules.xml`   | Backup exclusions (Android 12+) |
| `android/app/src/main/AndroidManifest.xml`                 | Security attributes             |
