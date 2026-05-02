-- Enable Row Level Security on the company change request table.
--
-- This table was added after the all-table RLS hardening migration, so it was
-- still exposed through Supabase's public Data API grants. The application uses
-- server-side Prisma for these workflows, so enabling RLS with no public policy
-- keeps app behavior unchanged while denying anon/authenticated API access by
-- default.

ALTER TABLE "company_change_requests" ENABLE ROW LEVEL SECURITY;
