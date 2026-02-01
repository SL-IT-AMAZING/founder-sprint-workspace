# User Action Required

Items that require manual setup by the project owner (cannot be automated).

---

## 1. Enable LinkedIn OIDC in Supabase [BLOCKER]

**Why**: Code uses `linkedin_oidc` provider but Supabase returns `"Unsupported provider: provider is not enabled"`. This blocks ALL authentication.

**Impact**: Login is completely non-functional until resolved.

### Steps

1. **Create LinkedIn App** (skip if already done)
   - Go to https://www.linkedin.com/developers/apps
   - Create new app (or select existing)
   - **Products** tab → Add **"Sign In with LinkedIn using OpenID Connect"**

2. **Configure LinkedIn App Auth**
   - **Auth** tab → Add authorized redirect URL:
     ```
     https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
     ```
   - Copy **Client ID** and **Client Secret**

3. **Enable Provider in Supabase**
   - Go to https://supabase.com/dashboard → your project
   - **Authentication** → **Providers**
   - Find **"LinkedIn (OIDC)"** (NOT "LinkedIn" — the OIDC variant)
   - Toggle **ON**
   - Paste **Client ID** and **Client Secret**
   - Save

### Verification
- Click "Sign in with LinkedIn" on the login page
- Should redirect to LinkedIn consent screen (not a JSON error)
- After approval, should redirect back to `/auth/callback`

---

## 2. Google Calendar Service Account [NON-BLOCKER]

**Why**: Google Calendar integration requires a service account key that must be created in Google Cloud Console.

**Impact**: Calendar features won't work, but doesn't block other functionality.

### Steps

1. Go to https://console.cloud.google.com
2. Create/select project → Enable "Google Calendar API"
3. **Credentials** → Create **Service Account**
4. Download JSON key
5. Copy `client_email` → `.env.local` as `GOOGLE_SERVICE_ACCOUNT_EMAIL`
6. Copy `private_key` → `.env.local` as `GOOGLE_PRIVATE_KEY`
7. Share target calendar with the service account email (give "Make changes to events" permission)

### Verification
- Calendar API endpoints return event data instead of auth errors

---

## 3. Supabase Storage Buckets [NON-BLOCKER]

**Why**: File upload features need storage buckets created manually.

**Impact**: File uploads won't work, but doesn't block core functionality.

### Steps

In Supabase Dashboard → **Storage**:
1. Create bucket `question-attachments` (Private)
2. Create bucket `post-images` (Private)
3. Create bucket `profile-images` (Public)

### Verification
- File upload operations succeed without "bucket not found" errors
