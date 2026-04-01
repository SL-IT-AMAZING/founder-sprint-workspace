ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "conversation_participants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "conversations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_for_participants"
  ON "messages"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "conversation_participants" cp
      WHERE cp."conversation_id" = "messages"."conversation_id"
        AND cp."user_id" = auth.uid()
    )
  );

CREATE POLICY "conversation_participants_select_own"
  ON "conversation_participants"
  FOR SELECT
  TO authenticated
  USING ("user_id" = auth.uid());

CREATE POLICY "conversations_select_for_participants"
  ON "conversations"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM "conversation_participants" cp
      WHERE cp."conversation_id" = "conversations"."id"
        AND cp."user_id" = auth.uid()
    )
  );

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "messages";
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'conversation_participants'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "conversation_participants";
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE "conversations";
  END IF;
END
$$;
