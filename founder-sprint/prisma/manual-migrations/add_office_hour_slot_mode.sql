CREATE TYPE "OfficeHourSlotMode" AS ENUM ('direct_company', 'direct_founder', 'open_batch');

ALTER TABLE "office_hour_slots"
ADD COLUMN "slot_mode" "OfficeHourSlotMode" NOT NULL DEFAULT 'direct_company';

UPDATE "office_hour_slots"
SET "slot_mode" = 'direct_founder'
WHERE "company_id" IS NULL
  AND COALESCE(array_length("target_founder_ids", 1), 0) > 0;

UPDATE "office_hour_slots"
SET "slot_mode" = 'direct_company'
WHERE "slot_mode" IS NULL;
