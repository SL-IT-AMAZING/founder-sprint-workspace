# Routes - 전체 라우트 구조

> Founder Sprint Workspace MVP의 모든 URL 경로 명세

## 라우트 맵 개요

```
/                          → 로그인 페이지 (미인증 시) 또는 대시보드 리다이렉트
├── /login                 → LinkedIn OAuth 로그인
├── /auth/callback         → OAuth 콜백 처리
│
├── /dashboard             → 메인 대시보드 (Founder/Mentor/Admin 공통)
│
├── /questions             → 질문 목록
│   ├── /questions/new     → 질문 작성 (Founder만)
│   └── /questions/[id]    → 질문 상세 + 답변 + 요약
│
├── /office-hours          → 오피스아워 캘린더/목록
│   ├── /office-hours/new  → 슬롯 등록 (Mentor/Admin만)
│   └── /office-hours/[id] → 슬롯 상세 + 요청/승인
│
├── /sessions              → 세션 목록 (슬라이드/녹화)
│   ├── /sessions/new      → 세션 등록 (Admin만)
│   └── /sessions/[id]     → 세션 상세/수정
│
├── /assignments           → 과제 목록
│   └── /assignments/[id]  → 과제 상세 + 제출
│
├── /submissions           → 제출 현황 대시보드 (Mentor/Admin만)
│   └── /submissions/[id]  → 제출물 상세 + 피드백 작성
│
├── /community             → 커뮤니티 게시판
│   ├── /community/new     → 게시글 작성
│   └── /community/[id]    → 게시글 상세 + 댓글
│
├── /settings              → 개인 설정 (프로필)
│
└── /admin                 → 관리자 대시보드 (Admin만)
    ├── /admin/batches     → Batch(기수) 관리
    ├── /admin/users       → 사용자 초대/관리
    ├── /admin/assignments → 과제 관리
    └── /admin/sessions    → 세션 관리
```

---

## 상세 라우트 명세

### 1. 인증 (Auth)

| 경로 | 메서드 | 설명 | 접근 권한 |
|------|--------|------|-----------|
| `/` | GET | 랜딩 → 로그인 또는 대시보드 리다이렉트 | 모두 |
| `/login` | GET | LinkedIn OAuth 로그인 페이지 | 미인증 |
| `/auth/callback` | GET | OAuth 콜백 처리 (Supabase) | 시스템 |
| `/logout` | POST | 로그아웃 (Server Action) | 인증됨 |

### 2. 대시보드 (Dashboard)

| 경로 | 메서드 | 설명 | 접근 권한 |
|------|--------|------|-----------|
| `/dashboard` | GET | 메인 대시보드 | Founder, Mentor, Admin |

**대시보드 표시 내용 (역할별):**

| 역할 | 표시 내용 |
|------|----------|
| Founder | 내 질문 현황, 다가오는 오피스아워, 과제 마감, 최근 게시글 |
| Mentor | 답변 대기 질문, 내 오피스아워 요청, 피드백 대기 제출물 |
| Admin | 전체 현황 요약, Batch 상태, 빠른 관리 링크 |

### 3. 질문 (Questions)

| 경로 | 메서드 | 설명 | 접근 권한 |
|------|--------|------|-----------|
| `/questions` | GET | 질문 목록 (필터: Open/Closed) | 모두 |
| `/questions/new` | GET | 질문 작성 폼 | **Founder만** |
| `/questions/new` | POST | 질문 생성 (Server Action) | **Founder만** |
| `/questions/[id]` | GET | 질문 상세 + 답변 + 요약 | 모두 |

**질문 상세 페이지 액션:**

| 액션 | Server Action | 접근 권한 |
|------|--------------|-----------|
| 질문 수정 | `updateQuestion` | 작성자 (답변 전까지만) |
| 답변 작성 | `createAnswer` | Mentor, Admin |
| 답변 수정 | `updateAnswer` | 답변 작성자 |
| 요약 작성 | `createSummary` | **Admin만** |
| 요약 수정 | `updateSummary` | **Admin만** |

### 4. 오피스아워 (Office Hours)

