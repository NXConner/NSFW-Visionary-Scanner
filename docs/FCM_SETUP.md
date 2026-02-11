# Firebase Cloud Messaging (FCM) Setup Guide

This guide covers setting up Firebase Cloud Messaging for remote push notifications in GrowthTracker.

## Prerequisites

- Google Account
- Firebase Project
- Android Studio (for Android)
- Xcode (for iOS)

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project"
3. Enter project name: "GrowthTracker"
4. Enable Google Analytics (optional)
5. Click "Create project"

## Step 2: Add Android App

1. In Firebase Console, click "Add app" → Android
2. Enter package name: `app.lovable.0b696f8a6a684651ba80ae9256f5e910`
3. Enter app nickname: "GrowthTracker Android"
4. Download `google-services.json`
5. Place file in `android/app/google-services.json`

### Configure Android Build

Add to `android/build.gradle`:

```gradle
buildscript {
    dependencies {
        classpath 'com.google.gms:google-services:4.4.0'
    }
}
```

Add to `android/app/build.gradle`:

```gradle
apply plugin: 'com.google.gms.google-services'

dependencies {
    implementation platform('com.google.firebase:firebase-bom:32.7.0')
    implementation 'com.google.firebase:firebase-messaging'
}
```

## Step 3: Add iOS App

1. In Firebase Console, click "Add app" → iOS
2. Enter bundle ID: `app.lovable.0b696f8a6a684651ba80ae9256f5e910`
3. Enter app nickname: "GrowthTracker iOS"
4. Download `GoogleService-Info.plist`
5. Add to Xcode project root

### Configure iOS

1. In Xcode, enable Push Notifications capability
2. Enable Background Modes → Remote notifications
3. Add to `ios/App/App/AppDelegate.swift`:

```swift
import Firebase

func application(_ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    FirebaseApp.configure()
    return true
}
```

## Step 4: Generate Service Account Key

1. Go to Firebase Console → Project Settings → Service Accounts
2. Click "Generate new private key"
3. Download JSON file
4. Add to Supabase secrets as `FIREBASE_SERVICE_ACCOUNT`

### Add Secret to Lovable

The `FIREBASE_SERVICE_ACCOUNT` secret should contain the entire JSON content of your service account key file.

## Step 5: Configure APNs for iOS

1. Go to [Apple Developer Portal](https://developer.apple.com)
2. Navigate to Certificates, Identifiers & Profiles
3. Create an APNs Key:
   - Keys → + → Apple Push Notifications service (APNs)
   - Download the .p8 file
4. In Firebase Console → Project Settings → Cloud Messaging
5. Upload the APNs key under "Apple app configuration"
6. Enter Key ID and Team ID

## Step 6: Test Push Notifications

### Using Firebase Console

1. Go to Firebase Console → Messaging
2. Click "Create your first campaign"
3. Select "Firebase Notification messages"
4. Enter notification details
5. Select target (specific device or topic)
6. Send test message

### Using Edge Function

```javascript
// Example: Send notification via edge function
const response = await fetch("/functions/v1/send-push-notification", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${supabaseAnonKey}`,
  },
  body: JSON.stringify({
    tokens: ["device_fcm_token_here"],
    title: "Health Reminder",
    body: "Time for your daily health check!",
    data: {
      type: "health_reminder",
      action: "open_scanner",
    },
  }),
});
```

## Push Notification Types

### Health Reminders

```json
{
  "title": "📊 Health Check Reminder",
  "body": "Time for your daily health tracking!",
  "data": { "type": "health_reminder" }
}
```

### Medication Reminders

```json
{
  "title": "💊 Medication Reminder",
  "body": "Time to take your [medication_name]",
  "data": { "type": "medication", "medication_id": "xxx" }
}
```

### Weekly Reports

```json
{
  "title": "📈 Weekly Health Report",
  "body": "Your weekly summary is ready!",
  "data": { "type": "weekly_report" }
}
```

### Progress Milestones

```json
{
  "title": "🎉 Milestone Achieved!",
  "body": "You've reached your 30-day tracking goal!",
  "data": { "type": "milestone", "milestone_id": "xxx" }
}
```

## Notification Channels (Android)

The app uses these notification channels:

| Channel ID         | Name             | Importance |
| ------------------ | ---------------- | ---------- |
| `health_reminders` | Health Reminders | High       |
| `medication`       | Medication       | High       |
| `reports`          | Reports          | Default    |
| `general`          | General          | Default    |

## Troubleshooting

### Notifications Not Received

1. **Check device token** - Ensure token is valid and not expired
2. **Check Firebase configuration** - Verify google-services.json/GoogleService-Info.plist
3. **Check permissions** - User must grant notification permissions
4. **Check background modes** - iOS requires background modes enabled

### iOS Specific Issues

- APNs certificate must be valid and not expired
- Team ID and Key ID must match Apple Developer account
- Bundle ID must match exactly

### Android Specific Issues

- Check google-services.json is in correct location
- Verify package name matches
- Check ProGuard rules don't strip Firebase classes

## Security Best Practices

1. **Never expose service account** in client code
2. **Use server-side sending** via edge functions
3. **Validate user authentication** before sending notifications
4. **Rate limit** notification requests
5. **Log all notification** sends for audit purposes

## Rate Limits

Firebase FCM limits:

- 1,000 messages per device per day
- 1,000,000 messages per minute per project
- 10 topics per device

## Resources

- [Firebase Cloud Messaging Docs](https://firebase.google.com/docs/cloud-messaging)
- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [APNs Documentation](https://developer.apple.com/documentation/usernotifications)
