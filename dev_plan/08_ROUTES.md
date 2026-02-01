# Routes - 전체 라우트 구조

> Founder Sprint Workspace MVP v2.0의 모든 URL 경로 명세

## 라우트 맵 개요

```
/                          → 로그인 페이지 (미인증 시) 또는 대시보드 리다이렉트
├── /login                 → LinkedIn OAuth 로그인
├── /auth/callback         → OAuth 콜백 처리
│
├── /dashboard             → 메인 대시보드 (전체 역할 공통)
│
├── /questions             → 질문 목록
│   ├── /questions/new     → 질문 작성 (Founder, Co-founder만)
│   └── /questions/[id]    → 질문 상세 + 답변 + 요약
│
├── /events                → 이벤트/오피스아워 캘린더
│   ├── /events/new        → 이벤트 생성 (Super Admin, Admin만)
│   └── /events/[id]       → 이벤트 상세
│
├── /office-hours          → 오피스아워 슬롯 관리
│   ├── /office-hours/new  → 슬롯 등록 (Super Admin, Admin, Mentor)
│   └── /office-hours/[id] → 슬롯 상세 + 요청/승인
│
├── /sessions              → 세션 목록 (슬라이드/녹화)
│   ├── /sessions/new      → 세션 등록 (Super Admin, Admin만)
│   └── /sessions/[id]     → 세션 상세/수정
│
├── /assignments           → 과제 목록
│   └── /assignments/[id]  → 과제 상세 + 제출
│
├── /submissions           → 제출 현황 대시보드 (Super Admin, Admin, Mentor만)
│   └── /submissions/[id]  → 제출물 상세 + 피드백 작성
│
├── /feed                  → 피드 (게시글 리스트)
│   ├── /feed/new          → 게시글 작성
│   └── /feed/[id]         → 게시글 상세 + 댓글
│
├── /groups                → 그룹 리스트
│   ├── /groups/new        → 그룹 생성 (Super Admin, Admin만)
│   └── /groups/[id]       → 그룹 상세 (그룹 구성원만)
│
├── /settings              → 개인 설정 (프로필)
│
└── /admin                 → 관리자 대시보드 (Super Admin, Admin만)
    ├── /admin/batches     → Batch(기수) 관리
    ├── /admin/users       → 사용자 초대/관리
    ├── /admin/assignments → 과제 관리
    └── /admin/groups      → 그룹 관리
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
| `/dashboard` | GET | 메인 대시보드 | 전체 역할 |

**대시보드 표시 내용 (역할별):**

| 역할 | 표시 내용 |
|------|----------|
| Founder, Co-founder | 내 질문 현황, 다가오는 오피스아워, 과제 마감, 최근 게시글 |
| Mentor | 답변 대기 질문, 내 오피스아워 요청, 피드백 대기 제출물 |
| Admin, Super Admin | 전체 현황 요약, Batch 상태, 빠른 관리 링크 |

### 3. 질문 (Questions)

| 경로 | 메서드 | 설명 | 접근 권한 |
|------|--------|------|-----------|
| `/questions` | GET | 질문 목록 (필터: Open/Closed) | 전체 |
| `/questions/new` | GET | 질문 작성 폼 | **Founder, Co-founder만** |
| `/questions/new` | POST | 질문 생성 (Server Action) | **Founder, Co-founder만** |
| `/questions/[id]` | GET | 질문 상세 + 답변 + 요약 | 전체 |

**질문 상세 페이지 액션:**

| 액션 | Server Action | 접근 권한 |
|------|--------------|-----------|
| 질문 수정 | `updateQuestion` | 작성자 (답변 전까지만) |
| 답변 작성 | `createAnswer` | Super Admin, Admin, Mentor |
| 답변 수정 | `updateAnswer` | 답변 작성자 |
| 요약 작성 | `createSummary` | **Super Admin, Admin만** |
| 요약 수정 | `updateSummary` | **Super Admin, Admin만** |

### 4. 이벤트 (Events)

| 경로 | 메서드 | 설명 | 접근 권한 |
|------|--------|------|-----------|
| `/events` | GET | 이벤트/오피스아워 캘린더 | 전체 |
| `/events/new` | GET | 이벤트 생성 폼 | Super Admin, Admin |
| `/events/new` | POST | 이벤트 생성 (Server Action) | Super Admin, Admin |
| `/events/[id]` | GET | 이벤트 상세 | 전체 |
| `/events/[id]/edit` | GET | 이벤트 수정 폼 | Super Admin, Admin |

**이벤트 타입:**
- **One-off**: 단일 일정 이벤트
- **Office Hour**: 1:1 미팅 (별도 관리)
- **In-person**: 오프라인 미팅

**이벤트 액션:**

| 액션 | Server Action | 접근 권한 |
|------|--------------|-----------|
| 이벤트 생성 | `createEvent` | Super Admin, Admin |
| 이벤트 수정 | `updateEvent` | Super Admin, Admin |
| 이벤트 삭제 | `deleteEvent` | Super Admin, Admin |

### 5. 오피스아워 (Office Hours)

| 경로 | 메서드 | 설명 | 접근 권한 |
|------|--------|------|-----------|
| `/office-hours` | GET | 오피스아워 슬롯 목록 | 전체 |
| `/office-hours/new` | GET | 슬롯 등록 폼 | Super Admin, Admin, Mentor |
| `/office-hours/new` | POST | 슬롯 생성 (Server Action) | Super Admin, Admin, Mentor |
| `/office-hours/[id]` | GET | 슬롯 상세 | 전체 |

**오피스아워 액션:**

| 액션 | Server Action | 접근 권한 |
|------|--------------|-----------|
| 슬롯 등록 | `createSlot` | Super Admin, Admin, Mentor |
| 슬롯 수정 | `updateSlot` | 슬롯 소유자 (요청 없을 때만) |
| 슬롯 삭제 | `deleteSlot` | 슬롯 소유자 (요청 없을 때만) |
| 요청 | `requestSlot` | **Founder, Co-founder만** |
| 요청 취소 | `cancelRequest` | 요청자 (확정 전까지) |
| 승인 | `approveRequest` | 슬롯 소유자, Super Admin, Admin |
| 거절 | `rejectRequest` | 슬롯 소유자, Super Admin, Admin |

### 6. 세션 (Sessions)

| 경로 | 메서드 | 설명 | 접근 권한 |
|------|--------|------|-----------|
| `/sessions` | GET | 세션 목록 | 전체 |
| `/sessions/new` | GET | 세션 등록 폼 | **Super Admin, Admin만** |
| `/sessions/new` | POST | 세션 생성 (Server Action) | **Super Admin, Admin만** |
| `/sessions/[id]` | GET | 세션 상세 | 전체 |
| `/sessions/[id]/edit` | GET | 세션 수정 폼 | **Super Admin, Admin만** |

### 7. 과제 (Assignments)

| 경로 | 메서드 | 설명 | 접근 권한 |
|------|--------|------|-----------|
| `/assignments` | GET | 과제 목록 | 전체 |
| `/assignments/[id]` | GET | 과제 상세 + 제출 폼 | 전체 |

**과제 상세 페이지 액션:**

| 액션 | Server Action | 접근 권한 |
|------|--------------|-----------|
| 제출 | `submitAssignment` | **Founder, Co-founder만** |
| 재제출 | `submitAssignment` | **Founder, Co-founder만** (덮어쓰기) |

### 8. 제출 현황 (Submissions)

| 경로 | 메서드 | 설명 | 접근 권한 |
|------|--------|------|-----------|
| `/submissions` | GET | 전체 제출 현황 대시보드 | Super Admin, Admin, Mentor |
| `/submissions/[id]` | GET | 제출물 상세 + 피드백 | Super Admin, Admin, Mentor, 제출자 |

**제출물 상세 페이지 액션:**

| 액션 | Server Action | 접근 권한 |
|------|--------------|-----------|
| 피드백 작성 | `createFeedback` | Super Admin, Admin, Mentor |
| 피드백 수정 | `updateFeedback` | 피드백 작성자 |

### 9. 피드 (Feed)

| 경로 | 메서드 | 설명 | 접근 권한 |
|------|--------|------|-----------|
| `/feed` | GET | 게시글 목록 (공지 상단 고정) | 전체 |
| `/feed/new` | GET | 게시글 작성 폼 | 전체 |
| `/feed/new` | POST | 게시글 생성 (Server Action) | 전체 |
| `/feed/[id]` | GET | 게시글 상세 + 댓글 | 전체 |
| `/feed/[id]/edit` | GET | 게시글 수정 폼 | 작성자 |

**피드 액션:**

| 액션 | Server Action | 접근 권한 |
|------|--------------|-----------|
| 게시글 수정 | `updatePost` | 작성자 |
| 게시글 삭제 | `deletePost` | 작성자 |
| 게시글 Archive | `archivePost` | **Super Admin, Admin만** |
| 댓글 작성 | `createComment` | 전체 |
| 댓글 수정 | `updateComment` | 작성자 |
| 댓글 삭제 | `deleteComment` | 작성자 |
| 좋아요 | `toggleLike` | 전체 |
| 공지 고정 | `pinPost` | **Super Admin, Admin만** |

### 10. 그룹 (Groups)

| 경로 | 메서드 | 설명 | 접근 권한 |
|------|--------|------|-----------|
| `/groups` | GET | 소속 그룹 목록 | 전체 |
| `/groups/new` | GET | 그룹 생성 폼 | **Super Admin, Admin만** |
| `/groups/new` | POST | 그룹 생성 (Server Action) | **Super Admin, Admin만** |
| `/groups/[id]` | GET | 그룹 상세 (그룹 내 피드) | **그룹 구성원만** |
| `/groups/[id]/edit` | GET | 그룹 수정 폼 | **Super Admin, Admin만** |

**그룹 액션:**

| 액션 | Server Action | 접근 권한 |
|------|--------------|-----------|
| 그룹 생성 | `createGroup` | Super Admin, Admin |
| 구성원 초대 | `addGroupMember` | Super Admin, Admin |
| 구성원 제거 | `removeGroupMember` | Super Admin, Admin |
| 그룹 삭제 | `deleteGroup` | Super Admin, Admin |
| 그룹 내 게시글 작성 | `createGroupPost` | 그룹 구성원 |

### 11. 설정 (Settings)

| 경로 | 메서드 | 설명 | 접근 권한 |
|------|--------|------|-----------|
| `/settings` | GET | 프로필 설정 | 인증됨 |
| `/settings` | POST | 프로필 업데이트 (Server Action) | 인증됨 |

### 12. 관리자 (Admin)

| 경로 | 메서드 | 설명 | 접근 권한 |
|------|--------|------|-----------|
| `/admin` | GET | 관리자 대시보드 | **Super Admin, Admin만** |
| `/admin/batches` | GET | Batch 목록 | **Super Admin, Admin만** |
| `/admin/batches/new` | GET | Batch 생성 폼 | **Super Admin, Admin만** |
| `/admin/batches/[id]` | GET | Batch 상세/종료 | **Super Admin, Admin만** |
| `/admin/users` | GET | 사용자 목록 | **Super Admin, Admin만** |
| `/admin/users/invite` | GET | 사용자 초대 폼 | **Super Admin, Admin만** |
| `/admin/assignments` | GET | 과제 관리 목록 | **Super Admin, Admin만** |
| `/admin/assignments/new` | GET | 과제 생성 폼 | **Super Admin, Admin만** |
| `/admin/assignments/[id]/edit` | GET | 과제 수정 폼 | **Super Admin, Admin만** |
| `/admin/groups` | GET | 그룹 관리 목록 | **Super Admin, Admin만** |

---

## API Routes (Route Handlers)

| 경로 | 메서드 | 설명 |
|------|--------|------|
| `/api/auth/callback` | GET | Supabase OAuth 콜백 |
| `/api/upload` | POST | 파일 업로드 (Supabase Storage) |
| `/api/calendar/invite` | POST | Google Calendar 초대 발송 |

---

## Middleware 보호 규칙

```typescript
// src/middleware.ts

