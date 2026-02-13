-- Migration: user_preferences.settings JSONB (idempotent)
-- Purpose:
-- - Enable full cross-device settings sync (including wallpaper metadata) without adding dozens of columns.
-- - Keep existing scalar columns for backwards compatibility with older clients.

ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT NULL;

