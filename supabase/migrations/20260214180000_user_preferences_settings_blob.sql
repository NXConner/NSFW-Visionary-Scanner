-- Migration: user_preferences settings_blob (cross-device persistence)
-- Purpose:
-- - Store a versioned JSON blob of ALL UI/user settings for cross-device persistence.
-- - Keep legacy per-column fields for compatibility.
-- Idempotent: safe to re-run.

DO $$
BEGIN
  IF to_regclass('public.user_preferences') IS NULL THEN
    RAISE NOTICE 'Skipping settings_blob migration: public.user_preferences does not exist';
    RETURN;
  END IF;

  ALTER TABLE public.user_preferences
    ADD COLUMN IF NOT EXISTS settings_blob jsonb DEFAULT '{}'::jsonb;

  -- Backfill blob for existing rows when NULL (best-effort).
  UPDATE public.user_preferences
  SET settings_blob = jsonb_strip_nulls(
    jsonb_build_object(
      'theme', theme,
      'themePreset', theme_preset,
      'fontSize', font_size,
      'colorBlindMode', color_blind_mode,
      'hapticEnabled', haptic_enabled,
      'notificationsEnabled', notifications_enabled,
      'reminderTime', reminder_time,
      'reminderDays', reminder_days
    )
  )
  WHERE settings_blob IS NULL;
END $$;