const publicRoutes = [
  '/',
  '/login',
  '/auth/callback',
];

const superAdminRoutes = [
  // Super Admin 전용 라우트 (필요시 추가)
];

const adminRoutes = [
  '/admin',
  '/admin/*',
  '/events/new',
  '/groups/new',
];

const mentorRoutes = [
  '/submissions',
  '/submissions/*',
  '/office-hours/new',
];

const founderOnlyRoutes = [
  '/questions/new',
];

// 역할 기반 접근 제어:
// - 미인증 사용자 → /login 리다이렉트
// - Super Admin: 모든 경로 접근 가능
// - Admin: adminRoutes 접근 가능
// - Mentor: mentorRoutes 접근 가능
// - Founder, Co-founder: founderOnlyRoutes 접근 가능
// - 권한 없는 사용자가 제한된 라우트 접근 → /dashboard 리다이렉트
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
│   │   │   └── page.tsx        # 작성 (Founder, Co-founder)
│   │   └── [id]/
│   │       └── page.tsx        # 상세
│   ├── events/
│   │   ├── page.tsx            # 이벤트/오피스아워 캘린더
│   │   ├── new/
│   │   │   └── page.tsx        # 이벤트 생성 (Admin)
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── edit/
│   │           └── page.tsx
│   ├── office-hours/
│   │   ├── new/
│   │   │   └── page.tsx        # 슬롯 등록 (Admin, Mentor)
│   │   └── [id]/
│   │       └── page.tsx        # 슬롯 상세
│   ├── sessions/
│   │   ├── page.tsx
│   │   ├── new/
│   │   │   └── page.tsx        # Admin만
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── edit/
│   │           └── page.tsx    # Admin만
│   ├── assignments/
│   │   ├── page.tsx
│   │   └── [id]/
│   │       └── page.tsx
│   ├── submissions/
│   │   ├── page.tsx            # Admin, Mentor만
│   │   └── [id]/
│   │       └── page.tsx
│   ├── feed/
│   │   ├── page.tsx
│   │   ├── new/
│   │   │   └── page.tsx
│   │   └── [id]/
│   │       ├── page.tsx
│   │       └── edit/
│   │           └── page.tsx
│   ├── groups/
│   │   ├── page.tsx            # 그룹 리스트
│   │   ├── new/
│   │   │   └── page.tsx        # Admin만
│   │   └── [id]/
│   │       ├── page.tsx        # 그룹 구성원만
│   │       └── edit/
│   │           └── page.tsx    # Admin만
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
│   │   └── groups/
│   │       └── page.tsx
│   └── layout.tsx              # 대시보드 레이아웃 (사이드바 포함)
│
├── auth/
│   └── callback/
│       └── route.ts            # OAuth 콜백 Route Handler
│
├── api/
│   ├── upload/
│   │   └── route.ts            # 파일 업로드 API
│   └── calendar/
│       └── invite/
│           └── route.ts        # Google Calendar 초대 API
│
├── globals.css
├── layout.tsx                  # 루트 레이아웃
└── page.tsx                    # 랜딩 (리다이렉트)
```

---

## 역할별 접근 권한 요약

### Super Admin
- 모든 기능 접근 가능
- Batch 관리, 사용자 관리, 이벤트 생성, 그룹 관리
- 요약 작성, 게시글 Archive

### Admin
- Super Admin과 동일한 권한
- 복수의 Admin 존재 가능

### Mentor
- 답변 작성, 피드백 작성
- 오피스아워 슬롯 등록
- 제출 현황 조회
- 질문 작성 불가

### Founder
- 질문 작성, 과제 제출
- 오피스아워 요청
- 게시글/댓글 작성
- 답변 및 피드백 작성 불가

### Co-founder
- Founder와 동일한 권한
- Founder와 함께 프로그램 참여

---

## 총 페이지 수

| 카테고리 | 페이지 수 |
|----------|----------|
| 인증 | 2 |
| 대시보드 | 1 |
| 질문 | 3 |
| 이벤트/오피스아워 | 4 |
| 세션 | 3 |
| 과제 | 2 |
| 제출 | 2 |
| 피드 | 3 |
| 그룹 | 3 |
| 설정 | 1 |
| 관리자 | 7 |
| **합계** | **31** |

> **주의**: v2.0 기획서에는 화면 수가 21개로 명시되어 있으나, 실제 구현 시 edit 페이지와 관리 페이지를 포함하면 약 31개의 라우트가 필요합니다. 화면 수 21개는 주요 기능 화면 기준입니다.

---

## 주요 변경사항 (v1.0 → v2.0)

### 1. 역할 체계 확장
- **v1.0**: Admin, Mentor, Founder (3개)
- **v2.0**: Super Admin, Admin, Mentor, Founder, Co-founder (5개)

### 2. 이벤트 기능 추가
- 일회성 이벤트, 오피스아워, 대면 미팅 타입 지원
- `/events` 라우트 추가

### 3. 그룹 기능 추가
- 그룹 생성 및 관리
- 그룹 내 별도 피드 운영
- `/groups` 라우트 추가

### 4. 커뮤니티 → 피드 명칭 변경
- `/community` → `/feed`

### 5. 권한 세분화
- Admin 권한이 Super Admin과 Admin으로 분리
- Co-founder 역할 추가로 Founder 권한 공유

### 6. 게시글 삭제 → Archive
- 게시글 삭제 대신 Archive 기능 (복구 가능)

---

**문서 끝**
