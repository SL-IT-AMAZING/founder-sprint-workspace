# Integration Checklist - Founder Sprint Workspace MVP

> Step-by-step checklist to build the complete MVP from dev_plan

## Pre-Build Verification

Before starting implementation, verify:

- [ ] All credentials obtained (see `06_API_REQUIREMENTS.md`)
- [ ] Node.js 20+ installed
- [ ] pnpm installed globally (`npm install -g pnpm`)
- [ ] Supabase project created and configured

---

## Phase 1: Project Setup

### 1.1 Create Next.js Project
```bash
pnpm create next-app@latest founder-sprint-workspace \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir \
  --import-alias "@/*"
```

- [ ] Project created
- [ ] Navigate to project directory

### 1.2 Install Dependencies
```bash
pnpm add @supabase/supabase-js@2.91.0 @supabase/ssr@0.8.0
pnpm add prisma@7.3.0 @prisma/client@7.3.0
pnpm add zod@4.3.5
pnpm add googleapis@170.1.0
pnpm add -D @types/node @types/react
```

- [ ] All dependencies installed
- [ ] Verify versions match POC-verified versions

### 1.3 Configure Files

Copy from `03_CODE_TEMPLATES/`:

- [ ] `prisma.config.ts` -> project root
- [ ] `globals.css` -> `src/app/globals.css`
- [ ] `middleware.ts` -> `src/middleware.ts`

### 1.4 Environment Setup

- [ ] Create `.env.local` from `06_API_REQUIREMENTS.md` template
- [ ] Fill in all credentials

---

## Phase 2: Database Setup

### 2.1 Prisma Schema

- [ ] Create `prisma/schema.prisma` from `02_PRISMA_SCHEMA.md`
- [ ] Run `npx prisma generate`
- [ ] Run `npx prisma db push`

### 2.2 Verify Database

- [ ] Check Supabase Dashboard for created tables
- [ ] Verify all 18 models exist:
  - User, Cohort, Program, Module
  - Question, Answer, QuestionUpvote
  - OfficeHoursSession, OfficeHoursRegistration
  - Assignment, AssignmentSubmission
  - Post, Comment, PostLike
  - Notification, AuditLog, Setting

---

## Phase 3: Authentication

### 3.1 Supabase Auth Setup

Copy from `03_CODE_TEMPLATES/`:

- [ ] `supabase-client.ts` -> `src/lib/supabase/client.ts`
- [ ] `supabase-server.ts` -> `src/lib/supabase/server.ts`
- [ ] `supabase-middleware.ts` -> `src/lib/supabase/middleware.ts`
- [ ] `auth-actions.ts` -> `src/actions/auth.ts`
- [ ] `auth-callback.ts` -> `src/app/auth/callback/route.ts`

### 3.2 Auth Pages

- [ ] Create `src/app/login/page.tsx` from `login-page.tsx` template
- [ ] Create `src/app/auth/callback/route.ts`
- [ ] Test login flow with LinkedIn

### 3.3 Session Management

- [ ] Create `src/lib/auth.ts` with `getSession()` helper
- [ ] Verify middleware protects `/dashboard/*` routes

---

## Phase 4: Core Components

### 4.1 UI Components

Copy all from `03_CODE_TEMPLATES/components/` to `src/components/`:

- [ ] `button.tsx`
- [ ] `card.tsx`
- [ ] `input.tsx`
- [ ] `modal.tsx`
- [ ] `avatar.tsx`
- [ ] `badge.tsx`
- [ ] `sidebar.tsx`
- [ ] `navbar.tsx`
- [ ] `page-header.tsx`
- [ ] `index.ts` (exports)

### 4.2 Layout Components

- [ ] Create `src/app/(dashboard)/layout.tsx` using `dashboard-layout.tsx` template
- [ ] Create `src/app/(auth)/layout.tsx` for auth pages

---

## Phase 5: Server Actions

Copy all from `03_CODE_TEMPLATES/actions/` to `src/actions/`:

- [ ] `questions.ts`
- [ ] `office-hours.ts`
- [ ] `assignments.ts`
- [ ] `users.ts`
- [ ] `community.ts`

### 5.1 Prisma Client Setup

- [ ] Create `src/lib/prisma.ts` from `prisma.ts` template

---

## Phase 6: Page Implementation

### 6.1 Dashboard

- [ ] Create `src/app/(dashboard)/dashboard/page.tsx`
- [ ] Implement stats fetching from database
- [ ] Wire up recent questions, sessions, assignments

### 6.2 Questions

- [ ] `src/app/(dashboard)/questions/page.tsx` - List
- [ ] `src/app/(dashboard)/questions/[id]/page.tsx` - Detail
- [ ] `src/app/(dashboard)/questions/new/page.tsx` - Create

### 6.3 Office Hours

- [ ] `src/app/(dashboard)/office-hours/page.tsx` - Calendar/List
- [ ] `src/app/(dashboard)/office-hours/[id]/page.tsx` - Session Detail
- [ ] Wire up Google Calendar API

### 6.4 Assignments

- [ ] `src/app/(dashboard)/assignments/page.tsx` - List
- [ ] `src/app/(dashboard)/assignments/[id]/page.tsx` - Detail/Submit

### 6.5 Community

