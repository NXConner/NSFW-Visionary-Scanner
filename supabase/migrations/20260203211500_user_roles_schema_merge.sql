-- Legacy compatibility + policy hardening for user_roles
-- - Ensures app_role enum exists and includes admin/pro/user/super_admin
-- - Migrates legacy user_roles.role_id to user_roles.role when needed
-- - Updates user_roles policies to allow admin OR super_admin

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'app_role'
  ) THEN
    CREATE TYPE public.app_role AS ENUM ('admin', 'pro', 'user', 'super_admin');
  ELSE
    BEGIN
      ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'pro';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'user';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
    BEGIN
      ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
    EXCEPTION WHEN duplicate_object THEN NULL;
    END;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.user_roles') IS NOT NULL THEN
    IF EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_roles'
        AND column_name = 'role_id'
    ) AND NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'user_roles'
        AND column_name = 'role'
    ) THEN
      ALTER TABLE public.user_roles ADD COLUMN role public.app_role;

      IF to_regclass('public.roles') IS NOT NULL THEN
        UPDATE public.user_roles ur
        SET role = CASE lower(r.name)
          WHEN 'super_admin' THEN 'super_admin'::public.app_role
          WHEN 'admin' THEN 'admin'::public.app_role
          WHEN 'pro' THEN 'pro'::public.app_role
          WHEN 'clinician' THEN 'pro'::public.app_role
          WHEN 'patient' THEN 'user'::public.app_role
          WHEN 'user' THEN 'user'::public.app_role
          ELSE 'user'::public.app_role
        END
        FROM public.roles r
        WHERE ur.role_id = r.id
          AND ur.role IS NULL;
      END IF;

      UPDATE public.user_roles
      SET role = 'user'
      WHERE role IS NULL;

      ALTER TABLE public.user_roles ALTER COLUMN role SET NOT NULL;
    END IF;

    IF NOT EXISTS (
      SELECT 1
      FROM pg_constraint
      WHERE conname = 'user_roles_unique_assignment'
        AND conrelid = 'public.user_roles'::regclass
    ) THEN
      ALTER TABLE public.user_roles
      ADD CONSTRAINT user_roles_unique_assignment UNIQUE (user_id, role);
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF to_regclass('public.user_roles') IS NOT NULL THEN
    EXECUTE 'ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY';

    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles';
    EXECUTE 'CREATE POLICY "Users can view their own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id)';

    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles';
    EXECUTE 'CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (public.has_role(auth.uid(), ''admin'') OR public.has_role(auth.uid(), ''super_admin''))';

    EXECUTE 'DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles';
    EXECUTE 'CREATE POLICY "Admins can insert roles" ON public.user_roles FOR INSERT WITH CHECK (public.has_role(auth.uid(), ''admin'') OR public.has_role(auth.uid(), ''super_admin''))';

    EXECUTE 'DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles';
    EXECUTE 'CREATE POLICY "Admins can delete roles" ON public.user_roles FOR DELETE USING (public.has_role(auth.uid(), ''admin'') OR public.has_role(auth.uid(), ''super_admin''))';
  END IF;
END $$;
