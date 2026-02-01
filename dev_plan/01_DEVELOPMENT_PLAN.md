# Founder Sprint Workspace MVP - Development Plan (POC Verified)

**Document Version**: v2.0 (POC Verified)  
**Created**: January 22, 2026  
**Purpose**: AI-executable development plan with all versions verified via POC build

---

## CRITICAL: POC Verification Notice

This document contains **POC-verified** package versions and code patterns. The original plan had 8 hallucinations/errors that were discovered and corrected through actual build testing.

**POC Location**: `../dev_poc/poc-test` (BUILD SUCCESSFUL)

---

## 1. Project Overview

### 1.1 Project Information
- **Project Name**: Founder Sprint Workspace MVP
- **Client**: Peter Shin (YC W20) / Outsome
- **Tech Stack**: Next.js 16 + TypeScript + Tailwind CSS 4 + Supabase + Prisma 7
- **Deployment**: Vercel
- **PRD Location**: `dev_plan/00_PRD_기획서.md`
- **Design Reference**: `outsome-react/`

### 1.2 Core Features
1. LinkedIn OAuth Login (OIDC)
2. Batch-based data separation
3. Question -> Answer -> Summary (Q&A)
4. Office Hours slot registration/request/approval + Google Calendar integration
5. Session & Slides management
6. Assignment submission & feedback
7. Community board
8. Events (3 types: One-off, Office Hour, In-person) + Google Calendar integration
9. Groups with group-specific feeds
10. Profile management (manual job title, company, bio input)

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
│   │   │   ├── feed/
│   │   │   ├── events/
│   │   │   ├── groups/
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
# From outsome-react/public/fonts/* -> ./public/fonts/

# 6. Copy logo
# From outsome-react/public/images/Outsome-Full_Black.svg -> ./public/images/

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

### Phase 8: Events & Google Calendar (Day 10)
1. Event model - 3 types (One-off, Office Hour, In-person)
2. Event creation form (Admin only, type selector dropdown)
3. Event calendar view
4. Google Calendar integration for all event types
5. Calendar invite auto-send

### Phase 9: Community Feed (Day 11)
1. Post feed (`/feed` route)
2. Post creation (image upload via Supabase Storage)
3. Comments/replies (2-level nesting)
4. Like toggle
5. Pin announcements (Admin)
6. Post archive/hide (Admin)

### Phase 10: Groups (Day 12)
1. Group CRUD (Admin only)
2. Group member management
3. Group-specific feed (same features as main feed)
4. Group list and detail views

### Phase 11: Profile & Settings (Day 13)
1. Profile settings page (`/settings`)
2. Manual input: job_title, company, bio (LinkedIn OIDC only provides name/email/photo)
3. First-login onboarding redirect to profile completion

### Phase 12: Finalization (Day 14-16)
1. UI/UX polishing with Outsome brand design tokens
2. Error handling and loading states
3. Responsive adjustments
4. Vercel deployment
5. End-to-end testing

---

## 8. Verification Checklist

### 8.1 Feature Verification
- [ ] LinkedIn OAuth login works
- [ ] Batch create/archive works (multiple active batches allowed)
- [ ] User invitation works (7-day expiry, email matching)
- [ ] 5 roles assigned correctly (Super Admin, Admin, Mentor, Founder, Co-founder)
- [ ] Question CRUD works (Founder/Co-founder only)
- [ ] Answer/Summary works (Mentor/Admin, Admin only for summary)
- [ ] Office Hour slot registration works (Mentor/Admin)
- [ ] Office Hour request/approval works (Founder request, Host approve)
- [ ] Google Calendar + Meet link auto-generation works
- [ ] Event CRUD works (3 types: One-off, Office Hour, In-person)
- [ ] Session CRUD works
- [ ] Assignment CRUD works (Admin + Mentor can create)
- [ ] Submission/Feedback works (late submission flag)
- [ ] Post CRUD works (feed route)
- [ ] Comment/Like works (2-level nesting, toggle)
- [ ] Group CRUD works (Admin only)
- [ ] Group feed works (member-only access)
- [ ] Profile settings works (job_title, company, bio manual input)

