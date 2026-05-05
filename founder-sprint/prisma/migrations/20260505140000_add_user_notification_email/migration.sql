-- Add an optional notification_email column on users so members can route
-- transactional and event notifications to a different inbox than the one
-- used for sign-in. Login flow (Supabase auth.users.email + User.email) is
-- intentionally untouched. NULL means "fall back to email".

ALTER TABLE "users" ADD COLUMN "notification_email" TEXT;
