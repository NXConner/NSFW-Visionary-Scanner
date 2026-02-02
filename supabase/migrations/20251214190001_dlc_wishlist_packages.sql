-- Migration: DLC wishlist for dlc_packages
-- Purpose: Persist DLC store wishlist for the new dlc_packages system
-- Idempotent / safe to re-run

CREATE TABLE IF NOT EXISTS dlc_wishlist_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  package_id TEXT NOT NULL REFERENCES dlc_packages(package_id) ON DELETE CASCADE,

  priority INTEGER DEFAULT 0,
  notify_on_sale BOOLEAN DEFAULT true,
  notify_on_release BOOLEAN DEFAULT true,
  notes TEXT,

  added_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, package_id)
);

CREATE INDEX IF NOT EXISTS idx_dlc_wishlist_packages_user_id ON dlc_wishlist_packages(user_id);
CREATE INDEX IF NOT EXISTS idx_dlc_wishlist_packages_package_id ON dlc_wishlist_packages(package_id);

ALTER TABLE dlc_wishlist_packages ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'dlc_wishlist_packages'
      AND policyname = 'Users can manage own DLC wishlist packages'
  ) THEN
    CREATE POLICY "Users can manage own DLC wishlist packages"
      ON dlc_wishlist_packages
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;
