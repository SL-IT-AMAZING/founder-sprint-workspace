# Founder Sprint Workspace MVP - Setup Guide

Step-by-step instructions to set up the project from scratch.

---

## Prerequisites

- Node.js 20+ 
- npm 10+
- Supabase account
- Google Cloud Console account
- LinkedIn Developer account

---

## Step 1: Create Next.js Project

```bash
npx create-next-app@16.1.4 founder-sprint-workspace \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"

cd founder-sprint-workspace
```

---

## Step 2: Install Dependencies

```bash
npm install @supabase/supabase-js@2.91.0 @supabase/ssr@0.8.0
npm install @prisma/client@7.3.0
npm install -D prisma@7.3.0 dotenv
npm install googleapis@170.1.0
npm install zod@4.3.5 date-fns@4.1.0 date-fns-tz@3.2.0
```

---

## Step 3: Set Up Supabase

### 3.1 Create Supabase Project
1. Go to https://supabase.com/dashboard
2. Create new project
3. Note your project URL and anon key

### 3.2 Configure LinkedIn OIDC
1. Go to https://www.linkedin.com/developers/apps
2. Create new app
3. In Products tab, add "Sign In with LinkedIn using OpenID Connect"
4. In Auth tab, add redirect URL: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
5. Copy Client ID and Client Secret

### 3.3 Enable LinkedIn OIDC in Supabase
1. Supabase Dashboard > Authentication > Providers
2. Enable **LinkedIn (OIDC)** (NOT regular LinkedIn!)
3. Enter Client ID and Client Secret

### 3.4 Get Database Connection String
1. Supabase Dashboard > Settings > Database
2. Copy connection string (Session mode for pgbouncer)

---

## Step 4: Create Environment File

Create `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
DATABASE_URL=postgresql://postgres.YOUR-PROJECT:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=peter@outsome.co
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 5: Set Up Prisma

### 5.1 Initialize Prisma
```bash
npx prisma init
```

### 5.2 Create prisma.config.ts (REQUIRED for Prisma 7!)

Create `prisma.config.ts` in project root:

```typescript
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

### 5.3 Update schema.prisma

Replace `prisma/schema.prisma` content with:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
}

// Add all models from 02_PRISMA_SCHEMA.md
```

### 5.4 Run Migration
```bash
npx prisma migrate dev --name init
npx prisma generate
```

---

## Step 6: Copy Code Templates

Copy files from `03_CODE_TEMPLATES/` to your project:

| Template File | Destination |
|---------------|-------------|
| `prisma.config.ts` | `./prisma.config.ts` |
| `supabase-client.ts` | `./src/lib/supabase/client.ts` |
| `supabase-server.ts` | `./src/lib/supabase/server.ts` |
| `supabase-middleware.ts` | `./src/lib/supabase/middleware.ts` |
| `middleware.ts` | `./middleware.ts` |
| `prisma.ts` | `./src/lib/prisma.ts` |
| `google-calendar.ts` | `./src/lib/google-calendar.ts` |
| `auth-actions.ts` | `./src/actions/auth.ts` |
| `globals.css` | `./src/app/globals.css` |
| `login-page.tsx` | `./src/app/(auth)/login/page.tsx` |
| `auth-callback.ts` | `./src/app/(auth)/auth/callback/route.ts` |

---

## Step 7: Copy Assets

### 7.1 Copy Fonts
```bash
mkdir -p public/fonts
cp /Users/cosmos/fs/outsome-react/public/fonts/* public/fonts/
```

### 7.2 Copy Logo
```bash
mkdir -p public/images
cp /Users/cosmos/fs/outsome-react/public/images/Outsome-Full_Black.svg public/images/
```

---

## Step 8: Set Up Google Calendar API

### 8.1 Create Service Account
1. Go to https://console.cloud.google.com
2. Create or select project
3. APIs & Services > Library > Enable "Google Calendar API"
4. APIs & Services > Credentials > Create Service Account
5. Download JSON key file
6. Copy `client_email` and `private_key` to `.env.local`

### 8.2 Share Calendar
1. Open Google Calendar (peter@outsome.co)
2. Settings > Share with specific people
3. Add the service account email
4. Give "Make changes to events" permission

---

## Step 9: Create Storage Buckets

In Supabase Dashboard > Storage:

1. Create bucket `question-attachments` (Private)
2. Create bucket `post-images` (Private)
3. Create bucket `profile-images` (Public)

---

## Step 10: Test the Setup

```bash
npm run dev
```

1. Open http://localhost:3000
2. Navigate to /login
3. Click "Sign in with LinkedIn"
4. Verify OAuth flow works

---

## Step 11: Create Directory Structure

```bash
mkdir -p src/app/\(auth\)/login
mkdir -p src/app/\(auth\)/auth/callback
mkdir -p src/app/\(dashboard\)/dashboard
mkdir -p src/app/\(dashboard\)/questions
mkdir -p src/app/\(dashboard\)/office-hours
mkdir -p src/app/\(dashboard\)/sessions
mkdir -p src/app/\(dashboard\)/assignments
mkdir -p src/app/\(dashboard\)/community
mkdir -p src/app/\(dashboard\)/admin/batches
mkdir -p src/app/\(dashboard\)/admin/users
mkdir -p src/lib/supabase
mkdir -p src/actions
mkdir -p src/components/ui
mkdir -p src/components/layout
mkdir -p src/components/forms
mkdir -p src/components/features
mkdir -p src/hooks
mkdir -p src/types
```

---

## Troubleshooting

### Prisma Migration Fails
- Ensure `prisma.config.ts` exists in project root
- Check DATABASE_URL is correct
- Run `npx prisma db push` to sync without migrations

### LinkedIn OAuth Error
- Use `linkedin_oidc` provider, NOT `linkedin`
- Verify redirect URL matches exactly
- Check Client ID and Secret are correct

### Tailwind Styles Not Working
- Use `@theme inline {}` not `@theme {}`
- Verify `@import "tailwindcss"` at top of globals.css

### Cookies Error in Server Components
- Use `await cookies()` not `cookies()`
- This is required in Next.js 15+

### Zod Validation Error
- Use `error.issues[0]` not `error.errors[0]`
- This changed in Zod 4.x

---

## Next Steps

After setup is complete:

1. Review `01_DEVELOPMENT_PLAN.md` for feature implementation order
2. Copy Prisma schema from `02_PRISMA_SCHEMA.md`
3. Use code templates from `03_CODE_TEMPLATES/`
4. Follow development phases in the plan

---

**End of Setup Guide**
