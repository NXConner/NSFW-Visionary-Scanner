---
title: Data Retention Policy
status: active
owner: Security & Compliance
last_updated: 2026-02-03
---

# Data Retention Policy

This document defines how MorphoScan Pro handles data retention, cleanup, and deletion to meet
privacy and compliance requirements (GDPR-aligned).

## Scope

The policy covers:

- **Scan history** (`scan_history`)
- **Health diary entries** (`health_diary`)
- **Device tokens** (`device_tokens`)
- **Partner sync data** (`partner_sync_*` tables, via per-connection retention policies)

## User-Controlled Retention

Retention is controlled per user through **Data Retention Settings** in the app:

- Scan history retention (default: 365 days)
- Health diary retention (default: 730 days)
- Automatic cleanup toggle
- Notification before deletion

Preferences are stored in:

- `public.user_preferences.data_retention_preferences` (JSONB)

## Automated Cleanup

### Edge Function

Cleanup is performed by the Edge Function:

- `supabase/functions/data-retention-cleanup`

This function:

- Normalizes user retention preferences
- Deletes expired data for each user
- Sends notification emails prior to deletion (when enabled)
- Removes stale device tokens (90 days since last use)

### Scheduling

Configure a scheduled invocation in Supabase:

1. **Supabase Dashboard → Edge Functions → data-retention-cleanup**
2. Add a schedule (recommended: daily at 02:00 UTC)
3. Provide the secret header if enabled (see below)

### Security

If `DATA_RETENTION_SECRET` is configured, the function requires:

- Header: `x-retention-secret: <DATA_RETENTION_SECRET>`

Alternatively, the function accepts a **service role** Authorization header.

## Partner Sync Retention

Partner sync retention is configured per connection in:

- `public.partner_sync_retention_policies`

Cleanup can be triggered via:

- `public.partner_sync_apply_retention(p_connection_id UUID)`

## Notification Emails

Email notifications are sent via Resend when:

- `notify_before_deletion = true`
- Data is within the configured notification window

Email events are logged to:

- `public.email_send_events`

## Defaults

| Category | Default Retention | Notes |
|---|---:|---|
| Scan History | 365 days | User configurable |
| Health Diary | 730 days | User configurable |
| Device Tokens | 90 days | System-managed |

## Operational Checklist

- [ ] Configure `DATA_RETENTION_SECRET` in Supabase secrets
- [ ] Schedule daily Edge Function run
- [ ] Verify retention preferences are saved per user
- [ ] Verify email notifications are delivered
- [ ] Monitor deletion counts in logs

