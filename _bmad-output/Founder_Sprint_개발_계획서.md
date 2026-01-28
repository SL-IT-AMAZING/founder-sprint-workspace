# Founder Sprint Workspace MVP - 개발 계획서

**문서 버전**: v1.0  
**작성일**: 2026년 1월 22일  
**목적**: AI 에이전트가 처음부터 끝까지 오류 없이 개발을 완료할 수 있는 상세 계획서

---

## 1. 프로젝트 개요

### 1.1 프로젝트 정보
- **프로젝트명**: Founder Sprint Workspace MVP
- **클라이언트**: Peter Shin (YC W20) / Outsome
- **기술 스택**: Next.js 15 + TypeScript + Tailwind CSS 4 + Supabase + Prisma 6
- **배포**: Vercel
- **PRD 위치**: `/Users/cosmos/fs/_bmad-output/Founder_Sprint_MVP_기획서.md`
- **디자인 참조**: `/Users/cosmos/fs/outsome-react`
- **와이어프레임**: `/Users/cosmos/fs/_bmad-output/excalidraw-diagrams/founder-sprint-wireframes.excalidraw`

### 1.2 핵심 기능 요약
1. LinkedIn OAuth 로그인 (OIDC)
2. Batch(기수) 기반 데이터 분리
3. 질문 → 답변 → 요약 (Q&A)
4. 오피스아워 슬롯 등록/요청/승인 + Google Calendar 연동
5. 세션 & 슬라이드 관리
6. 과제 제출 & 피드백
7. 커뮤니티 게시판

---

## 2. 정확한 패키지 버전 (2026년 1월 기준)

### 2.1 Core Dependencies
```json
{
  "dependencies": {
    "next": "15.1.6",
    "@supabase/supabase-js": "2.49.1",
    "@supabase/ssr": "0.5.2",
    "@prisma/client": "6.3.0",
    "googleapis": "146.0.0",
    "zod": "3.24.1",
    "date-fns": "4.1.0",
    "date-fns-tz": "3.2.0",
    "react": "19.0.0",
    "react-dom": "19.0.0"
  },
  "devDependencies": {
    "prisma": "6.3.0",
    "typescript": "5.7.3",
    "@types/node": "22.10.7",
    "@types/react": "19.0.7",
    "@types/react-dom": "19.0.3",
    "eslint": "9.18.0",
    "eslint-config-next": "15.1.6"
  }
}
```

### 2.2 패키지 설치 명령어 (정확한 버전)
```bash
# 프로젝트 초기화
npx create-next-app@15.1.6 founder-sprint-workspace --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"

cd founder-sprint-workspace

# Supabase 패키지
npm install @supabase/supabase-js@2.49.1 @supabase/ssr@0.5.2

# Prisma
npm install @prisma/client@6.3.0
npm install -D prisma@6.3.0

# Google Calendar API
npm install googleapis@146.0.0

# Utilities
npm install zod@3.24.1 date-fns@4.1.0 date-fns-tz@3.2.0
```

---

## 3. 프로젝트 구조

```
founder-sprint-workspace/
├── .env.local                    # 환경변수 (개발)
├── .env.example                  # 환경변수 템플릿
├── next.config.ts                # Next.js 설정
├── tailwind.config.ts            # Tailwind 설정 (v4에서는 최소화)
├── prisma/
│   ├── schema.prisma             # Prisma 스키마
│   └── seed.ts                   # 시드 데이터
├── public/
│   ├── fonts/                    # 로컬 폰트 파일
│   │   ├── BDOGrotesk-VF.ttf
│   │   ├── RobotoMono-Medium.ttf
│   │   ├── LibreCaslonCondensed-Regular.otf
│   │   └── LibreCaslonCondensed-Italic.otf
│   └── images/
│       └── Outsome-Full_Black.svg
├── src/
│   ├── app/
│   │   ├── globals.css           # Tailwind CSS 4 설정
│   │   ├── layout.tsx            # Root Layout
│   │   ├── page.tsx              # 랜딩/로그인 페이지
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── auth/
│   │   │       └── callback/
│   │   │           └── route.ts  # OAuth 콜백 처리
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx        # 대시보드 레이아웃 (Navbar 포함)
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx
│   │   │   ├── questions/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── office-hours/
│   │   │   │   ├── page.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── sessions/
│   │   │   │   ├── page.tsx
│   │   │   │   └── new/
│   │   │   │       └── page.tsx
│   │   │   ├── assignments/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       ├── page.tsx
│   │   │   │       └── submissions/
│   │   │   │           └── page.tsx
│   │   │   ├── community/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   └── admin/
│   │   │       ├── batches/
│   │   │       │   └── page.tsx
│   │   │       └── users/
│   │   │           └── page.tsx
│   │   └── api/
│   │       └── google-calendar/
│   │           └── route.ts
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts         # Browser Client
│   │   │   ├── server.ts         # Server Client
│   │   │   └── middleware.ts     # Session Refresh
│   │   ├── prisma.ts             # Prisma Client Singleton
│   │   ├── google-calendar.ts    # Google Calendar API
│   │   └── utils.ts              # 유틸리티 함수
│   ├── actions/                  # Server Actions
│   │   ├── auth.ts
│   │   ├── batches.ts
│   │   ├── questions.ts
│   │   ├── answers.ts
│   │   ├── office-hours.ts
│   │   ├── sessions.ts
│   │   ├── assignments.ts
│   │   ├── submissions.ts
│   │   ├── posts.ts
│   │   ├── comments.ts
│   │   └── users.ts
│   ├── components/
│   │   ├── ui/                   # 기본 UI 컴포넌트
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── select.tsx
│   │   │   ├── badge.tsx
│   │   │   ├── card.tsx
│   │   │   ├── avatar.tsx
│   │   │   ├── modal.tsx
│   │   │   └── file-upload.tsx
│   │   ├── layout/
│   │   │   ├── navbar.tsx
│   │   │   └── footer.tsx
│   │   ├── forms/
│   │   │   ├── question-form.tsx
│   │   │   ├── answer-form.tsx
│   │   │   ├── slot-form.tsx
│   │   │   ├── session-form.tsx
│   │   │   ├── assignment-form.tsx
│   │   │   ├── submission-form.tsx
│   │   │   └── post-form.tsx
│   │   └── features/
│   │       ├── question-list.tsx
│   │       ├── answer-thread.tsx
│   │       ├── office-hour-calendar.tsx
│   │       ├── session-card.tsx
│   │       ├── assignment-card.tsx
│   │       ├── submission-table.tsx
│   │       ├── post-feed.tsx
│   │       └── comment-thread.tsx
│   ├── hooks/
│   │   ├── use-user.ts
│   │   └── use-batch.ts
│   └── types/
│       └── index.ts
└── middleware.ts                 # Auth Middleware
```

