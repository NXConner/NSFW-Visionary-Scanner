exports.up = pgm => {
  pgm.sql('CREATE EXTENSION IF NOT EXISTS "pgcrypto";');

  pgm.createTable(
    { schema: "public", name: "roles" },
    {
      id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
      name: { type: "text", notNull: true, unique: true },
      description: { type: "text" },
      created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    },
    { ifNotExists: true },
  );

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
      role_id: {
        type: "uuid",
        notNull: true,
        references: { schema: "public", name: "roles" },
        onDelete: "CASCADE",
      },
      assigned_by: {
        type: "uuid",
        references: { schema: "auth", name: "users" },
      },
      created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    },
    { ifNotExists: true },
  );

  pgm.addConstraint("public.user_roles", "user_roles_unique_assignment", {
    unique: ["user_id", "role_id"],
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

  pgm.createTable(
    { schema: "public", name: "audit_logs" },
    {
      id: { type: "uuid", primaryKey: true, default: pgm.func("gen_random_uuid()") },
      user_id: {
        type: "uuid",
        notNull: true,
        references: { schema: "auth", name: "users" },
        onDelete: "CASCADE",
      },
      action: { type: "text", notNull: true },
      description: { type: "text" },
      metadata: { type: "jsonb", default: pgm.func("'{}'::jsonb") },
      created_at: { type: "timestamptz", notNull: true, default: pgm.func("now()") },
    },
    { ifNotExists: true },
  );

  pgm.sql("ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;");
  pgm.sql("ALTER TABLE public.scan_history ENABLE ROW LEVEL SECURITY;");
  pgm.sql("ALTER TABLE public.health_diary ENABLE ROW LEVEL SECURITY;");
  pgm.sql("ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;");
  pgm.sql("ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;");
  pgm.sql("ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;");

  pgm.sql(`
    CREATE POLICY "profiles_select_own" ON public.profiles
      FOR SELECT USING (auth.uid() = user_id);
  `);
  pgm.sql(`
    CREATE POLICY "profiles_modify_own" ON public.profiles
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  `);
  pgm.sql(`
    CREATE POLICY "scan_history_select_own" ON public.scan_history
      FOR SELECT USING (auth.uid() = user_id);
  `);
  pgm.sql(`
    CREATE POLICY "scan_history_modify_own" ON public.scan_history
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  `);
  pgm.sql(`
    CREATE POLICY "health_diary_select_own" ON public.health_diary
      FOR SELECT USING (auth.uid() = user_id);
  `);
  pgm.sql(`
    CREATE POLICY "health_diary_modify_own" ON public.health_diary
      FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  `);
  pgm.sql(`
    CREATE POLICY "audit_logs_select_own" ON public.audit_logs
      FOR SELECT USING (auth.uid() = user_id);
  `);
  pgm.sql(`
    CREATE POLICY "roles_service_role" ON public.roles
      FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
  `);
  pgm.sql(`
    CREATE POLICY "user_roles_select_self" ON public.user_roles
      FOR SELECT USING (auth.role() = 'service_role' OR auth.uid() = user_id);
  `);
  pgm.sql(`
    CREATE POLICY "user_roles_manage_service" ON public.user_roles
      FOR ALL USING (auth.role() = 'service_role') WITH CHECK (auth.role() = 'service_role');
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

  pgm.sql(`
    INSERT INTO public.roles (name, description)
    VALUES
      ('super_admin', 'Full administrative control'),
      ('clinician', 'Medical professional access'),
      ('patient', 'Standard end user access')
    ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;
  `);
};

exports.down = pgm => {
  pgm.sql("DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;");
  pgm.sql("DROP FUNCTION IF EXISTS public.handle_new_user;");
  pgm.sql("DROP TRIGGER IF EXISTS update_health_diary_updated_at ON public.health_diary;");
  pgm.sql("DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;");
  pgm.sql("DROP FUNCTION IF EXISTS public.update_updated_at_column;");

  pgm.sql('DROP POLICY IF EXISTS "user_roles_manage_service" ON public.user_roles;');
  pgm.sql('DROP POLICY IF EXISTS "user_roles_select_self" ON public.user_roles;');
  pgm.sql('DROP POLICY IF EXISTS "roles_service_role" ON public.roles;');
  pgm.sql('DROP POLICY IF EXISTS "audit_logs_select_own" ON public.audit_logs;');
  pgm.sql('DROP POLICY IF EXISTS "health_diary_modify_own" ON public.health_diary;');
  pgm.sql('DROP POLICY IF EXISTS "health_diary_select_own" ON public.health_diary;');
  pgm.sql('DROP POLICY IF EXISTS "scan_history_modify_own" ON public.scan_history;');
  pgm.sql('DROP POLICY IF EXISTS "scan_history_select_own" ON public.scan_history;');
  pgm.sql('DROP POLICY IF EXISTS "profiles_modify_own" ON public.profiles;');
  pgm.sql('DROP POLICY IF EXISTS "profiles_select_own" ON public.profiles;');

  pgm.sql("ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;");
  pgm.sql("ALTER TABLE public.roles DISABLE ROW LEVEL SECURITY;");
  pgm.sql("ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;");
  pgm.sql("ALTER TABLE public.health_diary DISABLE ROW LEVEL SECURITY;");
  pgm.sql("ALTER TABLE public.scan_history DISABLE ROW LEVEL SECURITY;");
  pgm.sql("ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;");

  pgm.dropTable({ schema: "public", name: "audit_logs" }, { ifExists: true, cascade: true });
  pgm.dropTable({ schema: "public", name: "health_diary" }, { ifExists: true, cascade: true });
  pgm.dropTable({ schema: "public", name: "scan_history" }, { ifExists: true, cascade: true });
  pgm.dropTable({ schema: "public", name: "profiles" }, { ifExists: true, cascade: true });
  pgm.dropTable({ schema: "public", name: "user_roles" }, { ifExists: true, cascade: true });
  pgm.dropTable({ schema: "public", name: "roles" }, { ifExists: true, cascade: true });
};
