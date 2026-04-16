-- CreateTable
CREATE TABLE "company_change_requests" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "batch_id" UUID,
  "current_company_id" UUID,
  "target_type" VARCHAR(32) NOT NULL,
  "requested_company_name" VARCHAR(200),
  "requested_description" TEXT,
  "has_dependent_co_founders" BOOLEAN NOT NULL DEFAULT false,
  "resolution_type" VARCHAR(32),
  "promoted_user_id" UUID,
  "note" TEXT,
  "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
  "reviewed_by_id" UUID,
  "reviewed_at" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "company_change_requests_pkey" PRIMARY KEY ("id")
);

-- Indexes
CREATE INDEX "company_change_requests_user_id_status_idx" ON "company_change_requests"("user_id", "status");
CREATE INDEX "company_change_requests_batch_id_status_idx" ON "company_change_requests"("batch_id", "status");
CREATE INDEX "company_change_requests_current_company_id_idx" ON "company_change_requests"("current_company_id");

-- FKs
ALTER TABLE "company_change_requests"
  ADD CONSTRAINT "company_change_requests_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "company_change_requests"
  ADD CONSTRAINT "company_change_requests_batch_id_fkey"
  FOREIGN KEY ("batch_id") REFERENCES "batches"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "company_change_requests"
  ADD CONSTRAINT "company_change_requests_current_company_id_fkey"
  FOREIGN KEY ("current_company_id") REFERENCES "companies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "company_change_requests"
  ADD CONSTRAINT "company_change_requests_reviewed_by_id_fkey"
  FOREIGN KEY ("reviewed_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "company_change_requests"
  ADD CONSTRAINT "company_change_requests_promoted_user_id_fkey"
  FOREIGN KEY ("promoted_user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