---

## 4. 환경 변수 설정

### 4.1 .env.local 파일
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Database (Supabase PostgreSQL)
DATABASE_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true
DIRECT_URL=postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres

# Google Calendar API (Service Account)
GOOGLE_SERVICE_ACCOUNT_EMAIL=founder-sprint@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_CALENDAR_ID=peter@outsome.co

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4.2 .env.example 파일
```env
# Supabase - https://supabase.com/dashboard 에서 확인
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=

# Database - Supabase Dashboard > Settings > Database 에서 확인
DATABASE_URL=
DIRECT_URL=

# Google Calendar API - Google Cloud Console 에서 생성
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=
GOOGLE_CALENDAR_ID=

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 5. Supabase 설정

### 5.1 LinkedIn OIDC Provider 설정

**중요**: Supabase는 `linkedin` 대신 `linkedin_oidc` 프로바이더를 사용해야 함.

#### 5.1.1 LinkedIn Developer Portal 설정
1. https://www.linkedin.com/developers/apps 접속
2. "Create App" 클릭
3. 앱 생성 후 "Products" 탭으로 이동
4. **"Sign In with LinkedIn using OpenID Connect"** 제품 추가 (Request Access)
5. "Auth" 탭에서 Redirect URL 추가:
   - `https://your-project.supabase.co/auth/v1/callback`
6. Client ID와 Client Secret 복사

#### 5.1.2 Supabase Dashboard 설정
1. Supabase Dashboard > Authentication > Providers
2. **LinkedIn (OIDC)** 활성화 (일반 LinkedIn이 아님!)
3. Client ID와 Client Secret 입력
4. Redirect URL 확인: `https://your-project.supabase.co/auth/v1/callback`

### 5.2 Storage Bucket 설정

#### 5.2.1 Bucket 생성
Supabase Dashboard > Storage > New Bucket:
1. `question-attachments` - 질문 첨부파일 (Public: false)
2. `post-images` - 게시글 이미지 (Public: false)
3. `profile-images` - 프로필 이미지 (Public: true)

#### 5.2.2 Storage RLS Policies

```sql
-- question-attachments bucket
-- 인증된 사용자만 업로드 가능
CREATE POLICY "Authenticated users can upload question attachments"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'question-attachments'
);

-- 같은 batch의 사용자만 다운로드 가능 (추후 RLS로 제어)
CREATE POLICY "Users can view question attachments"
ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'question-attachments'
);

-- post-images bucket
CREATE POLICY "Authenticated users can upload post images"
ON storage.objects FOR INSERT TO authenticated WITH CHECK (
  bucket_id = 'post-images'
);

CREATE POLICY "Users can view post images"
ON storage.objects FOR SELECT TO authenticated USING (
  bucket_id = 'post-images'
);
```

### 5.3 Database RLS Policies 비활성화

**MVP 단계에서는 Prisma를 통해 서버사이드에서만 DB 접근하므로 RLS는 비활성화**

Supabase Dashboard > Database > Tables 에서 각 테이블의 RLS 비활성화.

---

## 6. Prisma Schema (정확한 스키마)

### 6.1 prisma/schema.prisma
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// ============================================
// ENUMS
// ============================================

enum UserRole {
  admin
  mentor
  founder
}

enum BatchStatus {
  active
  archived
}

enum UserBatchStatus {
  invited
  active
}

enum QuestionStatus {
  open
  closed
}

enum OfficeHourSlotStatus {
  available
  requested
  confirmed
  completed
  cancelled
}

enum OfficeHourRequestStatus {
  pending
  approved
  rejected
  cancelled
}

enum LikeTargetType {
  post
  comment
}

// ============================================
// MODELS
// ============================================

model User {
  id            String   @id @default(uuid()) @db.Uuid
  email         String   @unique
  name          String
  linkedinId    String?  @unique @map("linkedin_id")
  profileImage  String?  @map("profile_image")
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relations
  userBatches         UserBatch[]
  questions           Question[]
  answers             Answer[]
  summaries           Summary[]
  officeHourSlots     OfficeHourSlot[]
  officeHourRequests  OfficeHourRequest[]
  submissions         Submission[]
  feedbacks           Feedback[]
  posts               Post[]
  comments            Comment[]
  likes               Like[]
  notifications       Notification[]

  @@map("users")
}

model Batch {
  id          String      @id @default(uuid()) @db.Uuid
  name        String      @db.VarChar(100)
  description String?     @db.Text
  startDate   DateTime    @map("start_date") @db.Date
  endDate     DateTime    @map("end_date") @db.Date
  status      BatchStatus @default(active)
  createdAt   DateTime    @default(now()) @map("created_at")
  updatedAt   DateTime    @updatedAt @map("updated_at")

  // Relations
  userBatches      UserBatch[]
  questions        Question[]
  officeHourSlots  OfficeHourSlot[]
  sessions         Session[]
  assignments      Assignment[]
  posts            Post[]

  @@map("batches")
}

model UserBatch {
  id        String          @id @default(uuid()) @db.Uuid
  userId    String          @map("user_id") @db.Uuid
  batchId   String          @map("batch_id") @db.Uuid
  role      UserRole
  invitedAt DateTime        @default(now()) @map("invited_at")
  joinedAt  DateTime?       @map("joined_at")
  status    UserBatchStatus @default(invited)

  // Relations
  user  User  @relation(fields: [userId], references: [id], onDelete: Cascade)
  batch Batch @relation(fields: [batchId], references: [id], onDelete: Cascade)

  @@unique([userId, batchId])
  @@map("user_batches")
}

model Question {
  id        String         @id @default(uuid()) @db.Uuid
  batchId   String         @map("batch_id") @db.Uuid
  authorId  String         @map("author_id") @db.Uuid
  title     String         @db.VarChar(200)
  content   String         @db.Text
  status    QuestionStatus @default(open)
  createdAt DateTime       @default(now()) @map("created_at")
  updatedAt DateTime       @updatedAt @map("updated_at")

  // Relations
  batch       Batch                  @relation(fields: [batchId], references: [id], onDelete: Cascade)
  author      User                   @relation(fields: [authorId], references: [id], onDelete: Cascade)
  attachments QuestionAttachment[]
  answers     Answer[]
  summary     Summary?

  @@map("questions")
}

