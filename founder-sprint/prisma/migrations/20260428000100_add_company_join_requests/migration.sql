-- Add target company support for founder requests to join existing companies.
ALTER TABLE "company_change_requests"
  ADD COLUMN "target_company_id" UUID;

CREATE INDEX "company_change_requests_target_company_id_idx"
  ON "company_change_requests"("target_company_id");

ALTER TABLE "company_change_requests"
  ADD CONSTRAINT "company_change_requests_target_company_id_fkey"
  FOREIGN KEY ("target_company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;
