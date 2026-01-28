# Founder Sprint Workspace MVP - Development Plan (POC Verified)

**Document Version**: v2.0 (POC Verified)  
**Created**: January 22, 2026  
**Purpose**: AI-executable development plan with all versions verified via POC build

---

## CRITICAL: POC Verification Notice

This document contains **POC-verified** package versions and code patterns. The original plan had 8 hallucinations/errors that were discovered and corrected through actual build testing.

**POC Location**: `/Users/cosmos/fs/dev_poc/poc-test` (BUILD SUCCESSFUL)

---

## 1. Project Overview

### 1.1 Project Information
- **Project Name**: Founder Sprint Workspace MVP
- **Client**: Peter Shin (YC W20) / Outsome
- **Tech Stack**: Next.js 16 + TypeScript + Tailwind CSS 4 + Supabase + Prisma 7
- **Deployment**: Vercel
- **PRD Location**: `/Users/cosmos/fs/_bmad-output/Founder_Sprint_MVP_기획서.md`
- **Design Reference**: `/Users/cosmos/fs/outsome-react`

### 1.2 Core Features
1. LinkedIn OAuth Login (OIDC)
2. Batch-based data separation
3. Question -> Answer -> Summary (Q&A)
4. Office Hours slot registration/request/approval + Google Calendar integration
5. Session & Slides management
6. Assignment submission & feedback
7. Community board

---

## 2. VERIFIED Package Versions (January 2026)

### 2.1 Core Dependencies (POC Verified)
```json
{
  "dependencies": {
    "next": "16.1.4",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "@supabase/supabase-js": "2.91.0",
    "@supabase/ssr": "0.8.0",
    "@prisma/client": "7.3.0",
    "googleapis": "170.1.0",
    "zod": "4.3.5",
    "date-fns": "4.1.0",
    "date-fns-tz": "3.2.0"
  },
  "devDependencies": {
    "prisma": "7.3.0",
    "typescript": "5.8.3",
    "@types/node": "22.15.29",
    "@types/react": "19.1.8",
    "@types/react-dom": "19.1.6",
    "tailwindcss": "4.1.18",
    "@tailwindcss/postcss": "4.1.18",
    "eslint": "9.29.0",
    "eslint-config-next": "16.1.4"
  }
}
```

### 2.2 Version Corrections from Original Plan

| Package | Original (WRONG) | Verified (CORRECT) |
|---------|------------------|-------------------|
| next | 15.1.6 | **16.1.4** |
| react | 19.0.0 | **19.2.3** |
| @supabase/supabase-js | 2.49.1 | **2.91.0** |
| @supabase/ssr | 0.5.2 | **0.8.0** |
| prisma | 6.3.0 | **7.3.0** |
| googleapis | 146.0.0 | **170.1.0** |
| zod | 3.24.1 | **4.3.5** |

### 2.3 Installation Commands (Correct Versions)
```bash
# Project initialization
npx create-next-app@16.1.4 founder-sprint-workspace --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

cd founder-sprint-workspace

# Supabase packages
npm install @supabase/supabase-js@2.91.0 @supabase/ssr@0.8.0

# Prisma
npm install @prisma/client@7.3.0
npm install -D prisma@7.3.0

# Google Calendar API
npm install googleapis@170.1.0

# Utilities
npm install zod@4.3.5 date-fns@4.1.0 date-fns-tz@3.2.0

# Additional dev dependencies
npm install -D dotenv
```

---

## 3. Critical Breaking Changes (POC Discovered)

### 3.1 Prisma 7 Breaking Change (CRITICAL)

**OLD (Prisma 6 - NO LONGER WORKS)**:
```prisma
// schema.prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

**NEW (Prisma 7 - REQUIRED)**:
```typescript
// prisma.config.ts - THIS FILE IS NOW REQUIRED
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

```prisma
// schema.prisma - url and directUrl REMOVED
datasource db {
  provider = "postgresql"
}
```

### 3.2 Zod 4.x API Change

**OLD (Zod 3.x)**:
```typescript
result.error.errors[0].message
```

**NEW (Zod 4.x)**:
```typescript
result.error.issues[0]?.message
```

### 3.3 Tailwind CSS 4 @theme Syntax

**OLD**:
```css
@theme {
  --color-cream: #fefaf3;
}
```

**NEW (Tailwind 4.1)**:
```css
@theme inline {
  --color-cream: #fefaf3;
}
```

The `inline` keyword is required in Tailwind CSS 4.1+.

### 3.4 PrismaClient Constructor Change

**OLD (Prisma 6)**:
```typescript
new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
  log: ["query"],
});
```

**NEW (Prisma 7)**:
```typescript
new PrismaClient({
  log: ["query"],
});
// datasourceUrl is now configured in prisma.config.ts
```