model QuestionAttachment {
  id         String   @id @default(uuid()) @db.Uuid
  questionId String   @map("question_id") @db.Uuid
  fileUrl    String   @map("file_url")
  fileName   String   @map("file_name")
  fileSize   Int      @map("file_size")
  fileType   String   @map("file_type")
  createdAt  DateTime @default(now()) @map("created_at")

  // Relations
  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)

  @@map("question_attachments")
}

model Answer {
  id         String   @id @default(uuid()) @db.Uuid
  questionId String   @map("question_id") @db.Uuid
  authorId   String   @map("author_id") @db.Uuid
  content    String   @db.Text
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  // Relations
  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  author   User     @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@map("answers")
}

model Summary {
  id         String   @id @default(uuid()) @db.Uuid
  questionId String   @unique @map("question_id") @db.Uuid
  authorId   String   @map("author_id") @db.Uuid
  content    String   @db.Text
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  // Relations
  question Question @relation(fields: [questionId], references: [id], onDelete: Cascade)
  author   User     @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@map("summaries")
}

model OfficeHourSlot {
  id             String               @id @default(uuid()) @db.Uuid
  batchId        String               @map("batch_id") @db.Uuid
  hostId         String               @map("host_id") @db.Uuid
  startTime      DateTime             @map("start_time")
  endTime        DateTime             @map("end_time")
  timezone       String               @default("UTC") @db.VarChar(50)
  status         OfficeHourSlotStatus @default(available)
  googleMeetLink String?              @map("google_meet_link")
  googleEventId  String?              @map("google_event_id")
  createdAt      DateTime             @default(now()) @map("created_at")

  // Relations
  batch    Batch               @relation(fields: [batchId], references: [id], onDelete: Cascade)
  host     User                @relation(fields: [hostId], references: [id], onDelete: Cascade)
  requests OfficeHourRequest[]

  @@map("office_hour_slots")
}

model OfficeHourRequest {
  id          String                   @id @default(uuid()) @db.Uuid
  slotId      String                   @map("slot_id") @db.Uuid
  requesterId String                   @map("requester_id") @db.Uuid
  message     String?                  @db.Text
  status      OfficeHourRequestStatus  @default(pending)
  createdAt   DateTime                 @default(now()) @map("created_at")
  respondedAt DateTime?                @map("responded_at")

  // Relations
  slot      OfficeHourSlot @relation(fields: [slotId], references: [id], onDelete: Cascade)
  requester User           @relation(fields: [requesterId], references: [id], onDelete: Cascade)

  @@map("office_hour_requests")
}

