-- Migration: Interactive Learning admin write policies
-- Allows admin/super_admin to manage courses/modules/lessons/quizzes
-- Idempotent / safe to re-run

-- Ensure RLS is enabled (no-op if already enabled)
ALTER TABLE IF EXISTS learning_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS learning_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS learning_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS learning_quizzes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- learning_modules
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='learning_modules' AND policyname='Admins can manage learning modules'
  ) THEN
    CREATE POLICY "Admins can manage learning modules"
      ON learning_modules
      FOR ALL
      USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')))
      WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')));
  END IF;

  -- learning_lessons
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='learning_lessons' AND policyname='Admins can manage learning lessons'
  ) THEN
    CREATE POLICY "Admins can manage learning lessons"
      ON learning_lessons
      FOR ALL
      USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')))
      WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')));
  END IF;

  -- learning_quizzes
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='learning_quizzes' AND policyname='Admins can manage learning quizzes'
  ) THEN
    CREATE POLICY "Admins can manage learning quizzes"
      ON learning_quizzes
      FOR ALL
      USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')))
      WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role::text IN ('admin','super_admin')));
  END IF;
END $$;
