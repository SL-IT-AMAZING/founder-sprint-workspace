# API Requirements & Credentials

> Complete list of API keys and credentials needed for Founder Sprint Workspace MVP

## Required Credentials

### 1. Supabase (Database + Auth + Storage)

**Purpose**: Authentication, database, file storage

**Credentials Needed**:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**How to Get**:
1. Go to [supabase.com](https://supabase.com) and create a new project
2. Navigate to **Settings > API**
3. Copy:
   - Project URL -> `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` `public` key -> `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` key -> `SUPABASE_SERVICE_ROLE_KEY`

**Setup Required**:
1. Enable Email/Password authentication in **Authentication > Providers**
2. Enable LinkedIn OIDC provider (see below)
3. Create storage buckets: `avatars`, `submissions`

---

### 2. LinkedIn OAuth (OIDC)

**Purpose**: LinkedIn login for founders and mentors

**Credentials Needed**:
```env
LINKEDIN_CLIENT_ID=77xxxxxxxxxxxxx
LINKEDIN_CLIENT_SECRET=xxxxxxxxxxxxxxxx
```

**How to Get**:
1. Go to [LinkedIn Developers](https://www.linkedin.com/developers/)
2. Create a new app or use existing
3. Request **OpenID Connect** product
4. In **Auth** tab:
   - Add redirect URL: `https://your-project.supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret

**Supabase Setup**:
1. Go to Supabase Dashboard > **Authentication > Providers**
2. Enable **LinkedIn (OIDC)**
3. Enter Client ID and Client Secret
4. Redirect URL is auto-generated

---

### 3. Google Calendar API (Service Account)

**Purpose**: Sync office hours sessions with mentor calendars

**Credentials Needed**:
```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE....\n-----END PRIVATE KEY-----\n"
```

**How to Get**:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable **Google Calendar API** in APIs & Services
4. Go to **IAM & Admin > Service Accounts**
5. Create a service account
6. Create a JSON key for the service account
7. Extract `client_email` -> `GOOGLE_SERVICE_ACCOUNT_EMAIL`
8. Extract `private_key` -> `GOOGLE_PRIVATE_KEY`

**Important**: The `GOOGLE_PRIVATE_KEY` must include `\n` for line breaks and be wrapped in quotes in `.env`.

---

### 4. Database Connection (Prisma)

**Purpose**: Direct database connection for Prisma

**Credentials Needed**:
```env
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres
```

**How to Get**:
1. Go to Supabase Dashboard > **Settings > Database**
2. Under **Connection string**, select **URI**
3. Copy the pooled connection (port 6543) -> `DATABASE_URL`
4. Copy the direct connection (port 5432) -> `DIRECT_URL`
5. Replace `[YOUR-PASSWORD]` with your database password

**Note**: Prisma 7 uses `prisma.config.ts` for connection strings, NOT `schema.prisma`.

---

## Optional Credentials

### 5. Resend (Email)

**Purpose**: Transactional emails (invitations, notifications)

**Credentials Needed**:
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxx
```

**How to Get**:
1. Go to [resend.com](https://resend.com)
2. Create an account and verify your domain
3. Go to **API Keys** and create a new key

---

### 6. Vercel (Deployment)

**Purpose**: Hosting and deployment

**No credentials needed in `.env`** - Vercel uses its own deployment tokens.

**Setup**:
1. Connect your GitHub repo to Vercel
2. Add all environment variables in Vercel Dashboard > Project Settings > Environment Variables

---

## Complete .env.local Template

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Database (Prisma)
DATABASE_URL=
DIRECT_URL=

# LinkedIn OAuth
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=

# Google Calendar
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=

# Optional: Email
RESEND_API_KEY=

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Credential Checklist

| Service | Required? | Credential | Status |
|---------|-----------|------------|--------|
| Supabase | **YES** | URL, Anon Key, Service Key | [ ] |
| LinkedIn | **YES** | Client ID, Client Secret | [ ] |
| Google Calendar | **YES** | Service Account Email, Private Key | [ ] |
| Prisma/Database | **YES** | DATABASE_URL, DIRECT_URL | [ ] |
| Resend | Optional | API Key | [ ] |

---

## Security Notes

1. **NEVER commit `.env.local` to git** - it's in `.gitignore` by default
2. **Service Role Key** has admin access - only use server-side
3. **Google Private Key** should be stored as a single line with `\n` escape sequences
4. For production, use Vercel's encrypted environment variables
5. Rotate keys periodically, especially after team changes

---

## Quick Setup Script

After obtaining all credentials, verify your setup:

```bash
# Check environment variables are set
env | grep SUPABASE
env | grep DATABASE
env | grep LINKEDIN
env | grep GOOGLE

# Test Prisma connection
npx prisma db push

# Test Supabase connection
curl -X GET "$NEXT_PUBLIC_SUPABASE_URL/rest/v1/" \
  -H "apikey: $NEXT_PUBLIC_SUPABASE_ANON_KEY"
```