model Session {
  id           String   @id @default(uuid()) @db.Uuid
  batchId      String   @map("batch_id") @db.Uuid
  title        String   @db.VarChar(200)
  description  String?  @db.Text
  sessionDate  DateTime @map("session_date") @db.Date
  slidesUrl    String?  @map("slides_url")
  recordingUrl String?  @map("recording_url")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  // Relations
  batch Batch @relation(fields: [batchId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model Assignment {
  id          String   @id @default(uuid()) @db.Uuid
  batchId     String   @map("batch_id") @db.Uuid
  title       String   @db.VarChar(200)
  description String   @db.Text
  templateUrl String?  @map("template_url")
  dueDate     DateTime @map("due_date")
  createdAt   DateTime @default(now()) @map("created_at")
  updatedAt   DateTime @updatedAt @map("updated_at")

  // Relations
  batch       Batch        @relation(fields: [batchId], references: [id], onDelete: Cascade)
  submissions Submission[]

  @@map("assignments")
}

model Submission {
  id           String   @id @default(uuid()) @db.Uuid
  assignmentId String   @map("assignment_id") @db.Uuid
  authorId     String   @map("author_id") @db.Uuid
  content      String?  @db.Text
  linkUrl      String?  @map("link_url")
  isLate       Boolean  @default(false) @map("is_late")
  submittedAt  DateTime @default(now()) @map("submitted_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  // Relations
  assignment Assignment @relation(fields: [assignmentId], references: [id], onDelete: Cascade)
  author     User       @relation(fields: [authorId], references: [id], onDelete: Cascade)
  feedbacks  Feedback[]

  @@unique([assignmentId, authorId])
  @@map("submissions")
}

model Feedback {
  id           String   @id @default(uuid()) @db.Uuid
  submissionId String   @map("submission_id") @db.Uuid
  authorId     String   @map("author_id") @db.Uuid
  content      String   @db.Text
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  // Relations
  submission Submission @relation(fields: [submissionId], references: [id], onDelete: Cascade)
  author     User       @relation(fields: [authorId], references: [id], onDelete: Cascade)

  @@map("feedbacks")
}

model Post {
  id        String   @id @default(uuid()) @db.Uuid
  batchId   String   @map("batch_id") @db.Uuid
  authorId  String   @map("author_id") @db.Uuid
  content   String   @db.Text
  isPinned  Boolean  @default(false) @map("is_pinned")
  isHidden  Boolean  @default(false) @map("is_hidden")
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  batch    Batch       @relation(fields: [batchId], references: [id], onDelete: Cascade)
  author   User        @relation(fields: [authorId], references: [id], onDelete: Cascade)
  images   PostImage[]
  comments Comment[]
  likes    Like[]

  @@map("posts")
}

model PostImage {
  id        String   @id @default(uuid()) @db.Uuid
  postId    String   @map("post_id") @db.Uuid
  imageUrl  String   @map("image_url")
  createdAt DateTime @default(now()) @map("created_at")

  // Relations
  post Post @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@map("post_images")
}

model Comment {
  id        String   @id @default(uuid()) @db.Uuid
  postId    String   @map("post_id") @db.Uuid
  parentId  String?  @map("parent_id") @db.Uuid
  authorId  String   @map("author_id") @db.Uuid
  content   String   @db.Text
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  // Relations
  post     Post      @relation(fields: [postId], references: [id], onDelete: Cascade)
  parent   Comment?  @relation("CommentReplies", fields: [parentId], references: [id], onDelete: Cascade)
  replies  Comment[] @relation("CommentReplies")
  author   User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
  likes    Like[]

  @@map("comments")
}

model Like {
  id         String         @id @default(uuid()) @db.Uuid
  userId     String         @map("user_id") @db.Uuid
  targetType LikeTargetType @map("target_type")
  postId     String?        @map("post_id") @db.Uuid
  commentId  String?        @map("comment_id") @db.Uuid
  createdAt  DateTime       @default(now()) @map("created_at")

  // Relations
  user    User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  post    Post?    @relation(fields: [postId], references: [id], onDelete: Cascade)
  comment Comment? @relation(fields: [commentId], references: [id], onDelete: Cascade)

  @@unique([userId, targetType, postId, commentId])
  @@map("likes")
}

model Notification {
  id            String   @id @default(uuid()) @db.Uuid
  userId        String   @map("user_id") @db.Uuid
  type          String   @db.VarChar(50)
  title         String   @db.VarChar(200)
  content       String   @db.Text
  referenceType String?  @map("reference_type") @db.VarChar(50)
  referenceId   String?  @map("reference_id") @db.Uuid
  sentAt        DateTime @default(now()) @map("sent_at")
  emailSent     Boolean  @default(false) @map("email_sent")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("notifications")
}
```

### 6.2 Prisma 마이그레이션 명령어
```bash
# Prisma 초기화 (이미 schema.prisma가 있으므로 생략)
# npx prisma init

# 마이그레이션 생성 및 적용
npx prisma migrate dev --name init

# Prisma Client 생성
npx prisma generate

# Prisma Studio (DB 확인용)
npx prisma studio
```

---

## 7. Tailwind CSS 4 설정

### 7.1 src/app/globals.css
```css
/* Tailwind CSS 4 - CSS-First Configuration */
@import "tailwindcss";

/* ============================================
   CUSTOM FONTS
   ============================================ */
@font-face {
  font-family: "BDO Grotesk";
  src: url("/fonts/BDOGrotesk-VF.ttf") format("truetype");
  font-weight: 300 900;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Roboto Mono";
  src: url("/fonts/RobotoMono-Medium.ttf") format("truetype");
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Libre Caslon Condensed";
  src: url("/fonts/LibreCaslonCondensed-Regular.otf") format("opentype");
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: "Libre Caslon Condensed";
  src: url("/fonts/LibreCaslonCondensed-Italic.otf") format("opentype");
  font-weight: 400;
  font-style: italic;
  font-display: swap;
}

/* ============================================
   THEME CONFIGURATION (Tailwind CSS 4)
   ============================================ */
@theme {
  /* Colors - Outsome Design System */
  --color-cream: #fefaf3;
  --color-beige: #f1eadd;
  --color-dark: #000000;
  --color-white: #ffffff;
  --color-cream-30: #fefaf34d;
  --color-cream-10: #fefaf31a;
  --color-dark-7: #2f2c250f;
  --color-dark-12: #2f2c251f;
  --color-glass-surface: #fefaf399;
  --color-glass-border: #ffffff66;
  --color-success: #a9ee81;
  --color-error: #f5aaaa;

  /* Fonts */
  --font-body: "BDO Grotesk", Arial, sans-serif;
  --font-heading: "Libre Caslon Condensed", "Times New Roman", serif;
  --font-mono: "Roboto Mono", "Trebuchet MS", monospace;

  /* Typography Scale */
  --font-size-xs: 11px;
  --font-size-sm: 12px;
  --font-size-base: 14px;
  --font-size-lg: 18px;
  --font-size-xl: 22px;
  --font-size-2xl: 28px;
  --font-size-3xl: 35px;
  --font-size-4xl: 44px;
  --font-size-5xl: 56px;

  /* Spacing */
  --spacing-base: 24px;

  /* Border Radius */
  --radius-sm: 6px;
  --radius-md: 9px;
  --radius-lg: 12px;
  --radius-xl: 18px;

  /* Shadows */
  --shadow-glass: 0 4px 18px rgba(0, 0, 0, 0.12);

  /* Component Sizes */
  --navbar-height: 72px;
  --button-height: 48px;
  --button-height-sm: 42px;
  --input-height: 48px;
}

/* ============================================
   BASE STYLES
   ============================================ */
body {
  background-color: var(--color-cream);
  font-family: var(--font-body);
  color: var(--color-dark);
  font-size: var(--font-size-base);
  line-height: 1.4;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
  font-weight: 400;
  letter-spacing: -0.02em;
}

/* ============================================
   COMPONENT CLASSES
   ============================================ */

/* Main Container */
.main-container {
  max-width: 1440px;
  margin-left: auto;
  margin-right: auto;
  padding-left: var(--spacing-base);
  padding-right: var(--spacing-base);
}

/* Button Base */
.btn {
  height: var(--button-height);
  padding-left: var(--spacing-base);
  padding-right: var(--spacing-base);
  border-radius: var(--radius-md);
  font-weight: 500;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background-color: var(--color-dark);
  color: var(--color-cream);
}

.btn-primary:hover {
  opacity: 0.9;
}

.btn-secondary {
  background-color: var(--color-beige);
  color: var(--color-dark);
}

.btn-secondary:hover {
  background-color: var(--color-cream);
}

.btn-sm {
  height: var(--button-height-sm);
  padding-left: 18px;
  padding-right: 18px;
  font-size: var(--font-size-sm);
}

/* Form Input */
.form-input {
  height: var(--input-height);
  padding-left: 18px;
  padding-right: 18px;
  background-color: var(--color-dark-7);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  width: 100%;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-dark);
}

.form-input::placeholder {
  color: rgba(0, 0, 0, 0.4);
}

/* Textarea */
.form-textarea {
  min-height: 200px;
  padding: 18px;
  background-color: var(--color-dark-7);
  border: 1px solid transparent;
  border-radius: var(--radius-md);
  font-size: var(--font-size-base);
  width: 100%;
  resize: vertical;
}

.form-textarea:focus {
  outline: none;
  border-color: var(--color-dark);
}

/* Badge */
.badge {
  font-family: var(--font-mono);
  font-size: var(--font-size-xs);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 4px 8px;
  border-radius: 4px;
  background-color: var(--color-beige);
}

.badge-success {
  background-color: var(--color-success);
}

.badge-error {
  background-color: var(--color-error);
}

/* Card */
.card {
  background-color: var(--color-white);
  border: 1px solid var(--color-dark-12);
  border-radius: var(--radius-lg);
  padding: var(--spacing-base);
}

/* Glass Surface */
.glass {
  background-color: var(--color-glass-surface);
  backdrop-filter: blur(12px);
  border: 1px solid var(--color-glass-border);
  border-radius: var(--radius-lg);
}

/* Section Padding */
.section {
  padding-top: 96px;
  padding-bottom: 96px;
}

.section-sm {
  padding-top: 48px;
  padding-bottom: 48px;
}

/* Navbar */
.navbar {
  height: var(--navbar-height);
  background-color: var(--color-cream);
  position: sticky;
  top: 0;
  z-index: 100;
  border-bottom: 1px solid var(--color-dark-12);
}

/* Text Utilities */
.text-lead {
  font-size: var(--font-size-lg);
  line-height: 1.4;
}

.text-small {
  font-size: var(--font-size-sm);
  line-height: 1.4;
}

.text-muted {
  opacity: 0.5;
}

/* Heading Styles */
.heading-h1 {
  font-size: var(--font-size-5xl);
  line-height: 1;
}

.heading-h2 {
  font-size: var(--font-size-4xl);
  line-height: 1.1;
}

.heading-h3 {
  font-size: var(--font-size-3xl);
  line-height: 1.2;
}

.heading-h4 {
  font-size: var(--font-size-2xl);
  line-height: 1.25;
}

.heading-h5 {
  font-size: var(--font-size-xl);
  line-height: 1.3;
}
```

### 7.2 tailwind.config.ts (최소 설정)
```typescript
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
};

export default config;
```

---

## 8. Supabase Client 설정

### 8.1 src/lib/supabase/client.ts (Browser Client)
```typescript
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
```

### 8.2 src/lib/supabase/server.ts (Server Client)
```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서 호출된 경우 무시
          }
        },
      },
    }
  );
}
```

### 8.3 src/lib/supabase/middleware.ts (Session Refresh)
```typescript
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // 세션 갱신 - 중요: createServerClient와 getUser 사이에 다른 로직 넣지 말 것
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 로그인 페이지와 콜백 경로는 제외
  const publicPaths = ["/login", "/auth/callback"];
  const isPublicPath = publicPaths.some((path) =>
    request.nextUrl.pathname.startsWith(path)
  );

  if (!user && !isPublicPath) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
