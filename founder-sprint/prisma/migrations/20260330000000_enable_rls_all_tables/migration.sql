-- Enable Row Level Security on all public app tables.
--
-- WHY: Supabase Security Advisor flagged these tables as publicly accessible
-- via the Supabase API using anon/authenticated roles (which hold full grants
-- by default). The app accesses ALL data exclusively through Prisma using the
-- postgres superuser (DATABASE_URL), which bypasses RLS automatically.
-- service_role also bypasses RLS in Supabase by default.
--
-- EFFECT: anon/authenticated Supabase API requests will be denied (default-deny
-- when RLS is enabled with no matching policies). All Prisma / server-side
-- access continues to work unchanged.
--
-- ROLLBACK: ALTER TABLE <name> DISABLE ROW LEVEL SECURITY; for each table.

ALTER TABLE "answers" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assignment_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "assignments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "batches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "bookmarks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "companies" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company_batches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "company_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "conversation_participants" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "education" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "event_batches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "events" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "experiences" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "feedbacks" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "group_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "invitation_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "likes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "office_hour_credits" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "office_hour_requests" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "office_hour_slots" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "post_images" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "post_views" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "question_attachments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "questions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "session_batches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "session_templates" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "sessions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "submission_versions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "submissions" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "summaries" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_batches" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "user_follows" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "users" ENABLE ROW LEVEL SECURITY;