### 8.2 Permission Verification (5 Roles)
- [ ] Super Admin: all permissions
- [ ] Admin: all permissions except system-level
- [ ] Mentor: answer questions, create office hour slots, create assignments, write feedback
- [ ] Founder: create questions, submit assignments, request office hours, write posts
- [ ] Co-founder: same as Founder
- [ ] Founder/Co-founder cannot access admin routes
- [ ] Mentor cannot create events or manage batches
- [ ] Group feed only accessible by group members
- [ ] Archived batch is read-only

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

### 정본 (Source of Truth) 파일

| # | 문서 | 위치 | 용도 |
|---|------|------|------|
| 0 | PRD 기획서 | `dev_plan/00_PRD_기획서.md` | 기능/요구사항 정의 |
| 0b | POC 검증 리포트 | `dev_plan/00_POC_VERIFICATION_REPORT.md` | 기술 검증 + LinkedIn OIDC 제한사항 |
| 1 | 개발 계획서 (본 문서) | `dev_plan/01_DEVELOPMENT_PLAN.md` | 전체 개발 로드맵 |
| 2 | Prisma Schema | `dev_plan/02_PRISMA_SCHEMA.md` | 21개 DB 모델 |
| 3 | 코드 템플릿 | `dev_plan/03_CODE_TEMPLATES/` | 36개 참조 코드 |
| 4 | 셋업 가이드 | `dev_plan/04_SETUP_GUIDE.md` | 프로젝트 초기 설정 |
| 5 | 디자인 시스템 | `dev_plan/05_DESIGN_SYSTEM.md` | CSS 변수, 컴포넌트 클래스 |
| 6 | API 요구사항 | `dev_plan/06_API_REQUIREMENTS.md` | API 스펙 |
| 7 | 통합 체크리스트 | `dev_plan/07_INTEGRATION_CHECKLIST.md` | 외부 서비스 연동 |
| 8 | 라우트 구조 | `dev_plan/08_ROUTES.md` | 31개 라우트 (21개 주요 화면) |
| 9 | 비즈니스 규칙 | `dev_plan/09_BUSINESS_RULES.md` | 전체 비즈니스 로직 |
| 10 | 권한 매트릭스 | `dev_plan/10_PERMISSIONS.md` | 5역할 권한 + 코드 패턴 |
| 11 | 유저 플로우 | `dev_plan/11_USER_FLOWS.md` | 5개 핵심 플로우 |
| 12 | 컴포넌트 스펙 | `dev_plan/12_COMPONENT_SPECS.md` | 52개 컴포넌트 + outsome-react 매핑 |

### 시각 자료

| 파일 | 위치 | 용도 |
|------|------|------|
| 와이어프레임 | `_bmad-output/excalidraw-diagrams/founder-sprint-wireframes.excalidraw` | 21개 화면 레이아웃 (구조 참고) |
| ERD | `_bmad-output/excalidraw-diagrams/founder-sprint-erd.excalidraw` | 21개 모델 관계 시각화 |
| 디자인 테마 | `_bmad-output/excalidraw-diagrams/founder-sprint-theme.json` | Outsome 브랜드 색상/폰트/간격 |

### 디자인 참조

| 자료 | 위치 | 용도 |
|------|------|------|
| outsome-react | `outsome-react/` | Bookface 스타일 React 컴포넌트 라이브러리 |
| bookface CSS | `outsome-react/src/bookface.css` | 원본 디자인 토큰 |
| Outsome 로고 | `image.png`, `image copy.png` | 브랜드 아이덴티티 참조 |

### 디자인 원칙
- **구조**: YC Bookface 레이아웃 (2컬럼 피드, 탑 네비, 카드 기반)
- **색상/폰트**: Outsome 브랜드 (`founder-sprint-theme.json` 기준)
- **컴포넌트**: outsome-react 라이브러리에서 재사용 가능한 것은 재사용 (12_COMPONENT_SPECS.md 참조)

---

**End of Document**
