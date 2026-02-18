// This module previously provided getAuthUserFromHeaders() which read
// spoofable x-auth-user-id/x-auth-user-email headers from middleware.
// Removed for security (#33). All callers now use Supabase session directly.