| 경로 | 메서드 | 설명 | 접근 권한 |
|------|--------|------|-----------|
| `/office-hours` | GET | 오피스아워 캘린더/목록 | 모두 |
| `/office-hours/new` | GET | 슬롯 등록 폼 | Mentor, Admin |
| `/office-hours/new` | POST | 슬롯 생성 (Server Action) | Mentor, Admin |
| `/office-hours/[id]` | GET | 슬롯 상세 | 모두 |

**오피스아워 액션:**

| 액션 | Server Action | 접근 권한 |
|------|--------------|-----------|
| 슬롯 등록 | `createSlot` | Mentor, Admin |
| 슬롯 수정 | `updateSlot` | 슬롯 소유자 (요청 없을 때만) |
| 슬롯 삭제 | `deleteSlot` | 슬롯 소유자 (요청 없을 때만) |
| 요청 | `requestSlot` | **Founder만** |
| 요청 취소 | `cancelRequest` | 요청자 (확정 전까지) |
| 승인 | `approveRequest` | 슬롯 소유자, Admin |
| 거절 | `rejectRequest` | 슬롯 소유자, Admin |

### 5. 세션 (Sessions)

| 경로 | 메서드 | 설명 | 접근 권한 |
|------|--------|------|-----------|
| `/sessions` | GET | 세션 목록 | 모두 |
| `/sessions/new` | GET | 세션 등록 폼 | **Admin만** |
| `/sessions/new` | POST | 세션 생성 (Server Action) | **Admin만** |
| `/sessions/[id]` | GET | 세션 상세 | 모두 |
| `/sessions/[id]/edit` | GET | 세션 수정 폼 | **Admin만** |

### 6. 과제 (Assignments)

| 경로 | 메서드 | 설명 | 접근 권한 |
|------|--------|------|-----------|
| `/assignments` | GET | 과제 목록 | 모두 |
| `/assignments/[id]` | GET | 과제 상세 + 제출 폼 | 모두 |

**과제 상세 페이지 액션:**

| 액션 | Server Action | 접근 권한 |
|------|--------------|-----------|
| 제출 | `submitAssignment` | **Founder만** |
| 재제출 | `submitAssignment` | **Founder만** (덮어쓰기) |

### 7. 제출 현황 (Submissions)

| 경로 | 메서드 | 설명 | 접근 권한 |
|------|--------|------|-----------|
| `/submissions` | GET | 전체 제출 현황 대시보드 | Mentor, Admin |
| `/submissions/[id]` | GET | 제출물 상세 + 피드백 | Mentor, Admin, 제출자 |

**제출물 상세 페이지 액션:**

| 액션 | Server Action | 접근 권한 |
|------|--------------|-----------|
| 피드백 작성 | `createFeedback` | Mentor, Admin |
| 피드백 수정 | `updateFeedback` | 피드백 작성자 |

### 8. 커뮤니티 (Community)

| 경로 | 메서드 | 설명 | 접근 권한 |
|------|--------|------|-----------|
| `/community` | GET | 게시글 목록 (공지 상단 고정) | 모두 |
| `/community/new` | GET | 게시글 작성 폼 | 모두 |
| `/community/new` | POST | 게시글 생성 (Server Action) | 모두 |
| `/community/[id]` | GET | 게시글 상세 + 댓글 | 모두 |
| `/community/[id]/edit` | GET | 게시글 수정 폼 | 작성자 |

**커뮤니티 액션:**

| 액션 | Server Action | 접근 권한 |
|------|--------------|-----------|
| 게시글 수정 | `updatePost` | 작성자 |
| 게시글 삭제 | `deletePost` | 작성자, Admin |
| 댓글 작성 | `createComment` | 모두 |
| 댓글 수정 | `updateComment` | 작성자 |
| 댓글 삭제 | `deleteComment` | 작성자, Admin |
| 좋아요 | `toggleLike` | 모두 |
| 공지 고정 | `pinPost` | **Admin만** |
| 비공개 처리 | `hidePost` | **Admin만** |

### 9. 설정 (Settings)

