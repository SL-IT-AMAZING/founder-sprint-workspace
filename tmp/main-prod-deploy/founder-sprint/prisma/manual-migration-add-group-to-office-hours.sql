-- Manual migration: Add groupId to office_hour_slots
-- This migration should be run if prisma db push fails due to connectivity issues

-- Add groupId column to office_hour_slots table
ALTER TABLE office_hour_slots
ADD COLUMN group_id UUID NULL;

-- Add foreign key constraint
ALTER TABLE office_hour_slots
ADD CONSTRAINT office_hour_slots_group_id_fkey
FOREIGN KEY (group_id)
REFERENCES groups(id)
ON DELETE SET NULL;

-- Add index on group_id for performance
CREATE INDEX office_hour_slots_group_id_idx
ON office_hour_slots(group_id);

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'office_hour_slots'
AND column_name = 'group_id';
