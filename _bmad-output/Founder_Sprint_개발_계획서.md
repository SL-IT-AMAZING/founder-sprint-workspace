# Founder Sprint MVP - 개발 계획서

**문서 버전**: v1.0  
**작성일**: 2026년 1월 20일  
**목적**: AI 또는 개발자가 바로 구현할 수 있도록 기술 스택, 프로젝트 구조, API 명세를 상세히 정의

---

## 목차

1. [기술 스택](#1-기술-스택)
2. [프로젝트 구조](#2-프로젝트-구조)
3. [데이터베이스 설정](#3-데이터베이스-설정)
4. [인증 설정](#4-인증-설정)
5. [API 엔드포인트](#5-api-엔드포인트)
6. [파일 스토리지](#6-파일-스토리지)
7. [Google Calendar 연동](#7-google-calendar-연동)
8. [환경 변수](#8-환경-변수)
9. [배포 가이드](#9-배포-가이드)
10. [개발 순서](#10-개발-순서)

---

## 1. 기술 스택

### 1.1 확정 스택

| 영역 | 기술 | 버전 | 선택 이유 |
|------|------|------|----------|
| **Framework** | Next.js | 15.x (App Router) | 최대 생태계, AI 학습 데이터 풍부 |
| **Language** | TypeScript | 5.x | 타입 안전성, AI 코드 생성 정확도 향상 |
| **Database** | Supabase (PostgreSQL) | - | YC 55% 사용, 인프라 관리 불필요 |
| **ORM** | Prisma | 6.x | Type-safe 쿼리, 마이그레이션 관리 |
| **Auth** | Supabase Auth | - | LinkedIn OAuth 내장 지원 |
| **Storage** | Supabase Storage | - | 통합 솔루션, RLS 지원 |
| **Calendar** | Google Calendar API | v3 | Meet 링크 자동 생성 |
| **Deployment** | Vercel | - | Next.js 최적화, 무료 티어 |
| **Styling** | Tailwind CSS + CSS Variables | 4.x | Webflow 디자인 시스템 재현 |

### 1.2 디자인 시스템

**참조 문서**: `Founder_Sprint_디자인_시스템.md`  
**소스**: Webflow Export (`outsome.webflow`)

| 요소 | 값 |
|------|-----|
| **메인 배경** | `#fefaf3` (크림) |
| **세컨더리 배경** | `#f1eadd` (베이지) |
| **다크** | `#000000` |
| **Body 폰트** | BDO Grotesk (Variable) |
| **Heading 폰트** | Libre Caslon Condensed |
| **Badge 폰트** | Roboto Mono |
| **기본 간격** | 24px |
| **버튼 높이** | 48px (default), 42px (small) |
| **Border Radius** | 6px (card), 9px (button/input) |

### 1.3 패키지 목록

```json
{
  "dependencies": {
    "next": "^15.1.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "@supabase/supabase-js": "^2.45.0",
    "@supabase/ssr": "^0.5.0",
    "@prisma/client": "^6.0.0",
    "tailwindcss": "^4.0.0",
    "googleapis": "^144.0.0",
    "zod": "^3.23.0",
    "date-fns": "^4.1.0"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "prisma": "^6.0.0",
    "@types/node": "^22.0.0",
    "@types/react": "^19.0.0",
    "eslint": "^9.0.0",
    "eslint-config-next": "^15.1.0"
  }
}
```

### 1.3 버전 호환성 노트

- **Next.js 15**: App Router 사용 (Pages Router 사용 안 함)
- **React 19**: Server Components 기본
- **Prisma 6**: Supabase와 연동 시 `directUrl` 필수 설정
- **Supabase Auth**: `linkedin_oidc` provider 사용 (legacy `linkedin` 아님)

---

## 2. 프로젝트 구조

### 2.1 폴더 구조

```
founder-sprint/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 인증 관련 라우트 그룹
│   │   ├── login/
│   │   │   └── page.tsx          # 로그인 페이지
│   │   ├── callback/
│   │   │   └── route.ts          # OAuth 콜백 핸들러
│   │   └── layout.tsx            # 인증 레이아웃 (사이드바 없음)
│   │
│   ├── (dashboard)/              # 대시보드 라우트 그룹
│   │   ├── layout.tsx            # 대시보드 레이아웃 (사이드바 + 탑바)
│   │   ├── page.tsx              # 대시보드 홈
│   │   │
│   │   ├── questions/
│   │   │   ├── page.tsx          # 질문 리스트
│   │   │   ├── new/
│   │   │   │   └── page.tsx      # 질문 작성 (Founder만)
│   │   │   └── [id]/
│   │   │       └── page.tsx      # 질문 상세
│   │   │
│   │   ├── office-hours/
│   │   │   ├── page.tsx          # 오피스아워 캘린더
│   │   │   └── [slotId]/
│   │   │       └── page.tsx      # 슬롯 상세/요청
│   │   │
│   │   ├── sessions/
│   │   │   ├── page.tsx          # 세션 리스트
│   │   │   ├── new/
│   │   │   │   └── page.tsx      # 세션 생성 (Admin만)
│   │   │   └── [id]/
│   │   │       └── page.tsx      # 세션 상세/수정
│   │   │
│   │   ├── assignments/
│   │   │   ├── page.tsx          # 과제 리스트
│   │   │   ├── new/
│   │   │   │   └── page.tsx      # 과제 생성 (Admin만)
│   │   │   └── [id]/
│   │   │       ├── page.tsx      # 과제 상세/제출
│   │   │       └── submissions/
│   │   │           └── page.tsx  # 제출 현황 (Admin/Mentor)
│   │   │
│   │   ├── community/
│   │   │   ├── page.tsx          # 커뮤니티 피드
│   │   │   ├── new/
│   │   │   │   └── page.tsx      # 게시글 작성
│   │   │   └── [postId]/
│   │   │       └── page.tsx      # 게시글 상세
│   │   │
│   │   └── admin/
│   │       ├── page.tsx          # Admin 대시보드 (리다이렉트)
│   │       ├── batches/
│   │       │   └── page.tsx      # Batch 관리
│   │       └── users/
│   │           └── page.tsx      # 사용자 관리
│   │
│   ├── api/                      # API Route Handlers
│   │   ├── auth/
│   │   │   └── callback/
│   │   │       └── route.ts      # Supabase Auth 콜백
│   │   │
│   │   ├── questions/
│   │   │   ├── route.ts          # GET (list), POST (create)
│   │   │   └── [id]/
│   │   │       ├── route.ts      # GET, PATCH
│   │   │       ├── answers/
│   │   │       │   └── route.ts  # POST (create answer)
│   │   │       └── summary/
│   │   │           └── route.ts  # POST (create summary)
│   │   │
│   │   ├── office-hours/
│   │   │   ├── slots/
│   │   │   │   ├── route.ts      # GET (list), POST (create)
│   │   │   │   └── [slotId]/
│   │   │   │       └── route.ts  # GET, PATCH, DELETE
│   │   │   └── requests/
│   │   │       ├── route.ts      # POST (create request)
│   │   │       └── [requestId]/
│   │   │           └── route.ts  # PATCH (approve/reject)
│   │   │
│   │   ├── sessions/
│   │   │   ├── route.ts          # GET, POST
│   │   │   └── [id]/
│   │   │       └── route.ts      # GET, PATCH, DELETE
│   │   │
│   │   ├── assignments/
│   │   │   ├── route.ts          # GET, POST
│   │   │   └── [id]/
│   │   │       ├── route.ts      # GET, PATCH, DELETE
│   │   │       ├── submissions/
│   │   │       │   └── route.ts  # GET (list), POST (submit)
│   │   │       └── submissions/[submissionId]/
│   │   │           └── feedback/
│   │   │               └── route.ts  # POST (create feedback)
│   │   │
│   │   ├── posts/
│   │   │   ├── route.ts          # GET, POST
│   │   │   └── [postId]/
│   │   │       ├── route.ts      # GET, PATCH, DELETE
│   │   │       ├── comments/
│   │   │       │   └── route.ts  # GET, POST
│   │   │       └── like/
│   │   │           └── route.ts  # POST, DELETE
│   │   │
│   │   ├── batches/
│   │   │   ├── route.ts          # GET, POST
│   │   │   └── [id]/
│   │   │       └── route.ts      # GET, PATCH (archive)
│   │   │
│   │   ├── users/
│   │   │   ├── route.ts          # GET (list)
│   │   │   ├── invite/
│   │   │   │   └── route.ts      # POST (send invite)
│   │   │   └── [id]/
│   │   │       └── route.ts      # GET, PATCH (role change)
│   │   │
│   │   └── upload/
│   │       └── route.ts          # POST (get signed URL)
│   │
│   ├── layout.tsx                # Root 레이아웃
│   ├── page.tsx                  # 랜딩 (로그인으로 리다이렉트)
│   ├── loading.tsx               # 글로벌 로딩
│   ├── error.tsx                 # 글로벌 에러
│   └── not-found.tsx             # 404 페이지
│
├── components/                   # 재사용 컴포넌트
│   ├── ui/                       # 기본 UI 컴포넌트 (보류)
│   ├── layout/
│   │   ├── topbar.tsx
│   │   ├── sidebar.tsx
│   │   └── dashboard-layout.tsx
│   ├── questions/
│   │   ├── question-card.tsx
│   │   ├── question-form.tsx
│   │   ├── answer-form.tsx
│   │   └── summary-form.tsx
│   ├── office-hours/
│   │   ├── calendar-view.tsx
│   │   ├── slot-card.tsx
│   │   └── slot-form.tsx
│   ├── sessions/
│   │   ├── session-card.tsx
│   │   └── session-form.tsx
│   ├── assignments/
│   │   ├── assignment-card.tsx
│   │   ├── assignment-form.tsx
│   │   ├── submission-form.tsx
│   │   └── submissions-table.tsx
│   ├── community/
│   │   ├── post-card.tsx
│   │   ├── post-form.tsx
│   │   └── comment-thread.tsx
│   └── shared/
│       ├── file-upload.tsx
│       ├── role-badge.tsx
│       ├── status-badge.tsx
│       └── empty-state.tsx
│
├── lib/                          # 유틸리티 및 설정
│   ├── supabase/
│   │   ├── client.ts             # 브라우저용 클라이언트
│   │   ├── server.ts             # 서버용 클라이언트
│   │   └── middleware.ts         # Supabase 미들웨어
│   ├── prisma.ts                 # Prisma 클라이언트 싱글톤
│   ├── google-calendar.ts        # Google Calendar API 헬퍼
│   ├── utils.ts                  # 공통 유틸리티
│   └── validations/              # Zod 스키마
│       ├── question.ts
│       ├── office-hour.ts
│       ├── session.ts
│       ├── assignment.ts
│       ├── post.ts
│       └── user.ts
│
├── hooks/                        # Custom React Hooks
│   ├── use-user.ts               # 현재 사용자 정보
│   ├── use-batch.ts              # 현재 Batch 정보
│   └── use-role.ts               # 역할 기반 권한 체크
│
├── types/                        # TypeScript 타입 정의
│   ├── database.ts               # Prisma 생성 타입 re-export
│   └── api.ts                    # API 요청/응답 타입
│
├── prisma/
│   ├── schema.prisma             # 데이터베이스 스키마
│   └── seed.ts                   # 초기 데이터 시딩
│
├── middleware.ts                 # Next.js 미들웨어 (인증 체크)
├── next.config.ts                # Next.js 설정
├── tsconfig.json                 # TypeScript 설정
├── .env.local                    # 로컬 환경 변수 (Git 제외)
├── .env.example                  # 환경 변수 예시
└── package.json
```

### 2.2 라우트 그룹 설명

| 그룹 | 경로 | 레이아웃 | 설명 |
|------|------|----------|------|
| `(auth)` | `/login`, `/callback` | 인증 레이아웃 | 사이드바 없음, 센터 정렬 |
| `(dashboard)` | `/`, `/questions`, etc. | 대시보드 레이아웃 | 탑바 + 사이드바 |

### 2.3 Server vs Client Components

| 유형 | 사용 시점 | 예시 |
|------|----------|------|
| **Server Component** | 데이터 페칭, SEO 필요, 비밀 정보 접근 | `page.tsx`, 리스트 컴포넌트 |
| **Client Component** | 인터랙티브, useState/useEffect, 브라우저 API | 폼, 버튼, 모달 |

```tsx
// Server Component (기본값)
// app/(dashboard)/questions/page.tsx
import { prisma } from '@/lib/prisma'
import { QuestionList } from '@/components/questions/question-list'

export default async function QuestionsPage() {
  const questions = await prisma.question.findMany({
    include: { author: true, _count: { select: { answers: true } } }
  })
  return <QuestionList questions={questions} />
}
```

```tsx
// Client Component
// components/questions/question-form.tsx
'use client'

import { useState } from 'react'

export function QuestionForm() {
  const [title, setTitle] = useState('')
  // ...
}
```

---

## 3. 데이터베이스 설정

### 3.1 Prisma 스키마

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ============ USERS & AUTH ============

model User {
  id            String   @id @default(uuid())
  email         String   @unique
  name          String
  linkedinId    String?  @unique
  profileImage  String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  userBatches       UserBatch[]
  questions         Question[]
  answers           Answer[]
  summaries         Summary[]
  officeHourSlots   OfficeHourSlot[]
  officeHourRequests OfficeHourRequest[]
  submissions       Submission[]
  feedbacks         Feedback[]
  posts             Post[]
  comments          Comment[]
  likes             Like[]
}

model Batch {
  id          String      @id @default(uuid())
  name        String
  description String?
  startDate   DateTime
  endDate     DateTime
  status      BatchStatus @default(ACTIVE)
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  // Relations
  userBatches     UserBatch[]
  questions       Question[]
  officeHourSlots OfficeHourSlot[]
  sessions        Session[]
  assignments     Assignment[]
  posts           Post[]
}

enum BatchStatus {
  ACTIVE
  ARCHIVED
}

model UserBatch {
  id        String          @id @default(uuid())
  userId    String
  batchId   String
  role      UserRole
  invitedAt DateTime        @default(now())
  joinedAt  DateTime?
  status    UserBatchStatus @default(INVITED)

  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  batch Batch @relation(fields: [batchId], references: [id], onDelete: Cascade)

  @@unique([userId, batchId])
}

enum UserRole {
  ADMIN
  MENTOR
  FOUNDER
}

enum UserBatchStatus {
  INVITED
  ACTIVE
}

// ============ QUESTIONS ============

model Question {
  id        String         @id @default(uuid())
  batchId   String
  authorId  String
  title     String
  content   String
  status    QuestionStatus @default(OPEN)
  createdAt DateTime       @default(now())
  updatedAt DateTime       @updatedAt

  batch       Batch                 @relation(fields: [batchId], references: [id], onDelete: Cascade)
  author      User                  @relation(fields: [authorId], references: [id], onDelete: Cascade)
  answers     Answer[]
  summary     Summary?
  attachments QuestionAttachment[]
}

enum QuestionStatus {
  OPEN
  CLOSED
}

model QuestionAttachment {
  id         String   @id @default(uuid())
  questionId String
  fileUrl    String
  fileName   String
  fileSize   Int
  fileType   String
  createdAt  DateTime @default(now())

  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
}

model Answer {
  id         String   @id @default(uuid())
  questionId String
  authorId   String
  content    String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  author   User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
}

model Summary {
  id         String   @id @default(uuid())
  questionId String   @unique
  authorId   String
  content    String
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  author   User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
}

// ============ OFFICE HOURS ============

model OfficeHourSlot {
  id             String               @id @default(uuid())
  batchId        String
  hostId         String
  startTime      DateTime
  endTime        DateTime
  timezone       String               @default("PST")
  status         OfficeHourSlotStatus @default(AVAILABLE)
  note           String?
  googleMeetLink String?
  googleEventId  String?
  createdAt      DateTime             @default(now())

  batch    Batch               @relation(fields: [batchId], references: [id], onDelete: Cascade)
  host     User                @relation(fields: [hostId], references: [id], onDelete: Cascade)
  requests OfficeHourRequest[]
}

enum OfficeHourSlotStatus {
  AVAILABLE
  REQUESTED
  CONFIRMED
  COMPLETED
  CANCELLED
}

model OfficeHourRequest {
  id          String                    @id @default(uuid())
  slotId      String
  requesterId String
  message     String?
  status      OfficeHourRequestStatus   @default(PENDING)
  createdAt   DateTime                  @default(now())
  respondedAt DateTime?

  slot      OfficeHourSlot @relation(fields: [slotId], references: [id], onDelete: Cascade)
  requester User           @relation(fields: [requesterId], references: [id], onDelete: Cascade)
}

enum OfficeHourRequestStatus {
  PENDING
  APPROVED
  REJECTED
  CANCELLED
}

// ============ SESSIONS ============

model Session {
  id           String   @id @default(uuid())
  batchId      String
  title        String
  description  String?
  sessionDate  DateTime
  slidesUrl    String?
  recordingUrl String?
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  batch Batch @relation(fields: [batchId], references: [id], onDelete: Cascade)
}

// ============ ASSIGNMENTS ============

model Assignment {
  id          String   @id @default(uuid())
  batchId     String
  title       String
  description String
  templateUrl String?
  dueDate     DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  batch       Batch        @relation(fields: [batchId], references: [id], onDelete: Cascade)
  submissions Submission[]
}

model Submission {
  id           String   @id @default(uuid())
  assignmentId String
  authorId     String
  content      String?
  linkUrl      String?
  isLate       Boolean  @default(false)
  submittedAt  DateTime @default(now())
  updatedAt    DateTime @updatedAt

  assignment Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  author     User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  feedbacks  Feedback[]

  @@unique([assignmentId, authorId])
}

model Feedback {
  id           String   @id @default(uuid())
  submissionId String
  authorId     String
  content      String
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  submission Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  author     User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
}

// ============ COMMUNITY ============

model Post {
  id        String   @id @default(uuid())
  batchId   String
  authorId  String
  content   String
  isPinned  Boolean  @default(false)
  isHidden  Boolean  @default(false)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  batch    Batch       @relation(fields: [batchId], references: [id], onDelete: Cascade)
  author   User        @relation(fields: [authorId], references: [id], onDelete: Cascade)
  images   PostImage[]
  comments Comment[]
  likes    Like[]
}

model PostImage {
  id        String   @id @default(uuid())
  postId    String
  imageUrl  String
  createdAt DateTime @default(now())

  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)
}

model Comment {
  id        String   @id @default(uuid())
  postId    String
  parentId  String?
  authorId  String
  content   String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  post     Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  parent   Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies  Comment[] @relation("CommentReplies")
  author   User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  likes    Like[]
}

model Like {
  id         String   @id @default(uuid())
  userId     String
  postId     String?
  commentId  String?
  createdAt  DateTime @default(now())

  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  post    Post?    @relation(fields: [postId], references: [id], onDelete: Cascade)
  comment Comment? @relation(fields: [commentId], references: [id], onDelete: Cascade)

  @@unique([userId, postId])
  @@unique([userId, commentId])
}
```

### 3.2 Supabase + Prisma 연동

```typescript
// lib/prisma.ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 3.3 환경 변수 (DB)

```env
# Supabase Connection Pooler (Transaction Mode) - for Prisma
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct Connection - for Prisma Migrations
DIRECT_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

---

## 4. 인증 설정

### 4.1 Supabase Auth - LinkedIn OIDC

**LinkedIn Developer Dashboard 설정:**
1. https://www.linkedin.com/developers/apps 에서 앱 생성
2. Products → "Sign In with LinkedIn using OpenID Connect" 활성화
3. Auth 탭에서 Redirect URL 추가: `https://[PROJECT_REF].supabase.co/auth/v1/callback`
4. Client ID, Client Secret 복사

**Supabase Dashboard 설정:**
1. Authentication → Providers → LinkedIn 활성화
2. Client ID, Client Secret 입력
3. Callback URL 확인

### 4.2 클라이언트 코드

```typescript
// lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```typescript
// lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )
}
```

### 4.3 로그인 구현

```typescript
// app/(auth)/login/page.tsx
import { LoginButton } from '@/components/auth/login-button'

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1>Founder Sprint</h1>
        <p>Sign in to continue to your workspace</p>
        <LoginButton />
      </div>
    </div>
  )
}
```

```typescript
// components/auth/login-button.tsx
'use client'

import { createClient } from '@/lib/supabase/client'

export function LoginButton() {
  const handleLogin = async () => {
    const supabase = createClient()
    await supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: {
        redirectTo: `${window.location.origin}/callback`
      }
    })
  }

  return (
    <button onClick={handleLogin}>
      Continue with LinkedIn
    </button>
  )
}
```

```typescript
// app/(auth)/callback/route.ts
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
```

### 4.4 미들웨어 (인증 보호)

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  // 로그인 페이지가 아니고 사용자가 없으면 로그인으로 리다이렉트
  if (!user && !request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 로그인된 상태에서 로그인 페이지 접근 시 대시보드로
  if (user && request.nextUrl.pathname.startsWith('/login')) {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
```

---

## 5. API 엔드포인트

### 5.1 엔드포인트 목록

#### Questions

| Method | Endpoint | 권한 | 설명 |
|--------|----------|------|------|
| GET | `/api/questions` | All | 질문 목록 조회 |
| POST | `/api/questions` | Founder | 질문 생성 |
| GET | `/api/questions/[id]` | All | 질문 상세 조회 |
| PATCH | `/api/questions/[id]` | Author (답변 전) | 질문 수정 |
| POST | `/api/questions/[id]/answers` | Admin, Mentor | 답변 생성 |
| POST | `/api/questions/[id]/summary` | Admin, Mentor | 요약 생성 (질문 Close) |

#### Office Hours

| Method | Endpoint | 권한 | 설명 |
|--------|----------|------|------|
| GET | `/api/office-hours/slots` | All | 슬롯 목록 조회 |
| POST | `/api/office-hours/slots` | Admin, Mentor | 슬롯 생성 |
| PATCH | `/api/office-hours/slots/[slotId]` | Host | 슬롯 수정/취소 |
| POST | `/api/office-hours/requests` | Founder | 오피스아워 요청 |
| PATCH | `/api/office-hours/requests/[requestId]` | Host, Admin | 요청 승인/거절 |

#### Sessions

| Method | Endpoint | 권한 | 설명 |
|--------|----------|------|------|
| GET | `/api/sessions` | All | 세션 목록 |
| POST | `/api/sessions` | Admin | 세션 생성 |
| GET | `/api/sessions/[id]` | All | 세션 상세 |
| PATCH | `/api/sessions/[id]` | Admin | 세션 수정 |
| DELETE | `/api/sessions/[id]` | Admin | 세션 삭제 |

#### Assignments

| Method | Endpoint | 권한 | 설명 |
|--------|----------|------|------|
| GET | `/api/assignments` | All | 과제 목록 |
| POST | `/api/assignments` | Admin | 과제 생성 |
| GET | `/api/assignments/[id]` | All | 과제 상세 |
| POST | `/api/assignments/[id]/submissions` | Founder | 과제 제출 |
| GET | `/api/assignments/[id]/submissions` | Admin, Mentor | 제출 현황 |
| POST | `/api/assignments/[id]/submissions/[subId]/feedback` | Admin, Mentor | 피드백 작성 |

#### Community

| Method | Endpoint | 권한 | 설명 |
|--------|----------|------|------|
| GET | `/api/posts` | All | 게시글 목록 |
| POST | `/api/posts` | All | 게시글 작성 |
| GET | `/api/posts/[postId]` | All | 게시글 상세 |
| PATCH | `/api/posts/[postId]` | Author | 게시글 수정 |
| DELETE | `/api/posts/[postId]` | Author, Admin | 게시글 삭제 |
| POST | `/api/posts/[postId]/comments` | All | 댓글 작성 |
| POST | `/api/posts/[postId]/like` | All | 좋아요 |
| DELETE | `/api/posts/[postId]/like` | All | 좋아요 취소 |

#### Admin

| Method | Endpoint | 권한 | 설명 |
|--------|----------|------|------|
| GET | `/api/batches` | All | Batch 목록 |
| POST | `/api/batches` | Admin | Batch 생성 |
| PATCH | `/api/batches/[id]` | Admin | Batch 수정/Archive |
| GET | `/api/users` | Admin | 사용자 목록 |
| POST | `/api/users/invite` | Admin | 사용자 초대 |
| PATCH | `/api/users/[id]` | Admin | 역할 변경 |

#### File Upload

| Method | Endpoint | 권한 | 설명 |
|--------|----------|------|------|
| POST | `/api/upload` | All | Signed URL 발급 |

### 5.2 API 구현 예시

```typescript
// app/api/questions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

// GET /api/questions
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') // 'OPEN' | 'CLOSED' | null

  // 현재 사용자의 active batch 가져오기
  const userBatch = await prisma.userBatch.findFirst({
    where: {
      user: { email: user.email },
      batch: { status: 'ACTIVE' },
      status: 'ACTIVE'
    }
  })

  if (!userBatch) {
    return NextResponse.json({ error: 'No active batch' }, { status: 403 })
  }

  const questions = await prisma.question.findMany({
    where: {
      batchId: userBatch.batchId,
      ...(status ? { status: status as 'OPEN' | 'CLOSED' } : {})
    },
    include: {
      author: { select: { id: true, name: true, profileImage: true } },
      _count: { select: { answers: true } },
      summary: { select: { id: true } }
    },
    orderBy: { createdAt: 'desc' }
  })

  return NextResponse.json(questions)
}

// POST /api/questions
const createQuestionSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(5000),
})

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Founder 권한 체크
  const userBatch = await prisma.userBatch.findFirst({
    where: {
      user: { email: user.email },
      batch: { status: 'ACTIVE' },
      status: 'ACTIVE',
      role: 'FOUNDER'
    }
  })

  if (!userBatch) {
    return NextResponse.json({ error: 'Only Founders can create questions' }, { status: 403 })
  }

  const body = await request.json()
  const parsed = createQuestionSchema.safeParse(body)
  
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email }
  })

  const question = await prisma.question.create({
    data: {
      batchId: userBatch.batchId,
      authorId: dbUser!.id,
      title: parsed.data.title,
      content: parsed.data.content,
    },
    include: {
      author: { select: { id: true, name: true, profileImage: true } }
    }
  })

  return NextResponse.json(question, { status: 201 })
}
```

---

## 6. 파일 스토리지

### 6.1 Supabase Storage 설정

**Buckets:**
- `question-attachments`: 질문 첨부파일 (이미지, PDF, max 10MB)
- `post-images`: 게시글 이미지 (max 5MB)

**RLS 정책:**
```sql
-- question-attachments bucket
CREATE POLICY "Authenticated users can upload"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'question-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Anyone can view"
ON storage.objects FOR SELECT
USING (bucket_id = 'question-attachments');
```

### 6.2 Signed URL 업로드

```typescript
// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { fileName, fileType, bucket } = await request.json()
  
  const allowedBuckets = ['question-attachments', 'post-images']
  if (!allowedBuckets.includes(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
  }

  const fileExt = fileName.split('.').pop()
  const uniqueFileName = `${uuidv4()}.${fileExt}`
  const filePath = `${user.id}/${uniqueFileName}`

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUploadUrl(filePath)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    signedUrl: data.signedUrl,
    path: filePath,
    publicUrl: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${filePath}`
  })
}
```

---

## 7. Google Calendar 연동

### 7.1 Service Account 설정

1. Google Cloud Console에서 프로젝트 생성
2. Google Calendar API 활성화
3. Service Account 생성 후 JSON 키 다운로드
4. peter@outsome.co 캘린더에 Service Account 이메일 권한 부여

### 7.2 구현

```typescript
// lib/google-calendar.ts
import { google, calendar_v3 } from 'googleapis'

const SCOPES = ['https://www.googleapis.com/auth/calendar']

function getAuth() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY!)
  
  return new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
    clientOptions: {
      subject: process.env.GOOGLE_CALENDAR_EMAIL // peter@outsome.co
    }
  })
}

