## RLS audit checklist (Supabase/Postgres)

### 1) Inventory

- List all tables in `public` and identify which store:
  - PII / health data
  - payment / billing
  - device identifiers
  - content access / entitlements

### 2) Enforcement

- For every sensitive table:
  - `ALTER TABLE ... ENABLE ROW LEVEL SECURITY;`
  - Ensure there is **no** permissive `FOR ALL USING (true)` policy.

### 3) Policy patterns (preferred)

- **User-owned rows** (common):
  - `FOR SELECT USING (auth.uid() = user_id)`
  - `FOR INSERT WITH CHECK (auth.uid() = user_id)`
  - `FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)`
  - `FOR DELETE USING (auth.uid() = user_id)`
- **Service role maintenance** (background jobs):
  - `FOR ALL USING (auth.jwt() ->> 'role' = 'service_role')`
- **Public read-only catalogs** (non-sensitive):
  - `FOR SELECT USING (true)` only if the data is intentionally public.

### 4) Storage buckets

- Confirm bucket policies do not allow listing/downloading private content without entitlement.
- Prefer signed URLs for private media and verify license server-side.

### 5) Edge functions

- Functions that act “as user” must verify JWT (`verify_jwt = true`) and use the user token.
- Functions that act “as service role” must:
  - require JWT and authorize `auth.uid()` for user-specific actions, OR
  - be `verify_jwt = false` but protected by a signed webhook secret (only for webhooks).

### 6) Regression checks

- Add basic tests or SQL assertions for:
  - user cannot read other user rows
  - user cannot insert rows for other `user_id`
  - service role can manage required tables
