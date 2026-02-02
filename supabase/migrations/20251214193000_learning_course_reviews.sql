-- Migration: learning_course_reviews
-- Adds course review/rating support for Interactive Learning
-- Idempotent / safe to re-run

CREATE TABLE IF NOT EXISTS learning_course_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES learning_courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(course_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_learning_course_reviews_course_id ON learning_course_reviews(course_id);
CREATE INDEX IF NOT EXISTS idx_learning_course_reviews_user_id ON learning_course_reviews(user_id);

ALTER TABLE learning_course_reviews ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'learning_course_reviews'
      AND policyname = 'Anyone can view course reviews'
  ) THEN
    CREATE POLICY "Anyone can view course reviews"
      ON learning_course_reviews
      FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'learning_course_reviews'
      AND policyname = 'Users can manage own course reviews'
  ) THEN
    CREATE POLICY "Users can manage own course reviews"
      ON learning_course_reviews
      FOR ALL
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_learning_course_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_learning_course_reviews_updated_at ON learning_course_reviews;
CREATE TRIGGER trg_learning_course_reviews_updated_at
  BEFORE UPDATE ON learning_course_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_learning_course_reviews_updated_at();
