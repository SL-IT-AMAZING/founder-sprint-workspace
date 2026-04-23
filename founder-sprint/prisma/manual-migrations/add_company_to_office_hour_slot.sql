-- Add company_id column to office_hour_slots
ALTER TABLE "office_hour_slots" ADD COLUMN "company_id" UUID;

-- Add index on company_id
CREATE INDEX "office_hour_slots_company_id_idx" ON "office_hour_slots"("company_id");

-- Add foreign key constraint
ALTER TABLE "office_hour_slots" ADD CONSTRAINT "office_hour_slots_company_id_fkey"
  FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