- [ ] `src/app/(dashboard)/community/page.tsx` - Posts List
- [ ] `src/app/(dashboard)/community/[id]/page.tsx` - Post Detail
- [ ] `src/app/(dashboard)/community/new/page.tsx` - Create Post

### 6.6 Admin Pages

- [ ] `src/app/(dashboard)/admin/page.tsx` - Admin Dashboard
- [ ] `src/app/(dashboard)/admin/users/page.tsx` - User Management
- [ ] `src/app/(dashboard)/admin/cohorts/page.tsx` - Cohort Management
- [ ] `src/app/(dashboard)/admin/assignments/page.tsx` - Assignment Management
- [ ] `src/app/(dashboard)/admin/office-hours/page.tsx` - Session Management

---

## Phase 7: File Storage

### 7.1 Supabase Storage Setup

In Supabase Dashboard:

- [ ] Create bucket: `avatars` (public)
- [ ] Create bucket: `submissions` (private)
- [ ] Set RLS policies for each bucket

### 7.2 Storage Implementation

Copy from `03_CODE_TEMPLATES/`:

- [ ] Create `src/lib/supabase/storage.ts`
- [ ] Create `src/actions/upload.ts`

---

## Phase 8: Google Calendar Integration

### 8.1 Calendar API Setup

- [ ] Copy `google-calendar.ts` to `src/lib/google-calendar.ts`
- [ ] Verify service account has Calendar API enabled

### 8.2 Office Hours Integration

- [ ] Add calendar event creation when session created
- [ ] Add calendar event update when session modified
- [ ] Add calendar event deletion when session cancelled

---

## Phase 9: Testing & Verification

### 9.1 Build Verification

```bash
pnpm build
```

- [ ] Build succeeds with no errors
- [ ] No TypeScript errors
- [ ] No lint errors

### 9.2 Feature Testing

| Feature | Test | Status |
|---------|------|--------|
| Login | LinkedIn OAuth works | [ ] |
| Logout | Session cleared | [ ] |
| Dashboard | Stats load correctly | [ ] |
| Questions | CRUD operations work | [ ] |
| Answers | Post and accept answers | [ ] |
| Office Hours | Register/unregister | [ ] |
| Assignments | Submit and review | [ ] |
| Community | Posts and comments | [ ] |
| Admin | User management | [ ] |
| File Upload | Avatar and submission files | [ ] |

### 9.3 Role-Based Access

- [ ] Founder can only access founder features
- [ ] Mentor can review submissions and answer questions
- [ ] Admin can access all admin features

---

## Phase 10: Deployment

### 10.1 Vercel Setup

- [ ] Connect GitHub repo to Vercel
- [ ] Add all environment variables
- [ ] Configure build settings

### 10.2 Production Verification

- [ ] Deployment succeeds
- [ ] All features work in production
- [ ] LinkedIn OAuth redirect works

---

## Quick Reference

### File Structure After Build

```
src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── layout.tsx
│   ├── (dashboard)/
│   │   ├── dashboard/page.tsx
│   │   ├── questions/
│   │   ├── office-hours/
│   │   ├── assignments/
│   │   ├── community/
│   │   ├── admin/
│   │   └── layout.tsx
│   ├── auth/callback/route.ts
│   ├── globals.css
│   └── layout.tsx
├── actions/
│   ├── auth.ts
│   ├── questions.ts
│   ├── office-hours.ts
│   ├── assignments.ts
│   ├── users.ts
│   └── community.ts
├── components/
│   ├── button.tsx
│   ├── card.tsx
│   ├── input.tsx
│   ├── modal.tsx
│   ├── avatar.tsx
│   ├── badge.tsx
│   ├── sidebar.tsx
│   ├── navbar.tsx
│   └── page-header.tsx
├── lib/
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   ├── middleware.ts
│   │   └── storage.ts
│   ├── prisma.ts
│   ├── auth.ts
│   └── google-calendar.ts
└── middleware.ts
prisma/
└── schema.prisma
prisma.config.ts
```

### Commands Reference

```bash
# Development
pnpm dev

# Build
pnpm build

# Database
npx prisma generate
npx prisma db push
npx prisma studio

# Type checking
pnpm tsc --noEmit
```

---

## Estimated Timeline

| Phase | Estimated Time |
|-------|----------------|
| Phase 1-2: Setup | 2-3 hours |
| Phase 3: Auth | 2-3 hours |
| Phase 4-5: Components & Actions | 4-6 hours |
| Phase 6: Pages | 8-12 hours |
| Phase 7-8: Storage & Calendar | 2-3 hours |
| Phase 9-10: Testing & Deploy | 3-4 hours |
| **Total** | **21-31 hours** |

---

## Troubleshooting

### Common Issues

1. **Prisma generate fails**
   - Ensure `prisma.config.ts` is in project root
   - Verify DATABASE_URL format

2. **LinkedIn OAuth fails**
   - Check redirect URL matches exactly
   - Verify OpenID Connect product is approved

3. **Supabase cookies not working**
   - Ensure `await cookies()` in Next.js 16
   - Check middleware is running

4. **Google Calendar API errors**
   - Verify private key has `\n` escapes
   - Check service account has Calendar API enabled

### Support

- PRD: `_bmad-output/Founder_Sprint_MVP_기획서.md`
- POC Verification: `00_POC_VERIFICATION_REPORT.md`
- POC Project: `dev_poc/poc-test/`