---

## 4. Project Structure

```
founder-sprint-workspace/
├── .env.local                    # Environment variables (dev)
├── .env.example                  # Environment variables template
├── next.config.ts                # Next.js config
├── prisma.config.ts              # Prisma 7 config (REQUIRED!)
├── prisma/
│   ├── schema.prisma             # Prisma schema (no url/directUrl)
│   └── seed.ts                   # Seed data
├── public/
│   ├── fonts/
│   │   ├── BDOGrotesk-VF.ttf
│   │   ├── RobotoMono-Medium.ttf
│   │   ├── LibreCaslonCondensed-Regular.otf
│   │   └── LibreCaslonCondensed-Italic.otf
│   └── images/
│       └── Outsome-Full_Black.svg
├── src/
│   ├── app/
│   │   ├── globals.css           # Tailwind CSS 4 with @theme inline
│   │   ├── layout.tsx            # Root Layout
│   │   ├── page.tsx              # Landing/login page
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── auth/
│   │   │       └── callback/
│   │   │           └── route.ts  # OAuth callback handler
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx        # Dashboard layout (Navbar)
│   │   │   ├── dashboard/
│   │   │   ├── questions/
│   │   │   ├── office-hours/
│   │   │   ├── sessions/
│   │   │   ├── assignments/
│   │   │   ├── community/
│   │   │   └── admin/
│   │   └── api/
│   │       └── google-calendar/
│   │           └── route.ts
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Browser Client
│   │   │   ├── server.ts         # Server Client (await cookies!)
│   │   │   └── middleware.ts     # Session Refresh
│   │   ├── prisma.ts             # Prisma Client Singleton
│   │   ├── google-calendar.ts    # Google Calendar API
│   │   └── utils.ts              # Utility functions
│   ├── actions/                  # Server Actions
│   ├── components/
│   │   ├── ui/
│   │   ├── layout/
│   │   ├── forms/
│   │   └── features/
│   ├── hooks/
│   └── types/
└── middleware.ts                 # Auth Middleware
```

---

## 5. Environment Variables

### 5.1 .env.local
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true

# Google Calendar API (Service Account)
GOOGLE_SERVICE_ACCOUNT_EMAIL=founder-sprint@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=peter@outsome.co

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 6. Supabase Setup

### 6.1 LinkedIn OIDC Provider

**IMPORTANT**: Use `linkedin_oidc` provider, NOT `linkedin`.

#### LinkedIn Developer Portal
1. Go to https://www.linkedin.com/developers/apps
2. Create App
3. Go to "Products" tab
4. Add **"Sign In with LinkedIn using OpenID Connect"** (Request Access)
5. In "Auth" tab, add Redirect URL:
   - `https://your-project.supabase.co/auth/v1/callback`
6. Copy Client ID and Client Secret

#### Supabase Dashboard
1. Authentication > Providers
2. Enable **LinkedIn (OIDC)** (NOT regular LinkedIn!)
3. Enter Client ID and Client Secret

### 6.2 Storage Buckets
Create in Supabase Dashboard > Storage:
1. `question-attachments` - Question attachments (Public: false)
2. `post-images` - Post images (Public: false)
3. `profile-images` - Profile images (Public: true)

---

## 7. Development Phases

### Phase 1: Project Initialization (Day 1)
```bash
# 1. Create project
npx create-next-app@16.1.4 founder-sprint-workspace --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd founder-sprint-workspace

# 2. Install packages
npm install @supabase/supabase-js@2.91.0 @supabase/ssr@0.8.0
npm install @prisma/client@7.3.0
npm install -D prisma@7.3.0 dotenv
npm install googleapis@170.1.0
npm install zod@4.3.5 date-fns@4.1.0 date-fns-tz@3.2.0

# 3. Initialize Prisma
npx prisma init

# 4. Create prisma.config.ts (REQUIRED for Prisma 7!)
# See 03_CODE_TEMPLATES/prisma.config.ts

# 5. Copy font files
# From /Users/cosmos/fs/outsome-react/public/fonts/* -> ./public/fonts/

# 6. Copy logo
# From /Users/cosmos/fs/outsome-react/public/images/Outsome-Full_Black.svg -> ./public/images/

# 7. Set up environment variables (.env.local)

# 8. Write Prisma schema and migrate
npx prisma migrate dev --name init
npx prisma generate
```

### Phase 2: Authentication (Day 1-2)
1. Create Supabase project and configure LinkedIn OIDC
2. Create `src/lib/supabase/` client files
3. Create `middleware.ts`
4. Create `src/actions/auth.ts`
5. Create login page and callback route
6. Test: LinkedIn login -> callback -> dashboard

