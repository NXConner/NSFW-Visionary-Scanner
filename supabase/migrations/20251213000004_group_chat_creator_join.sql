-- Allow group creators to add themselves as members (including private groups).
-- This complements the existing "Users can join public groups..." policy.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'group_chat_members'
      AND policyname = 'Creators can self-join their own groups'
  ) THEN
    CREATE POLICY "Creators can self-join their own groups"
      ON public.group_chat_members
      FOR INSERT
      WITH CHECK (
        auth.uid() = user_id
        AND EXISTS (
          SELECT 1
          FROM public.group_chats gc
          WHERE gc.id = group_chat_members.group_id
            AND gc.created_by = auth.uid()
        )
      );
  END IF;
END
$$;

