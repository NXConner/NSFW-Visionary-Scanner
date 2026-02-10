# Push Notification Backend - Complete ✅

## Summary

Push notification backend infrastructure has been completed. All necessary components for server-side notification triggers, device token management, and notification scheduling are in place.

## Completed Components

### 1. Database Schema ✅

- **device_tokens table** (`supabase/migrations/20251205000000_device_tokens.sql`)
  - Stores FCM device tokens
  - Tracks platform (iOS/Android/Web)
  - Device metadata (ID, name, app version)
  - RLS policies for security
  - Automatic timestamp updates

### 2. Edge Functions ✅

#### register-device-token

- **File**: `supabase/functions/register-device-token/index.ts`
- **Purpose**: Register/update device tokens when users enable push notifications
- **Features**:
  - Validates user authentication
  - Upserts device tokens (handles duplicates)
  - Tracks device metadata
  - Updates last_used_at timestamp

#### send-push-notification

- **File**: `supabase/functions/send-push-notification/index.ts` (existing)
- **Purpose**: Send FCM notifications to device tokens
- **Features**:
  - OAuth2 authentication with Firebase
  - Batch notification sending
  - Error handling and retry logic
  - Response tracking

#### send-health-reminder

- **File**: `supabase/functions/send-health-reminder/index.ts` ✅ NEW
- **Purpose**: Send health reminder notifications to all users with reminders enabled
- **Features**:
  - Queries users with health reminders enabled
  - Fetches device tokens
  - Sends bulk notifications
  - Tracks success/failure

### 3. Frontend Utilities ✅

- **pushNotifications.ts** (`src/lib/pushNotifications.ts`) ✅ NEW
  - `registerDeviceToken()` - Register device token with backend
  - `sendPushNotification()` - Send notification to specific user
  - `sendBulkPushNotification()` - Send to multiple users
  - `removeDeviceToken()` - Remove token on logout
  - `getPlatform()` - Get current platform

### 4. Hook Integration ✅

- **usePushNotifications** (`src/hooks/usePushNotifications.ts`) ✅ UPDATED
  - Automatically registers device token when received
  - Integrates with backend token registration
  - Handles token updates

## Notification Types Supported

1. **Health Reminders**
   - Daily health check reminders
   - Triggered via `send-health-reminder` function
   - User preference controlled

2. **Medication Reminders**
   - Scheduled medication notifications
   - Local notifications (client-side)
   - Can be extended to remote notifications

3. **Scan Reminders**
   - Reminders to perform scans
   - User preference controlled

4. **Weekly Reports**
   - Weekly health summary notifications
   - Scheduled notifications

5. **Custom Notifications**
   - Any notification type via `send-push-notification`
   - Supports custom data payloads

## Setup Instructions

### 1. Run Database Migration

```sql
-- Run the migration file
supabase/migrations/20251205000000_device_tokens.sql
```

### 2. Configure Firebase

1. Go to Firebase Console → Project Settings
2. Generate Service Account Key
3. Add to Supabase secrets as `FIREBASE_SERVICE_ACCOUNT`
4. Configure APNs for iOS (if supporting iOS)

### 3. Deploy Edge Functions

```bash
# Deploy all functions
supabase functions deploy register-device-token
supabase functions deploy send-health-reminder
supabase functions deploy send-push-notification
```

### 4. Set Up Scheduled Tasks (Optional)

Use a cron job or scheduled function to trigger `send-health-reminder`:

- Daily at 10 AM
- Weekly on Mondays
- Custom schedules

## Usage Examples

### Register Device Token

```typescript
import { registerDeviceToken, getPlatform } from "@/lib/pushNotifications";

const platform = getPlatform();
await registerDeviceToken({
  token: "fcm_token_here",
  platform,
  deviceName: "iPhone 15 Pro",
  appVersion: "1.0.0",
});
```

### Send Notification to User

```typescript
import { sendPushNotification } from "@/lib/pushNotifications";

await sendPushNotification(userId, "Health Reminder", "Time for your daily health check!", {
  type: "health_reminder",
  action: "open_scanner",
});
```

### Send Bulk Notifications

```typescript
import { sendBulkPushNotification } from "@/lib/pushNotifications";

const result = await sendBulkPushNotification(
  ["user1", "user2", "user3"],
  "Weekly Report",
  "Your weekly health report is ready!",
  { type: "weekly_report" },
);
```

### Trigger Health Reminders (Server-side)

```typescript
// Via Edge Function
const { data, error } = await supabase.functions.invoke("send-health-reminder");
```

## Notification Payload Structure

```typescript
{
  title: string          // Notification title
  body: string           // Notification body
  data?: {               // Custom data
    type: string         // Notification type
    action?: string      // Action to perform
    [key: string]: string
  }
  imageUrl?: string      // Optional image
}
```

## Security

- ✅ RLS policies on device_tokens table
- ✅ User authentication required for token registration
- ✅ Users can only manage their own tokens
- ✅ Service account authentication for FCM
- ✅ Token validation before sending

## Testing

### Test Device Token Registration

1. Enable push notifications in app
2. Check `device_tokens` table for new entry
3. Verify token is associated with correct user

### Test Notification Sending

1. Use Firebase Console to send test notification
2. Or call `send-push-notification` Edge Function
3. Verify notification received on device

### Test Health Reminders

1. Enable health reminders in user preferences
2. Call `send-health-reminder` Edge Function
3. Verify notifications sent to all enabled users

## Next Steps

1. **Set Up Cron Jobs**
   - Daily health reminders
   - Weekly reports
   - Custom schedules

2. **Add More Notification Types**
   - Scan completion notifications
   - Progress milestone notifications
   - Subscription expiration warnings

3. **Analytics**
   - Track notification delivery rates
   - Monitor open rates
   - Analyze user engagement

4. **A/B Testing**
   - Test different notification messages
   - Optimize send times
   - Improve engagement

## Environment Variables Required

```env
# Firebase Service Account (JSON string)
FIREBASE_SERVICE_ACCOUNT={"type":"service_account",...}

# Supabase (auto-configured)
SUPABASE_URL=https://...
SUPABASE_SERVICE_ROLE_KEY=...
```

## Database Tables

- **device_tokens**
  - `id` - UUID primary key
  - `user_id` - Foreign key to auth.users
  - `token` - FCM device token
  - `platform` - ios/android/web
  - `device_id` - Optional device identifier
  - `device_name` - Optional device name
  - `app_version` - App version
  - `created_at` - Creation timestamp
  - `updated_at` - Last update timestamp
  - `last_used_at` - Last notification sent timestamp

## Notes

- Device tokens are automatically registered when push notifications are enabled
- Tokens are updated on each app launch
- Old/invalid tokens should be cleaned up periodically
- Consider implementing token refresh logic
- Monitor FCM quota limits

---

**Status**: ✅ Complete - Ready for production use after FCM configuration
