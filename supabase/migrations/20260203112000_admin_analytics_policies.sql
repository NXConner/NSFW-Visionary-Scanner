-- Admin analytics read access

-- Profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- App analytics events
DROP POLICY IF EXISTS "Admins can view all app analytics events" ON public.app_analytics_events;
CREATE POLICY "Admins can view all app analytics events"
  ON public.app_analytics_events
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- DLC purchases
DROP POLICY IF EXISTS "Admins can view all dlc purchases" ON public.dlc_purchases;
CREATE POLICY "Admins can view all dlc purchases"
  ON public.dlc_purchases
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'super_admin')
    )
  );

-- User subscriptions (admin metrics)
DROP POLICY IF EXISTS "Admins can view all subscriptions" ON public.user_subscriptions;
CREATE POLICY "Admins can view all subscriptions"
  ON public.user_subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_roles.user_id = auth.uid()
        AND user_roles.role IN ('admin', 'super_admin')
    )
  );
