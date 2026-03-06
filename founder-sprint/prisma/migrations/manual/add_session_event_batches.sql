-- Migration: Add SessionBatch and EventBatch junction tables
-- Run this via Supabase SQL Editor or psql

-- Step 1: Create session_batches table
CREATE TABLE IF NOT EXISTS session_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  UNIQUE(session_id, batch_id)
);

CREATE INDEX IF NOT EXISTS session_batches_batch_id_idx ON session_batches(batch_id);
CREATE INDEX IF NOT EXISTS session_batches_session_id_idx ON session_batches(session_id);

-- Step 2: Create event_batches table
CREATE TABLE IF NOT EXISTS event_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  created_at TIMESTAMP(3) NOT NULL DEFAULT NOW(),
  UNIQUE(event_id, batch_id)
);

CREATE INDEX IF NOT EXISTS event_batches_batch_id_idx ON event_batches(batch_id);
CREATE INDEX IF NOT EXISTS event_batches_event_id_idx ON event_batches(event_id);

-- Step 3: Backfill session_batches from existing batchId
INSERT INTO session_batches (id, session_id, batch_id, created_at)
SELECT gen_random_uuid(), id, batch_id, created_at
FROM sessions
WHERE batch_id IS NOT NULL
ON CONFLICT (session_id, batch_id) DO NOTHING;

-- Step 4: Backfill event_batches from existing batchId
INSERT INTO event_batches (id, event_id, batch_id, created_at)
SELECT gen_random_uuid(), id, batch_id, created_at
FROM events
WHERE batch_id IS NOT NULL
ON CONFLICT (event_id, batch_id) DO NOTHING;

-- Step 5: Verification queries (run these and check results)

-- Check 1: Every session has at least one junction entry
-- Expected: 0
SELECT COUNT(*) AS orphaned_sessions
FROM sessions s
LEFT JOIN session_batches sb ON sb.session_id = s.id
WHERE sb.id IS NULL;

-- Check 2: Every event has at least one junction entry
-- Expected: 0
SELECT COUNT(*) AS orphaned_events
FROM events e
LEFT JOIN event_batches eb ON eb.event_id = e.id
WHERE eb.id IS NULL;

-- Check 3: No duplicate junction entries
-- Expected: 0 rows
SELECT session_id, batch_id, COUNT(*)
FROM session_batches
GROUP BY session_id, batch_id
HAVING COUNT(*) > 1;

-- Check 4: All junction FKs reference valid records
-- Expected: 0
SELECT COUNT(*) FROM session_batches sb
LEFT JOIN sessions s ON s.id = sb.session_id
WHERE s.id IS NULL;