### Phase 3: Layout & Basic UI (Day 2)
1. Configure `globals.css` with Tailwind CSS 4 @theme inline
2. Create Navbar component
3. Create dashboard layout
4. Basic UI components (Button, Input, Card, Badge)

### Phase 4: Batch & User Management (Day 3)
1. Create Admin pages (/admin/batches, /admin/users)
2. Batch CRUD Server Actions
3. User invitation (email-based)
4. Permission checking utilities

### Phase 5: Q&A Feature (Day 4-5)
1. Question list page
2. Question creation form (with file upload)
3. Question detail page
4. Answer form
5. Summary creation (Admin only, closes question)

### Phase 6: Office Hours (Day 6-7)
1. Google Calendar API setup and testing
2. Slot registration form
3. Calendar view
4. Request/approval flow
5. Auto Google Meet link generation

### Phase 7: Sessions & Assignments (Day 8-9)
1. Session list/create/edit
2. Assignment list/create
3. Submission form
4. Submission status dashboard
5. Feedback creation

### Phase 8: Community (Day 10)
1. Post feed
2. Post creation (image upload)
3. Comments/replies
4. Like toggle
5. Pin announcements (Admin)

### Phase 9: Finalization (Day 11-14)
1. UI/UX polishing
2. Error handling
3. Loading states
4. Responsive adjustments
5. Vercel deployment
6. Testing

---

## 8. Verification Checklist

### 8.1 Feature Verification
- [ ] LinkedIn OAuth login works
- [ ] Batch create/archive works
- [ ] User invitation works
- [ ] Question CRUD works
- [ ] Answer/Summary works
- [ ] Office Hour slot registration works
- [ ] Office Hour request/approval works
- [ ] Google Calendar integration works
- [ ] Session CRUD works
- [ ] Assignment CRUD works
- [ ] Submission/Feedback works
- [ ] Post CRUD works
- [ ] Comment/Like works

### 8.2 Permission Verification
- [ ] Only Founder can create questions
- [ ] Only Admin/Mentor can create answers
- [ ] Only Admin can create summaries
- [ ] Only Admin/Mentor can register slots
- [ ] Only Founder can request office hours
- [ ] Only Admin can manage sessions/assignments
- [ ] Only Founder can submit assignments
- [ ] Only Admin/Mentor can write feedback

### 8.3 Data Isolation Verification
- [ ] Data completely separated between batches
- [ ] Archived Batch is read-only

---

## 9. Error Prevention Guide

### 9.1 Common Mistakes to Avoid

1. **Supabase Auth**
   - Use `linkedin_oidc` NOT `linkedin`
   - Use `@supabase/ssr` NOT `@supabase/auth-helpers-nextjs`
   - Use `await cookies()` in Server Components (Next.js 15+)

2. **Prisma 7**
   - Create `prisma.config.ts` (REQUIRED!)
   - Remove `url` and `directUrl` from schema.prisma
   - UUID type requires `@db.Uuid` decorator
   - DateTime default uses `@default(now())`

3. **Tailwind CSS 4**
   - Use `@theme inline {}` NOT `@theme {}`
   - Use `@import "tailwindcss"` for single import

4. **Server Actions**
   - Add `"use server"` at top of file
   - Call `revalidatePath()` to refresh cache
   - Watch type conversions with FormData

5. **Zod 4.x**
   - Use `error.issues[0]` NOT `error.errors[0]`

6. **Google Calendar API**
   - Share calendar with Service Account email
   - Set `conferenceDataVersion: 1` for Meet links

---

## 10. Deployment (Vercel)

### 10.1 Environment Variables
Add all environment variables in Vercel Dashboard > Settings > Environment Variables

### 10.2 Build Configuration
```json
{
  "buildCommand": "prisma generate && next build",
  "outputDirectory": ".next"
}
```

### 10.3 Post-Deployment Checklist
- [ ] All environment variables configured
- [ ] Supabase Redirect URL updated (production URL)
- [ ] Google Calendar Service Account permissions verified
- [ ] LinkedIn OAuth Redirect URL updated

---

## Document References

| Document | Location |
|----------|----------|
| PRD | `/Users/cosmos/fs/_bmad-output/Founder_Sprint_MVP_기획서.md` |
| POC Verification Report | `/Users/cosmos/fs/dev_plan/00_POC_VERIFICATION_REPORT.md` |
| Prisma Schema | `/Users/cosmos/fs/dev_plan/02_PRISMA_SCHEMA.md` |
| Code Templates | `/Users/cosmos/fs/dev_plan/03_CODE_TEMPLATES/` |
| Setup Guide | `/Users/cosmos/fs/dev_plan/04_SETUP_GUIDE.md` |
| Design Reference | `/Users/cosmos/fs/outsome-react` |

---

**End of Document**