export async function createCalendarEvent({
  summary,
  description,
  startTime,
  endTime,
  attendees,
}: {
  summary: string
  description?: string
  startTime: Date
  endTime: Date
  attendees: string[]
}): Promise<{ eventId: string; meetLink: string }> {
  const auth = getAuth()
  const calendar = google.calendar({ version: 'v3', auth })

  const event: calendar_v3.Schema$Event = {
    summary,
    description,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: 'America/Los_Angeles', // PST
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: 'America/Los_Angeles',
    },
    attendees: attendees.map(email => ({ email })),
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' }
      }
    }
  }

  const response = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_EMAIL!,
    requestBody: event,
    conferenceDataVersion: 1,
    sendUpdates: 'all', // 참석자에게 초대 이메일 발송
  })

  return {
    eventId: response.data.id!,
    meetLink: response.data.hangoutLink!,
  }
}

export async function deleteCalendarEvent(eventId: string) {
  const auth = getAuth()
  const calendar = google.calendar({ version: 'v3', auth })

  await calendar.events.delete({
    calendarId: process.env.GOOGLE_CALENDAR_EMAIL!,
    eventId,
    sendUpdates: 'all',
  })
}
```

### 7.3 오피스아워 승인 시 연동

```typescript
// app/api/office-hours/requests/[requestId]/route.ts (PATCH)
import { createCalendarEvent } from '@/lib/google-calendar'