```

### 8.4 middleware.ts (Root)
```typescript
import { type NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  matcher: [
    /*
     * 다음 경로를 제외한 모든 요청에 매칭:
     * - _next/static (정적 파일)
     * - _next/image (이미지 최적화)
     * - favicon.ico (파비콘)
     * - public 폴더의 이미지
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

---

## 9. Prisma Client 설정

### 9.1 src/lib/prisma.ts
```typescript
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
```

---

## 10. Google Calendar API 설정

### 10.1 Google Cloud Console 설정 (Service Account)

1. https://console.cloud.google.com 접속
2. 프로젝트 생성 또는 선택
3. APIs & Services > Library > Google Calendar API 활성화
4. APIs & Services > Credentials > Create Credentials > Service Account
5. Service Account 생성 후 Keys > Add Key > Create new key > JSON
6. JSON 파일의 `client_email`과 `private_key`를 환경변수로 설정
7. Google Calendar에서 Service Account 이메일에 캘린더 공유 (Editor 권한)

### 10.2 src/lib/google-calendar.ts
```typescript
import { google, calendar_v3 } from "googleapis";

const SCOPES = ["https://www.googleapis.com/auth/calendar"];

function getAuth() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  
  if (!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || !privateKey) {
    throw new Error("Google Calendar credentials not configured");
  }

  return new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: SCOPES,
  });
}

export async function getCalendarClient(): Promise<calendar_v3.Calendar> {
  const auth = getAuth();
  return google.calendar({ version: "v3", auth });
}

interface CreateEventParams {
  summary: string;
  description: string;
  startTime: Date;
  endTime: Date;
  attendeeEmails: string[];
  timezone?: string;
}

export async function createCalendarEventWithMeet({
  summary,
  description,
  startTime,
  endTime,
  attendeeEmails,
  timezone = "UTC",
}: CreateEventParams): Promise<{
  eventId: string;
  meetLink: string;
  htmlLink: string;
}> {
  const calendar = await getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!calendarId) {
    throw new Error("GOOGLE_CALENDAR_ID not configured");
  }

  const event: calendar_v3.Schema$Event = {
    summary,
    description,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: timezone,
    },
    end: {
      dateTime: endTime.toISOString(),
      timeZone: timezone,
    },
    attendees: attendeeEmails.map((email) => ({ email })),
    conferenceData: {
      createRequest: {
        requestId: `meet-${Date.now()}-${Math.random().toString(36).substring(7)}`,
        conferenceSolutionKey: {
          type: "hangoutsMeet",
        },
      },
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: "email", minutes: 24 * 60 },
        { method: "popup", minutes: 30 },
      ],
    },
  };

  const response = await calendar.events.insert({
    calendarId,
    requestBody: event,
    conferenceDataVersion: 1,
    sendUpdates: "all", // 참석자에게 초대 이메일 발송
  });

  const createdEvent = response.data;

  if (!createdEvent.id || !createdEvent.conferenceData?.entryPoints) {
    throw new Error("Failed to create event with Google Meet");
  }

  const meetLink =
    createdEvent.conferenceData.entryPoints.find(
      (ep) => ep.entryPointType === "video"
    )?.uri || "";

  return {
    eventId: createdEvent.id,
    meetLink,
    htmlLink: createdEvent.htmlLink || "",
  };
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  const calendar = await getCalendarClient();
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!calendarId) {
    throw new Error("GOOGLE_CALENDAR_ID not configured");
  }

  await calendar.events.delete({
    calendarId,
    eventId,
    sendUpdates: "all",
  });
}
```

---

## 11. Server Actions 구현

### 11.1 src/actions/auth.ts
```typescript
"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signInWithLinkedIn() {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "linkedin_oidc",
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (data.url) {
    redirect(data.url);
  }
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}
```

### 11.2 src/actions/batches.ts
```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateBatchSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  startDate: z.string().transform((s) => new Date(s)),
  endDate: z.string().transform((s) => new Date(s)),
});

export async function createBatch(formData: FormData) {
  const rawData = {
    name: formData.get("name") as string,
    description: formData.get("description") as string,
    startDate: formData.get("startDate") as string,
    endDate: formData.get("endDate") as string,
  };

  const validatedData = CreateBatchSchema.parse(rawData);

  // Active Batch가 있는지 확인
  const activeBatch = await prisma.batch.findFirst({
    where: { status: "active" },
  });

  if (activeBatch) {
    return { error: "Active batch already exists. Archive it first." };
  }

  const batch = await prisma.batch.create({
    data: validatedData,
  });

  revalidatePath("/admin/batches");
  return { success: true, batch };
}

export async function archiveBatch(batchId: string) {
  await prisma.batch.update({
    where: { id: batchId },
    data: { status: "archived" },
  });

  revalidatePath("/admin/batches");
  return { success: true };
}

export async function getActiveBatch() {
  return prisma.batch.findFirst({
    where: { status: "active" },
    include: {
      userBatches: {
        include: { user: true },
      },
    },
  });
}

export async function getAllBatches() {
  return prisma.batch.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: { userBatches: true },
      },
    },
  });
}
```

### 11.3 src/actions/questions.ts
```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateQuestionSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
});

export async function createQuestion(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  // DB에서 사용자 정보 가져오기
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    include: {
      userBatches: {
        where: { status: "active" },
        include: { batch: true },
      },
    },
  });

  if (!dbUser) {
    return { error: "User not found" };
  }

  const activeBatch = dbUser.userBatches.find(
    (ub) => ub.batch.status === "active"
  );

  if (!activeBatch) {
    return { error: "No active batch membership" };
  }

  // Founder만 질문 작성 가능
  if (activeBatch.role !== "founder") {
    return { error: "Only founders can create questions" };
  }

  const rawData = {
    title: formData.get("title") as string,
    content: formData.get("content") as string,
  };

  const validatedData = CreateQuestionSchema.parse(rawData);

  const question = await prisma.question.create({
    data: {
      ...validatedData,
      batchId: activeBatch.batchId,
      authorId: dbUser.id,
    },
  });

  revalidatePath("/questions");
  return { success: true, questionId: question.id };
}

export async function getQuestions(status?: "open" | "closed") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    include: {
      userBatches: {
        where: { status: "active" },
        include: { batch: true },
      },
    },
  });

  if (!dbUser) return [];

  const activeBatch = dbUser.userBatches.find(
    (ub) => ub.batch.status === "active"
  );

  if (!activeBatch) return [];

  return prisma.question.findMany({
    where: {
      batchId: activeBatch.batchId,
      ...(status ? { status } : {}),
    },
    include: {
      author: {
        select: { id: true, name: true, profileImage: true },
      },
      _count: {
        select: { answers: true },
      },
      summary: {
        select: { id: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getQuestionById(id: string) {
  return prisma.question.findUnique({
    where: { id },
    include: {
      author: {
        select: { id: true, name: true, profileImage: true },
      },
      attachments: true,
      answers: {
        include: {
          author: {
            select: { id: true, name: true, profileImage: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      summary: {
        include: {
          author: {
            select: { id: true, name: true, profileImage: true },
          },
        },
      },
    },
  });
}
```

### 11.4 src/actions/answers.ts
```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateAnswerSchema = z.object({
  questionId: z.string().uuid(),
  content: z.string().min(1).max(10000),
});

export async function createAnswer(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    include: {
      userBatches: {
        where: { status: "active" },
        include: { batch: true },
      },
    },
  });

  if (!dbUser) {
    return { error: "User not found" };
  }

  const activeBatch = dbUser.userBatches.find(
    (ub) => ub.batch.status === "active"
  );

  if (!activeBatch) {
    return { error: "No active batch membership" };
  }

  // Admin 또는 Mentor만 답변 작성 가능
  if (activeBatch.role === "founder") {
    return { error: "Founders cannot create answers" };
  }

  const rawData = {
    questionId: formData.get("questionId") as string,
    content: formData.get("content") as string,
  };

  const validatedData = CreateAnswerSchema.parse(rawData);

  // 질문이 같은 batch에 속하는지 확인
  const question = await prisma.question.findUnique({
    where: { id: validatedData.questionId },
  });

  if (!question || question.batchId !== activeBatch.batchId) {
    return { error: "Question not found" };
  }

  if (question.status === "closed") {
    return { error: "Cannot answer closed questions" };
  }

  const answer = await prisma.answer.create({
    data: {
      ...validatedData,
      authorId: dbUser.id,
    },
  });

  revalidatePath(`/questions/${validatedData.questionId}`);
  return { success: true, answerId: answer.id };
}
```

### 11.5 src/actions/office-hours.ts
```typescript
"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { createCalendarEventWithMeet, deleteCalendarEvent } from "@/lib/google-calendar";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { addMinutes } from "date-fns";

const CreateSlotSchema = z.object({
  startTime: z.string().transform((s) => new Date(s)),
  timezone: z.enum(["PST", "KST", "UTC"]),
});

export async function createOfficeHourSlot(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    include: {
      userBatches: {
        where: { status: "active" },
        include: { batch: true },
      },
    },
  });

  if (!dbUser) {
    return { error: "User not found" };
  }

  const activeBatch = dbUser.userBatches.find(
    (ub) => ub.batch.status === "active"
  );

  if (!activeBatch) {
    return { error: "No active batch membership" };
  }

  // Admin 또는 Mentor만 슬롯 생성 가능
  if (activeBatch.role === "founder") {
    return { error: "Founders cannot create office hour slots" };
  }

  const rawData = {
    startTime: formData.get("startTime") as string,
    timezone: formData.get("timezone") as string,
  };

  const validatedData = CreateSlotSchema.parse(rawData);

  // 30분 슬롯
  const endTime = addMinutes(validatedData.startTime, 30);

  const slot = await prisma.officeHourSlot.create({
    data: {
      batchId: activeBatch.batchId,
      hostId: dbUser.id,
      startTime: validatedData.startTime,
      endTime,
      timezone: validatedData.timezone,
    },
  });

  revalidatePath("/office-hours");
  return { success: true, slotId: slot.id };
}

export async function requestOfficeHour(slotId: string, message?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    include: {
      userBatches: {
        where: { status: "active" },
      },
    },
  });

  if (!dbUser) {
    return { error: "User not found" };
  }

  const activeBatch = dbUser.userBatches.find((ub) => ub.status === "active");

  if (!activeBatch || activeBatch.role !== "founder") {
    return { error: "Only founders can request office hours" };
  }

  const slot = await prisma.officeHourSlot.findUnique({
    where: { id: slotId },
  });

  if (!slot || slot.status !== "available") {
    return { error: "Slot not available" };
  }

  await prisma.$transaction([
    prisma.officeHourRequest.create({
      data: {
        slotId,
        requesterId: dbUser.id,
        message,
      },
    }),
    prisma.officeHourSlot.update({
      where: { id: slotId },
      data: { status: "requested" },
    }),
  ]);

  revalidatePath("/office-hours");
  return { success: true };
}

export async function approveOfficeHourRequest(requestId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Unauthorized" };
  }

  const request = await prisma.officeHourRequest.findUnique({
    where: { id: requestId },
    include: {
      slot: {
        include: { host: true },
      },
      requester: true,
    },
  });

  if (!request) {
    return { error: "Request not found" };
  }

  // Host 또는 Admin만 승인 가능
  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    include: {
      userBatches: {
        where: { status: "active" },
      },
    },
  });

  if (!dbUser) {
    return { error: "User not found" };
  }

  const isHost = request.slot.hostId === dbUser.id;
  const isAdmin = dbUser.userBatches.some((ub) => ub.role === "admin");

  if (!isHost && !isAdmin) {
    return { error: "Not authorized to approve this request" };
  }

  // Google Calendar 이벤트 생성
  try {
    const { eventId, meetLink } = await createCalendarEventWithMeet({
      summary: `Office Hour: ${request.slot.host.name} & ${request.requester.name}`,
      description: request.message || "Office Hour Session",
      startTime: request.slot.startTime,
      endTime: request.slot.endTime,
      attendeeEmails: [request.slot.host.email, request.requester.email],
      timezone: request.slot.timezone,
    });

    await prisma.$transaction([
      prisma.officeHourRequest.update({
        where: { id: requestId },
        data: {
          status: "approved",
          respondedAt: new Date(),
        },
      }),
      prisma.officeHourSlot.update({
        where: { id: request.slotId },
        data: {
          status: "confirmed",
          googleMeetLink: meetLink,
          googleEventId: eventId,
        },
      }),
      // 다른 pending requests 거절
      prisma.officeHourRequest.updateMany({
        where: {
          slotId: request.slotId,
          id: { not: requestId },
          status: "pending",
        },
        data: {
          status: "rejected",
          respondedAt: new Date(),
        },
      }),
    ]);

    revalidatePath("/office-hours");
    return { success: true, meetLink };
  } catch (error) {
    console.error("Failed to create calendar event:", error);
    return { error: "Failed to create calendar event. Please try again." };
  }
}

export async function getOfficeHourSlots() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return [];

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    include: {
      userBatches: {
        where: { status: "active" },
        include: { batch: true },
      },
    },
  });

  if (!dbUser) return [];

  const activeBatch = dbUser.userBatches.find(
    (ub) => ub.batch.status === "active"
  );

  if (!activeBatch) return [];

  return prisma.officeHourSlot.findMany({
    where: {
      batchId: activeBatch.batchId,
      startTime: { gte: new Date() },
    },
    include: {
      host: {
        select: { id: true, name: true, profileImage: true },
      },
      requests: {
        include: {
          requester: {
            select: { id: true, name: true, profileImage: true },
          },
        },
      },
    },
    orderBy: { startTime: "asc" },
  });
}
```

---

## 12. 페이지 구현

### 12.1 src/app/layout.tsx (Root Layout)
```typescript
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Founder Sprint Workspace",
  description: "Batch-based execution workspace for Founder Sprint program",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### 12.2 src/app/(auth)/login/page.tsx
```typescript
import { signInWithLinkedIn } from "@/actions/auth";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-cream">
      <div className="card max-w-md w-full mx-4">
        <div className="text-center mb-8">
          <img
            src="/images/Outsome-Full_Black.svg"
            alt="Outsome"
            className="h-8 mx-auto mb-6"
          />
          <h1 className="heading-h4 mb-2">Welcome to Founder Sprint</h1>
          <p className="text-lead text-muted">
            Sign in with your LinkedIn account to continue
          </p>
        </div>

        <form action={signInWithLinkedIn}>
          <button type="submit" className="btn btn-primary w-full">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
            </svg>
            Sign in with LinkedIn
          </button>
        </form>

        <p className="text-small text-muted text-center mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
```

### 12.3 src/app/(auth)/auth/callback/route.ts
```typescript
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data.user) {
      // DB에 사용자 생성 또는 업데이트
      await prisma.user.upsert({
        where: { email: data.user.email! },
        update: {
          name: data.user.user_metadata.full_name || data.user.email!.split("@")[0],
          linkedinId: data.user.user_metadata.sub,
          profileImage: data.user.user_metadata.picture,
        },
        create: {
          email: data.user.email!,
          name: data.user.user_metadata.full_name || data.user.email!.split("@")[0],
          linkedinId: data.user.user_metadata.sub,
          profileImage: data.user.user_metadata.picture,
        },
      });

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // 에러 발생 시 로그인 페이지로 리다이렉트
  return NextResponse.redirect(`${origin}/login?error=auth_callback_error`);
}
```

### 12.4 src/app/(dashboard)/layout.tsx
```typescript
import Navbar from "@/components/layout/navbar";
import { getUser } from "@/actions/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen">
      <Navbar user={user} />
      <main className="main-container py-8">{children}</main>
    </div>
  );
}
```

### 12.5 src/components/layout/navbar.tsx
```typescript
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "@/actions/auth";
import type { User } from "@supabase/supabase-js";

interface NavbarProps {
  user: User;
}

const navLinks = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/questions", label: "Questions" },
  { href: "/office-hours", label: "Office Hours" },
  { href: "/sessions", label: "Sessions" },
  { href: "/assignments", label: "Assignments" },
  { href: "/community", label: "Community" },
];

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();

  return (
    <nav className="navbar">
      <div className="main-container h-full">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center gap-8">
            <Link href="/dashboard">
              <img
                src="/images/Outsome-Full_Black.svg"
                alt="Outsome"
                className="h-6"
              />
            </Link>

            <div className="flex items-center gap-6">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium transition-opacity ${
                    pathname.startsWith(link.href)
                      ? "opacity-100"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm">{user.email}</span>
            <form action={signOut}>
              <button type="submit" className="btn btn-secondary btn-sm">
                Sign Out
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  );
}
```

---

## 13. 개발 순서 (단계별 실행)

### Phase 1: 프로젝트 초기화 (Day 1)
```bash
# 1. 프로젝트 생성
npx create-next-app@15.1.6 founder-sprint-workspace --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd founder-sprint-workspace

# 2. 패키지 설치
npm install @supabase/supabase-js@2.49.1 @supabase/ssr@0.5.2
npm install @prisma/client@6.3.0
npm install -D prisma@6.3.0
npm install googleapis@146.0.0
npm install zod@3.24.1 date-fns@4.1.0 date-fns-tz@3.2.0

# 3. Prisma 초기화
npx prisma init

# 4. 폰트 파일 복사
# /Users/cosmos/fs/outsome-react/public/fonts/* → ./public/fonts/

# 5. 로고 파일 복사
# /Users/cosmos/fs/outsome-react/public/images/Outsome-Full_Black.svg → ./public/images/

# 6. 환경변수 설정 (.env.local 생성)

# 7. Prisma 스키마 작성 후 마이그레이션
npx prisma migrate dev --name init
npx prisma generate
```

### Phase 2: 인증 시스템 (Day 1-2)
1. Supabase 프로젝트 생성 및 LinkedIn OIDC 설정
2. `src/lib/supabase/` 클라이언트 파일들 생성
3. `middleware.ts` 생성
4. `src/actions/auth.ts` 생성
5. 로그인 페이지 및 콜백 라우트 생성
6. 테스트: LinkedIn 로그인 → 콜백 → 대시보드

### Phase 3: 레이아웃 & 기본 UI (Day 2)
1. `globals.css` Tailwind CSS 4 설정
2. Navbar 컴포넌트 생성
3. 대시보드 레이아웃 생성
4. 기본 UI 컴포넌트 (Button, Input, Card, Badge)

### Phase 4: Batch & User 관리 (Day 3)
1. Admin 페이지 생성 (/admin/batches, /admin/users)
2. Batch CRUD Server Actions
3. User 초대 기능 (이메일 기반)
4. 권한 체크 미들웨어/유틸리티

### Phase 5: Q&A 기능 (Day 4-5)
1. 질문 목록 페이지
2. 질문 작성 폼 (파일 업로드 포함)
3. 질문 상세 페이지
4. 답변 작성 폼
5. 요약 작성 (Admin only, 질문 Close)

### Phase 6: 오피스아워 (Day 6-7)
1. Google Calendar API 설정 및 테스트
2. 슬롯 등록 폼
3. 캘린더 뷰
4. 요청/승인 플로우
5. Google Meet 링크 자동 생성

### Phase 7: 세션 & 과제 (Day 8-9)
1. 세션 목록/등록/수정
2. 과제 목록/등록
3. 과제 제출 폼
4. 제출 현황 대시보드
5. 피드백 작성

### Phase 8: 커뮤니티 (Day 10)
1. 게시글 피드
2. 게시글 작성 (이미지 업로드)
3. 댓글/대댓글
4. 좋아요 토글
5. 공지 고정 (Admin)

### Phase 9: 마무리 (Day 11-14)
1. UI/UX 폴리싱
2. 에러 핸들링
3. 로딩 상태
4. 반응형 조정
5. Vercel 배포
6. 테스트

---

## 14. 검증 체크리스트

### 14.1 기능 검증
- [ ] LinkedIn OAuth 로그인 동작
- [ ] Batch 생성/종료 동작
- [ ] 사용자 초대 동작
- [ ] 질문 CRUD 동작
- [ ] 답변/요약 동작
- [ ] 오피스아워 슬롯 등록 동작
- [ ] 오피스아워 요청/승인 동작
- [ ] Google Calendar 연동 동작
- [ ] 세션 CRUD 동작
- [ ] 과제 CRUD 동작
- [ ] 제출/피드백 동작
- [ ] 게시글 CRUD 동작
- [ ] 댓글/좋아요 동작

### 14.2 권한 검증
- [ ] Founder만 질문 작성 가능
- [ ] Admin/Mentor만 답변 작성 가능
- [ ] Admin만 요약 작성 가능
- [ ] Admin/Mentor만 슬롯 등록 가능
- [ ] Founder만 오피스아워 요청 가능
- [ ] Admin만 세션/과제 관리 가능
- [ ] Founder만 과제 제출 가능
- [ ] Admin/Mentor만 피드백 작성 가능

### 14.3 데이터 격리 검증
- [ ] Batch 간 데이터 완전 분리
- [ ] Archived Batch는 Read-only

---

## 15. 에러 방지 가이드

### 15.1 흔한 실수 방지

1. **Supabase Auth**
   - `linkedin` 대신 `linkedin_oidc` 사용
   - `@supabase/auth-helpers-nextjs` 대신 `@supabase/ssr` 사용
   - Server Component에서 `cookies()` 호출 시 `await` 사용 (Next.js 15)

2. **Prisma**
   - `directUrl` 설정 필수 (Supabase pooler 사용 시)
   - UUID 타입은 `@db.Uuid` 데코레이터 필수
   - DateTime 기본값은 `@default(now())` 사용

3. **Tailwind CSS 4**
   - `tailwind.config.js` 대신 `globals.css`의 `@theme` 블록 사용
   - `@import "tailwindcss"` 한 줄로 import

4. **Server Actions**
   - 파일 상단에 `"use server"` 필수
   - `revalidatePath()` 호출로 캐시 갱신
   - FormData 사용 시 타입 변환 주의

5. **Google Calendar API**
   - Service Account 사용 시 캘린더 공유 필수
   - `conferenceDataVersion: 1` 설정으로 Meet 링크 생성

### 15.2 디버깅 팁

```bash
# Prisma 쿼리 로그 확인
# prisma.ts에서 log: ["query"] 설정

# Supabase Auth 디버깅
# Browser DevTools > Application > Cookies 확인

# Server Action 디버깅
# console.log로 서버 터미널에서 확인
```

---

## 16. 배포 (Vercel)

### 16.1 환경변수 설정
Vercel Dashboard > Settings > Environment Variables에 모든 환경변수 추가

### 16.2 빌드 설정
```json
{
  "buildCommand": "prisma generate && next build",
  "outputDirectory": ".next"
}
```

### 16.3 배포 후 체크리스트
- [ ] 환경변수 모두 설정됨
- [ ] Supabase Redirect URL 업데이트 (production URL)
- [ ] Google Calendar Service Account 권한 확인
- [ ] LinkedIn OAuth Redirect URL 업데이트

---

**문서 끝**

이 계획서를 따라 순서대로 실행하면 Founder Sprint Workspace MVP가 완성됩니다.
