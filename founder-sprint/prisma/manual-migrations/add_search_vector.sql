-- Manual migration: Add full-text search vector column to posts table
-- Run this against the database manually: psql $DATABASE_URL -f prisma/migrations/manual/add_search_vector.sql
-- This is separate from Prisma migrations because Prisma doesn't support GENERATED columns natively.

ALTER TABLE posts ADD COLUMN IF NOT EXISTS search_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', coalesce(content, '')), 'A')
  ) STORED;

CREATE INDEX IF NOT EXISTS posts_search_idx ON posts USING gin(search_vector);
