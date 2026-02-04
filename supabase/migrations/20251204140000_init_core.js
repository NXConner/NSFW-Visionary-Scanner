exports.up = pgm => {
  pgm.sql('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

  pgm.sql(`
    DO $$
    BEGIN
      BEGIN
        CREATE TYPE public.app_role AS ENUM ('admin', 'pro', 'user');
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END;
    END $$;
  `);

  pgm.sql(`
    DO $$
    BEGIN
      BEGIN
        ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
      EXCEPTION
        WHEN undefined_object THEN NULL;
      END;
    END $$;
  `);

  pgm.createTable(
    { schema: "public", name: "user_roles" },
    {
      id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
      user_id: {
        type: "uuid",
        notNull: true,
        references: { schema: "auth", name: "users" },
        onDelete: "CASCADE",
      },
      role: { type: "app_role", notNull: true },
      created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    },
    { ifNotExists: true },
  );

  pgm.addConstraint("public.user_roles", "user_roles_unique_assignment", {
    unique: ["user_id", "role"],
    ifNotExists: true,
  });

  pgm.createTable(
    { schema: "public", name: "profiles" },
    {
      id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
      user_id: {
        type: "uuid",
        notNull: true,
        unique: true,
        references: { schema: "auth", name: "users" },
        onDelete: "CASCADE",
      },
      display_name: { type: "text" },
      email: { type: "text" },
      created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
      updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    },
    { ifNotExists: true },
  );

  pgm.createTable(
    { schema: "public", name: "scan_history" },
    {
      id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
      user_id: {
        type: "uuid",
        notNull: true,
        references: { schema: "auth", name: "users" },
        onDelete: "CASCADE",
      },
      scan_type: { type: "text", notNull: true, default: "3d" },
      length: { type: "numeric(5,2)" },
      circumference: { type: "numeric(5,2)" },
      curvature_angle: { type: "numeric(5,2)" },
      curvature_direction: { type: "text" },
      image_path: { type: "text" },
      notes: { type: "text" },
      created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    },
    { ifNotExists: true },
  );

  pgm.createTable(
    { schema: "public", name: "health_diary" },
    {
      id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
      user_id: {
        type: "uuid",
        notNull: true,
        references: { schema: "auth", name: "users" },
        onDelete: "CASCADE",
      },
      entry_date: { type: "date", notNull: true, default: pgm.func("current_date") },
      length: { type: "numeric(5,2)" },
      circumference: { type: "numeric(5,2)" },
      curvature_angle: { type: "numeric(5,2)" },
      curvature_direction: { type: "text" },
      symptoms: { type: "text[]" },
      pain_level: { type: "integer", check: "pain_level >= 0 AND pain_level <= 10" },
      notes: { type: "text" },
      created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
      updated_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    },
    { ifNotExists: true },
  );

  pgm.sql("ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;");
  pgm.sql("ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;");
  pgm.sql("ALTER TABLE public.health_diary ENABLE ROW LEVEL SECURITY;");
  pgm.sql("ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;");

  pgm.sql(`
    DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
    CREATE POLICY "Users can view own profile" ON public.profiles
      FOR SELECT USING (auth.uid() = user_id);
  `);
  pgm.sql(`
    DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
    CREATE POLICY "Users can update own profile" ON public.profiles
      FOR UPDATE USING (auth.uid() = user_id);
  `);
  pgm.sql(`
    DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
    CREATE POLICY "Users can insert own profile" ON public.profiles
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  `);
  pgm.sql(`
    DROP POLICY IF EXISTS "Users can view own scans" ON public.scan_history;
    CREATE POLICY "Users can view own scans" ON public.scan_history
      FOR SELECT USING (auth.uid() = user_id);
  `);
  pgm.sql(`
    DROP POLICY IF EXISTS "Users can insert own scans" ON public.scan_history;
    CREATE POLICY "Users can insert own scans" ON public.scan_history
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  `);
  pgm.sql(`
    DROP POLICY IF EXISTS "Users can delete own scans" ON public.scan_history;
    CREATE POLICY "Users can delete own scans" ON public.scan_history
      FOR DELETE USING (auth.uid() = user_id);
  `);
  pgm.sql(`
    DROP POLICY IF EXISTS "Users can view own diary" ON public.health_diary;
    CREATE POLICY "Users can view own diary" ON public.health_diary
      FOR SELECT USING (auth.uid() = user_id);
  `);
  pgm.sql(`
    DROP POLICY IF EXISTS "Users can insert diary entries" ON public.health_diary;
    CREATE POLICY "Users can insert diary entries" ON public.health_diary
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  `);
  pgm.sql(`
    DROP POLICY IF EXISTS "Users can update own diary entries" ON public.health_diary;
    CREATE POLICY "Users can update own diary entries" ON public.health_diary
      FOR UPDATE USING (auth.uid() = user_id);
  `);
  pgm.sql(`
    DROP POLICY IF EXISTS "Users can delete own diary entries" ON public.health_diary;
    CREATE POLICY "Users can delete own diary entries" ON public.health_diary
      FOR DELETE USING (auth.uid() = user_id);
  `);

  pgm.sql(`
    CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
    RETURNS BOOLEAN
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $$
      SELECT EXISTS (
        SELECT 1
        FROM public.user_roles
        WHERE user_id = _user_id
          AND role = _role
      )
    $$;
  `);

  pgm.sql(`
    CREATE OR REPLACE FUNCTION public.get_user_roles(_user_id UUID)
    RETURNS SETOF public.app_role
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $$
      SELECT role
      FROM public.user_roles
      WHERE user_id = _user_id
    $$;
  `);

  pgm.sql(`
    DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
    CREATE POLICY "Users can view their own roles"
    ON public.user_roles
    FOR SELECT
    USING (auth.uid() = user_id);
  `);
  pgm.sql(`
    DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
    CREATE POLICY "Admins can view all roles"
    ON public.user_roles
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
  `);
  pgm.sql(`
    DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
    CREATE POLICY "Admins can insert roles"
    ON public.user_roles
    FOR INSERT
    WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
  `);
  pgm.sql(`
    DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;
    CREATE POLICY "Admins can delete roles"
    ON public.user_roles
    FOR DELETE
    USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'super_admin'));
  `);

  pgm.sql(`
    CREATE OR REPLACE FUNCTION public.update_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = now();
      RETURN NEW;
    END; $$ LANGUAGE plpgsql;
  `);

  pgm.sql(`
    DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
    CREATE TRIGGER update_profiles_updated_at
      BEFORE UPDATE ON public.profiles
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  `);

  pgm.sql(`
    DROP TRIGGER IF EXISTS update_health_diary_updated_at ON public.health_diary;
    CREATE TRIGGER update_health_diary_updated_at
      BEFORE UPDATE ON public.health_diary
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  `);

  pgm.sql(`
    CREATE OR REPLACE FUNCTION public.handle_new_user()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER SET search_path = public
    AS $$
    BEGIN
      INSERT INTO public.profiles (user_id, email)
      VALUES (NEW.id, NEW.email)
      ON CONFLICT (user_id) DO NOTHING;
      RETURN NEW;
    END;
    $$;
  `);

  pgm.sql(`
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    CREATE TRIGGER on_auth_user_created
      AFTER INSERT ON auth.users
      FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
  `);
};

exports.down = pgm => {
  pgm.sql("DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;");
  pgm.sql("DROP FUNCTION IF EXISTS public.handle_new_user;");
  pgm.sql("DROP TRIGGER IF EXISTS update_health_diary_updated_at ON public.health_diary;");
  pgm.sql("DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;");
  pgm.sql("DROP FUNCTION IF EXISTS public.update_updated_at_column;");
  pgm.sql("DROP FUNCTION IF EXISTS public.get_user_roles;");
  pgm.sql("DROP FUNCTION IF EXISTS public.has_role;");

  pgm.sql('DROP POLICY IF EXISTS "Admins can delete roles" ON public.user_roles;');
  pgm.sql('DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;');
  pgm.sql('DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;');
  pgm.sql('DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;');
  pgm.sql('DROP POLICY IF EXISTS "Users can delete own diary entries" ON public.health_diary;');
  pgm.sql('DROP POLICY IF EXISTS "Users can update own diary entries" ON public.health_diary;');
  pgm.sql('DROP POLICY IF EXISTS "Users can insert diary entries" ON public.health_diary;');
  pgm.sql('DROP POLICY IF EXISTS "Users can view own diary" ON public.health_diary;');
  pgm.sql('DROP POLICY IF EXISTS "Users can delete own scans" ON public.scan_history;');
  pgm.sql('DROP POLICY IF EXISTS "Users can insert own scans" ON public.scan_history;');
  pgm.sql('DROP POLICY IF EXISTS "Users can view own scans" ON public.scan_history;');
  pgm.sql('DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;');
  pgm.sql('DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;');
  pgm.sql('DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;');

  pgm.sql("ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;");
  pgm.sql("ALTER TABLE public.health_diary DISABLE ROW LEVEL SECURITY;");
  pgm.sql("ALTER TABLE public.scan_history DISABLE ROW LEVEL SECURITY;");
  pgm.sql("ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;");

  pgm.dropTable({ schema: "public", name: "health_diary" }, { ifExists: true, cascade: true });
  pgm.dropTable({ schema: "public", name: "scan_history" }, { ifExists: true, cascade: true });
  pgm.dropTable({ schema: "public", name: "profiles" }, { ifExists: true, cascade: true });
  pgm.dropTable({ schema: "public", name: "user_roles" }, { ifExists: true, cascade: true });
};
