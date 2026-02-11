# Push Notifications Setup Guide — MorphoScan Pro (Android FCM + iOS APNs)

This guide covers setting up **remote** push notifications for MorphoScan Pro:

- **Android**: Firebase Cloud Messaging (**FCM**)
- **iOS**: Apple Push Notification service (**APNs**)

## Canonical app identifiers (current repo)

- **Android applicationId**: `com.morphoscan.pro` (see `android/app/build.gradle`)
- **iOS bundle id**: `com.morphoscan.pro` (see `ios/App/App/Info.plist`)

## Prerequisites

- Firebase project
- Apple Developer account access (for APNs key)
- Android Studio + SDK
- Xcode (macOS)

## Step 1: Create Firebase project

1. Firebase Console → “Add project”
2. Project name: `MorphoScan Pro` (or your org naming)

## Step 2: Android (FCM)

1. Firebase Console → Project Overview → Add app → Android
2. Package name: `com.morphoscan.pro`
3. Download `google-services.json`
4. Place it at **`android/app/google-services.json`** (do not commit)

### Android build wiring (required)

- Ensure the Google Services Gradle plugin is configured.
  - Add `classpath 'com.google.gms:google-services:<version>'` to `android/build.gradle`.
  - Apply `com.google.gms.google-services` in `android/app/build.gradle`.

Then sync and rebuild.

## Step 3: iOS (APNs)

MorphoScan Pro uses Capacitor Push Notifications on iOS, which registers **APNs device tokens** (not FCM tokens).

### APNs key (token-based auth)

1. Apple Developer Portal → Keys → create **Apple Push Notifications service (APNs)** key
2. Download the `.p8` file and note:
   - **Key ID**
   - **Team ID**
3. Store these as **server-side secrets** for the Supabase Edge Function `send-push-notification`:
   - `APNS_KEY_P8` (full `.p8` content, including header/footer)
   - `APNS_KEY_ID`
   - `APNS_TEAM_ID`
   - `APNS_BUNDLE_ID` = `com.morphoscan.pro`
   - Optional: `APNS_USE_SANDBOX=true` for TestFlight/dev

## Step 4: Firebase service account key (server-side, Android only)

1. Firebase Console → Project Settings → Service Accounts
2. “Generate new private key” (JSON)
3. Store JSON securely and set Supabase secret:

- `FIREBASE_SERVICE_ACCOUNT` = **full JSON content**

## Step 5: Test end-to-end

- Android: Use Firebase Console → Messaging to send a test message (or use the edge function).
- iOS: Validate server-side delivery through the edge function using **platform-aware targets**.

### Edge function payload (recommended)

Send `targets` so the function can route Android via FCM and iOS via APNs:

```json
{
  "title": "Test",
  "body": "Hello",
  "targets": [
    { "platform": "android", "token": "<fcm-token>" },
    { "platform": "ios", "token": "<apns-token>" }
  ]
}
```

## Step 6: Scheduled reminder functions (automation)

The following **scheduled** edge functions drive recurring reminders. Configure schedules in the
Supabase dashboard (Scheduled Functions) or your automation tooling:

- `send-health-reminder` (daily health + scan reminders)
- `send-medication-reminder` (medication schedule reminders)
- `send-weekly-report` (weekly report notifications)

Recommended schedule: **every minute** (each function performs timezone + schedule checks per user).

Notes:

- These functions require `SUPABASE_SERVICE_ROLE_KEY` in the function environment.
- User preferences are stored in `user_preferences.notification_preferences`.
- If you disable push reminders in Settings, these functions skip the user automatically.

## Notes

- Local notifications are handled by Capacitor; this doc is for **remote** pushes.
- Never expose service account / APNs keys in client code.