| 경로 | 메서드 | 설명 | 접근 권한 |
|------|--------|------|-----------|
| `/settings` | GET | 프로필 설정 | 인증됨 |
| `/settings` | POST | 프로필 업데이트 (Server Action) | 인증됨 |

### 10. 관리자 (Admin)

| 경로 | 메서드 | 설명 | 접근 권한 |
|------|--------|------|-----------|
| `/admin` | GET | 관리자 대시보드 | **Admin만** |
| `/admin/batches` | GET | Batch 목록 | **Admin만** |
| `/admin/batches/new` | GET | Batch 생성 폼 | **Admin만** |
| `/admin/batches/[id]` | GET | Batch 상세/종료 | **Admin만** |
| `/admin/users` | GET | 사용자 목록 | **Admin만** |
| `/admin/users/invite` | GET | 사용자 초대 폼 | **Admin만** |
| `/admin/assignments` | GET | 과제 관리 목록 | **Admin만** |
| `/admin/assignments/new` | GET | 과제 생성 폼 | **Admin만** |
| `/admin/assignments/[id]/edit` | GET | 과제 수정 폼 | **Admin만** |
| `/admin/sessions` | GET | 세션 관리 목록 | **Admin만** |

---

## API Routes (Route Handlers)

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/auth/callback` | GET | Supabase OAuth 콜백 |
| `/api/upload` | POST | 파일 업로드 (Supabase Storage) |

---

## Middleware 보호 규칙

```typescript
// src/middleware.ts

const publicRoutes = [
  '/',
  '/login',
  '/auth/callback',
];

const adminRoutes = [
  '/admin',
  '/admin/*',
];

const mentorRoutes = [
  '/submissions',
  '/submissions/*',
];

const founderOnlyRoutes = [
  '/questions/new',
];

// 미인증 사용자 → /login 리다이렉트
// Admin 아닌 사용자가 adminRoutes 접근 → /dashboard 리다이렉트
// Founder가 mentorRoutes 접근 → /dashboard 리다이렉트
// Mentor/Admin이 founderOnlyRoutes 접근 → /dashboard 리다이렉트
```

---

## Next.js App Router 폴더 구조

```
src/app/
├── (auth)/
│   ├── login/
│   │   └── page.tsx
│   └── layout.tsx              # 인증 레이아웃 (미인증용)
│
├── (dashboard)/
│   ├── dashboard/
│   │   └── page.tsx
│   ├── questions/
│   │   ├── page.tsx            # 목록
│   │   ├── new/
│   │   │   └── page.tsx        # 작성
│   │   └── [id]/
│   │       └── page.tsx        # 상세
│   ├── office-hours/
│   │   ├── page.tsx
│   │   ├── new/
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   ├── sessions/
│   │   ├── page.tsx
│   │   ├── new/
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── edit/
│   │           └── page.tsx
│   ├── assignments/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   ├── submissions/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   ├── community/
│   │   ├── page.tsx
│   │   ├── new/
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── edit/
│   │           └── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   ├── admin/
│   │   ├── page.tsx
│   │   ├── batches/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   ├── users/
│   │   │   ├── page.tsx
│   │   │   └── invite/
│   │   │       └── page.tsx
│   │   ├── assignments/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   │   └── page.tsx
│   │   │   └── [id]/
│   │   │       └── edit/
│   │   │           └── page.tsx
│   │   └── sessions/
│   │       └── page.tsx
│   └── layout.tsx              # 대시보드 레이아웃 (사이드바 포함)
│
├── auth/
│   └── callback/
│       └── route.ts            # OAuth 콜백 Route Handler
│
├── api/
│   └── upload/
│       └── route.ts            # 파일 업로드 API
│
├── globals.css
├── layout.tsx                  # 루트 레이아웃
└── page.tsx                    # 랜딩 (리다이렉트)
```

---

## 총 페이지 수

| 카테고리 | 페이지 수 |
|----------|----------|
| 인증 | 2 |
| 대시보드 | 1 |
| 질문 | 3 |
| 오피스아워 | 3 |
| 세션 | 4 |
| 과제 | 2 |
| 제출 | 2 |
| 커뮤니티 | 4 |
| 설정 | 1 |
| 관리자 | 9 |
| **합계** | **31** |
