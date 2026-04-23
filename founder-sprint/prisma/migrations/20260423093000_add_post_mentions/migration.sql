-- Create post_mentions table for feed mentions
CREATE TABLE "post_mentions" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "post_id" UUID NOT NULL,
  "mentioned_user_id" UUID NOT NULL,
  "display_text" VARCHAR(200) NOT NULL,
  "start_index" INTEGER NOT NULL,
  "end_index" INTEGER NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "post_mentions_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "post_mentions"
  ADD CONSTRAINT "post_mentions_post_id_fkey"
  FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "post_mentions"
  ADD CONSTRAINT "post_mentions_mentioned_user_id_fkey"
  FOREIGN KEY ("mentioned_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE INDEX "post_mentions_post_id_start_index_idx"
  ON "post_mentions"("post_id", "start_index");

CREATE INDEX "post_mentions_mentioned_user_id_created_at_idx"
  ON "post_mentions"("mentioned_user_id", "created_at");

CREATE INDEX "notifications_user_id_created_at_idx"
  ON "notifications"("user_id", "created_at");

ALTER TABLE "post_mentions" ENABLE ROW LEVEL SECURITY;