// 승인 로직 내에서:
if (action === 'approve') {
  const { eventId, meetLink } = await createCalendarEvent({
    summary: `Office Hour: ${host.name} & ${requester.name}`,
    description: request.message || 'Founder Sprint Office Hour',
    startTime: slot.startTime,
    endTime: slot.endTime,
    attendees: [host.email, requester.email],
  })

  await prisma.officeHourSlot.update({
    where: { id: slot.id },
    data: {
      status: 'CONFIRMED',
      googleEventId: eventId,
      googleMeetLink: meetLink,
    }
  })

  await prisma.officeHourRequest.update({
    where: { id: requestId },
    data: {
      status: 'APPROVED',
      respondedAt: new Date(),
    }
  })
}
```

---

## 8. 환경 변수

### 8.1 .env.example

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT_REF].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# Database (Prisma)
DATABASE_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres

# Google Calendar
GOOGLE_SERVICE_ACCOUNT_KEY={"type":"service_account","project_id":"...","private_key":"..."}
GOOGLE_CALENDAR_EMAIL=peter@outsome.co

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 8.2 Vercel 환경 변수 설정

| 변수명 | Preview | Production |
|--------|:-------:|:----------:|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | ✅ |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | ✅ |
| `DATABASE_URL` | ✅ | ✅ |
| `DIRECT_URL` | ✅ | ✅ |
| `GOOGLE_SERVICE_ACCOUNT_KEY` | ✅ | ✅ |
| `GOOGLE_CALENDAR_EMAIL` | ✅ | ✅ |
| `NEXT_PUBLIC_APP_URL` | 각각 다름 | 각각 다름 |

---

## 9. 배포 가이드

### 9.1 Vercel 배포

1. GitHub 저장소 연결
2. Framework: Next.js 자동 감지
3. Root Directory: `.` (기본값)
4. Environment Variables 설정 (8.2 참조)
5. Deploy

### 9.2 Supabase 설정

1. **Database**: Prisma 마이그레이션 실행
   ```bash
   npx prisma migrate deploy
   ```

2. **Auth**: LinkedIn Provider 설정 (4.1 참조)

3. **Storage**: Buckets 생성
   - `question-attachments` (Private)
   - `post-images` (Private)

4. **RLS 정책**: SQL Editor에서 정책 추가

### 9.3 Google Cloud 설정

1. 프로젝트 생성
2. Calendar API 활성화
3. Service Account 생성
4. JSON 키 다운로드
5. peter@outsome.co 캘린더에 권한 부여

### 9.4 도메인 설정 (추후)

1. Vercel → Settings → Domains
2. 커스텀 도메인 추가
3. DNS 설정 (CNAME 또는 A 레코드)
4. Supabase Redirect URL 업데이트

---

## 10. 개발 순서

### Phase 1: 기반 설정 (1일)
- [ ] Next.js 프로젝트 생성
- [ ] Supabase 프로젝트 생성 및 연동
- [ ] Prisma 스키마 작성 및 마이그레이션
- [ ] LinkedIn OAuth 설정 및 테스트
- [ ] 기본 레이아웃 (탑바, 사이드바) 구현

### Phase 2: 핵심 기능 - Questions (2일)
- [ ] 질문 리스트 페이지
- [ ] 질문 상세 페이지
- [ ] 질문 작성 폼 (Founder)
- [ ] 답변 작성 폼 (Mentor/Admin)
- [ ] 요약 작성 폼 (Mentor/Admin)
- [ ] 첨부파일 업로드

### Phase 3: Office Hours (2일)
- [ ] 캘린더 뷰
- [ ] 슬롯 등록 모달 (Mentor/Admin)
- [ ] 슬롯 요청 (Founder)
- [ ] 요청 승인/거절
- [ ] Google Calendar 연동

### Phase 4: Sessions & Assignments (2일)
- [ ] 세션 리스트/상세/생성
- [ ] 과제 리스트/상세/생성
- [ ] 과제 제출 폼
- [ ] 제출 현황 대시보드
- [ ] 피드백 작성

### Phase 5: Community (1.5일)
- [ ] 게시글 리스트
- [ ] 게시글 상세
- [ ] 게시글 작성
- [ ] 댓글/대댓글
- [ ] 좋아요

### Phase 6: Admin (1일)
- [ ] Batch 관리
- [ ] 사용자 관리/초대

### Phase 7: 마무리 (0.5일)
- [ ] 에러 핸들링
- [ ] 로딩 상태
- [ ] 최종 테스트
- [ ] 배포

---

## Appendix: 추가 참고 자료

### 공식 문서
- [Next.js App Router](https://nextjs.org/docs/app)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Supabase LinkedIn Login](https://supabase.com/docs/guides/auth/social-login/auth-linkedin)
- [Prisma with Supabase](https://www.prisma.io/docs/guides/database/supabase)
- [Google Calendar API](https://developers.google.com/calendar/api/guides/create-events)

### 코드 예시
- Supabase + Next.js Starter: `npx create-next-app -e with-supabase`
- Prisma + Supabase Guide: https://prisma.io/docs/guides/supabase-accelerate

---

## 문서 끝
