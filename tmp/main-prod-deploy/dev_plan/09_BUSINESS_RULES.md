# 09. Business Rules (비즈니스 규칙)

> **Zero Context AI Guide**: 이 문서는 PRD에서 추출한 모든 비즈니스 규칙을 정리합니다.
> 구현 시 반드시 이 규칙들을 준수해야 합니다.

---

## 1. Batch (기수) 규칙

### 1.1 Batch 생성
| 규칙 | 상세 |
|------|------|
| 생성 권한 | **Super Admin, Admin** |
| 이름 | 최대 100자, 중복 허용 |
| 설명 | 선택, 최대 500자 |
| 동시 Active Batch | **불가** - 한 번에 1개의 Active Batch만 존재 |
| 생성 제한 | Active Batch가 존재하면 새 Batch 생성 버튼 비활성화 |

### 1.2 Batch 상태
| 상태 | 설명 | 가능한 작업 |
|------|------|------------|
| **Active** | 현재 운영 중 | 모든 기능 사용 가능 |
| **Archived** | 종료됨 | 전체 Read-only (열람만 가능) |

### 1.3 Batch 제약
| 제약 | 설명 |
|------|------|
| 삭제 | **불가** (잘못 생성 시 DB 직접 처리) |
| 재활성화 | **불가** (Archived → Active 전환 불가) |
| Archived 열람 | 해당 기수 참여자 + Super Admin/Admin만 가능 |

---

## 2. Question (질문) 규칙

### 2.1 필드 제약
| 필드 | 필수 | 제약 |
|------|:----:|------|
| 제목 (title) | ✅ | 최대 **200자** |
| 내용 (content) | ✅ | 최대 **10,000자** |
| 첨부파일 | ❌ | 최대 **5개**, 각 **10MB**, jpg/png/gif/pdf |

### 2.2 질문 작성 권한
| 역할 | 권한 |
|------|------|
| **Founder, Co-founder** | 질문 작성 가능 |
| **Mentor, Admin, Super Admin** | 답변만 가능 |

### 2.3 질문 상태
| 상태 | 설명 |
|------|------|
| **Open** | 답변 가능, 요약 없음 |
| **Closed** | 요약 작성됨, 추가 답변 불가 |

```
상태 전이: Open → Closed (요약 작성 시 자동 전환)
역전환: 불가 (Closed → Open 불가)
```

### 2.4 수정/삭제 규칙
| 동작 | 조건 |
|------|------|
| 수정 | 답변이 달리기 **전까지만** 가능 |
| 삭제 | **불가** |

### 2.5 기타 규칙
- 공개 범위: 기수 내 **전체 공개** (비공개 질문 없음)
- Mentor 지정: 없음 (전체 Mentor에게 공개)
- 카테고리/태그: 없음

---

## 3. Answer (답변) 규칙

### 3.1 필드 제약
| 필드 | 필수 | 제약 |
|------|:----:|------|
| 내용 (content) | ✅ | 최대 **10,000자** |

### 3.2 답변 작성 권한
| 역할 | 권한 |
|------|------|
| **Mentor, Admin, Super Admin** | 답변 작성 가능 |
| **Founder, Co-founder** | 열람만 가능 |

### 3.3 수정/삭제 규칙
| 동작 | 조건 |
|------|------|
| 수정 | 작성자 본인만 가능 |
| 삭제 | **불가** |

### 3.4 기타 규칙
- 복수 답변: **가능** (하나의 질문에 여러 답변)

---

## 4. Summary (요약) 규칙

### 4.1 필드 제약
| 필드 | 필수 | 제약 |
|------|:----:|------|
| 내용 (content) | ✅ | 최대 **10,000자** |

### 4.2 수정/삭제 규칙
| 동작 | 조건 |
|------|------|
| 작성 권한 | **Super Admin, Admin** |
| 수정 | **Super Admin, Admin** |
| 삭제 | **불가** |

### 4.3 기타 규칙
- 개수: 질문 1개당 요약 **1개**
- 효과: 요약 작성 시 해당 질문은 **자동으로 Closed** 처리
- 재오픈: **불가** (Closed → Open 전환 불가)
- 목적: 최종 정리, 반복 질문 방지, 지식 자산 축적

---

## 5. Office Hour (오피스아워) 규칙

### 5.1 Slot (슬롯) 규칙

| 항목 | 규칙 |
|------|------|
| 슬롯 단위 | **30분 고정** |
| 시간대 저장 | **UTC** (내부) |
| 시간대 표시 | PST / KST 선택 표시 |
| 반복 등록 | 없음 (수동으로 개별 등록) |
| 수정 | 요청 없는 슬롯만 가능 |
| 삭제 | 요청 없는 슬롯만 가능 |
| 과거 시간 | 등록 **불가** |

### 5.2 Request (요청) 규칙

| 항목 | 규칙 |
|------|------|
| 요청 권한 | **Founder, Co-founder** (그룹 멤버만 가능) |
| 형태 | **그룹 단위** (한 슬롯에 한 그룹이 요청) |
| 그룹 배정 | 요청 시 소속 그룹 선택 필수 |
| 다중 요청 | 가능 (다른 그룹이 같은 슬롯 요청 가능, Admin이 선택) |
| 취소 (확정 전) | 요청자가 자유롭게 취소 가능 |
| 취소 (확정 후) | **Super Admin, Admin만** 취소 가능 |

### 5.3 승인 권한

| 항목 | 권한 |
|------|------|
| 승인 권한 | **Super Admin, Admin, Mentor (해당 슬롯의 Host)** |
| 거절 권한 | **Super Admin, Admin, Mentor (해당 슬롯의 Host)** |

### 5.4 상태 전이

```
Slot 상태:
  available → requested (요청 접수)
  requested → confirmed (승인)
  requested → available (거절/취소로 요청 없어짐)
  confirmed → completed (미팅 완료)
  confirmed → cancelled (취소)

Request 상태:
  pending → approved (승인)
  pending → rejected (거절)
  pending → cancelled (취소)
  approved → cancelled (Super Admin/Admin만 취소 가능)
```

### 5.5 Google Calendar 연동

| 항목 | 규칙 |
|------|------|
| 연동 계정 | **peter@outsome.co** |
| 자동 생성 | 승인 시 Google Meet 링크 자동 생성 |
| Calendar Invite | 참석자(Founder/Co-founder, Mentor/Admin) 전원에게 발송 |
| 실패 시 | 에러 메시지 표시 + 수동 처리 안내 |

### 5.6 관리자 강제 스케줄링

| 항목 | 규칙 |
|------|------|
| 권한 | **Super Admin, Admin, Mentor** |
| 방식 | 그룹 선택 → 시간 지정 → 즉시 확정 (Request 없이) |
| 캘린더 | 그룹 전원에게 Google Meet 초대 발송 |
| 상태 | Slot이 바로 `confirmed` 상태로 생성 |

---

## 6. Event (이벤트) 규칙

### 6.1 이벤트 타입
| 타입 | 설명 |
|------|------|
| **one_off** | 단일 일정 이벤트 |
| **office_hour** | Mentor/Admin과 1:1 미팅 |
| **in_person** | 오프라인 미팅 |

### 6.2 이벤트 제한
| 항목 | 내용 |
|------|------|
| 최대 횟수 | **20회** (Batch당) |
| 시간대 | PST / KST 선택 지원 |
| 시간대 저장 | **UTC** (내부 저장) |

### 6.3 이벤트 생성
| 항목 | 내용 |
|------|------|
| 생성 권한 | **Super Admin, Admin** |
| 제목 | 필수, 최대 200자 |
| 설명 | 선택, 최대 2,000자 |
| 날짜/시간 | 필수 |
| 장소/링크 | 선택 |
| 대상 | 전체 또는 특정 역할 |

### 6.4 Google Calendar 연동
| 항목 | 내용 |
|------|------|
| 자동 생성 | 이벤트/오피스아워 승인 시 Google Calendar 일정 자동 생성 |
| 초대 발송 | 참석자 전원에게 Calendar Invite 이메일 발송 |
| Google Meet | 오피스아워 승인 시 자동 생성 |
| 수정/삭제 | 시스템 내 기록 수정, Google Calendar는 수동 처리 병행 |

---

## 7. Group (그룹) 규칙

### 7.1 그룹 관리
| 항목 | 내용 |
|------|------|
| 생성 권한 | **Super Admin, Admin** |
| 그룹명 | 최대 100자 |
| 설명 | 선택, 최대 500자 |
| 구성원 초대 | Super Admin/Admin이 배치 내 사용자 선택 초대 |
| 삭제 | Super Admin/Admin만 가능 |

### 7.2 그룹 내 피드
| 항목 | 내용 |
|------|------|
| 작성 권한 | 그룹 구성원 전체 |
| 열람 권한 | 그룹 구성원만 |
| 기능 | 전체 피드와 동일 (게시글/댓글/좋아요) |

### 7.3 그룹 × 오피스아워 연동

| 항목 | 내용 |
|------|------|
| 오피스아워 연결 | 그룹 단위로 오피스아워 요청/승인 |
| 유저 초대 시 그룹 배정 | 초대 시 그룹 선택 가능 (선택사항) |
| 미배정 유저 | 그룹에 속하지 않으면 오피스아워 요청 불가 |
| Google Meet | 승인/강제 스케줄링 시 그룹 전원에게 Meet 초대 |

---

## 8. Session (세션) 규칙

### 8.1 필드 제약
| 필드 | 필수 | 제약 |
|------|:----:|------|
| 제목 (title) | ✅ | - |
| 날짜 (session_date) | ✅ | - |
| 설명 (description) | ❌ | - |
| 슬라이드 링크 | ❌ | Google Slides URL |
| 녹화 링크 | ❌ | 녹화 영상 URL |

### 8.2 권한
- 등록/수정/삭제: **Super Admin, Admin**
- 열람: 전체 (Super Admin, Admin, Mentor, Founder, Co-founder)

---

## 9. Assignment (과제) 규칙

### 9.1 과제 생성 필드 제약
| 필드 | 필수 | 제약 |
|------|:----:|------|
| 제목 (title) | ✅ | 최대 **200자** |
| 설명 (description) | ✅ | 최대 **5,000자** |
| 템플릿 링크 | ❌ | Google Docs URL |
| 마감일 (due_date) | ✅ | **KST 23:59 기준** |

### 9.2 과제 관리 권한
| 동작 | 권한 |
|------|------|
| 생성 | **Super Admin, Admin, Mentor** |
| 수정 | 제출물 **없을 때만** 가능 |
| 삭제 | 제출물 **없을 때만** 가능 |

### 9.3 Submission (제출) 규칙

| 항목 | 규칙 |
|------|------|
| 제출 권한 | **Founder, Co-founder** |
| 제출 형식 | 텍스트(최대 5,000자) 또는 링크 (둘 중 하나 이상 필수) |
| 마감 후 제출 | **가능** ("지각 제출" 표시) |
| 재제출 | 가능 (**덮어쓰기** - 최신 제출물만 유지) |
| 제출물 열람 | 본인 + Super Admin/Admin + Mentor만 |

```typescript
// 지각 여부 계산
const isLate = submittedAt > assignment.dueDate;
```

### 9.4 Feedback (피드백) 규칙

| 항목 | 규칙 |
|------|------|
| 작성 권한 | **Super Admin, Admin, Mentor** |
| 형식 | 텍스트만 (최대 **3,000자**, 점수 없음) |
| 복수 피드백 | **가능** (Admin, Mentor 각자 피드백 작성 가능) |
| 수정 | 작성자 본인만 가능 |
| 삭제 | **불가** |

---

## 10. Community (커뮤니티) 규칙

### 10.1 Post (게시글) 규칙

| 필드 | 필수 | 제약 |
|------|:----:|------|
| 내용 (content) | ✅ | 최대 **3,000자** |
| 이미지 첨부 | ❌ | 최대 **5장**, 각 **5MB**, jpg/png/gif |

| 동작 | 조건 |
|------|------|
| 작성 | 전체 역할 가능 |
| 수정 | 본인 글만 가능 ("수정됨" 표시) |
| 삭제 | 본인 글만 가능 (**댓글 있어도 함께 삭제**) |

### 10.2 Comment (댓글) 규칙

| 필드 | 필수 | 제약 |
|------|:----:|------|
| 내용 (content) | ✅ | 최대 **1,000자** |

| 항목 | 규칙 |
|------|------|
| 작성 | 전체 역할 가능 |
| 대댓글 | 가능 (**2단계까지** - 댓글 → 대댓글) |
| 수정 | 본인 댓글만 가능 ("수정됨" 표시) |
| 삭제 | 본인 댓글만 가능 (**대댓글 있어도 함께 삭제**) |

### 10.3 Like (좋아요) 규칙

- 게시글에 좋아요 가능
- 댓글에 좋아요 가능
- **토글 방식** (좋아요 취소 가능)
- 권한: 전체 역할 가능

### 10.4 관리 기능

| 기능 | 권한 | 비고 |
|------|------|------|
| 게시글 비공개 처리 | **Super Admin, Admin** | 작성자/Admin만 열람 가능 |
| 게시글 삭제 | **Super Admin, Admin** | 완전 삭제 |
| 공지 등록 (상단 고정) | **Super Admin, Admin** | **최대 3개** |

---

## 11. User (사용자) 규칙

### 11.1 등록 방식
- **초대 기반**: Super Admin/Admin이 이메일 주소로 사용자 초대
- **인증 방식**: LinkedIn OAuth 로그인

### 11.2 역할 정의

| 역할 | 설명 |
|------|------|
| **Super Admin** | 시스템 최고 관리자 |
| **Admin** | 배치 관리자 |
| **Mentor** | 질문 답변, 피드백 제공 |
| **Founder** | 스타트업 창업자 (주 참여자) |
| **Co-founder** | 공동 창업자 (Founder당 0~3명) |

### 11.3 Batch 규모 제한

| 항목 | 제한 |
|------|------|
| 기수당 Founder | **30명** 이내 |
| Founder당 Co-founder | **0~3명** |
| 기수당 최대 참여자 | Founder 30명 + Co-founder 최대 90명 = **120명 이내** |

### 11.4 초대 정책

| 항목 | 규칙 |
|------|------|
| 초대 권한 | **Super Admin, Admin** |
| 초대 유효 기간 | **7일** (만료 시 재발송 필요) |
| 이메일 매칭 | LinkedIn 계정 이메일 기준 (초대 이메일은 알림용) |
| 초대 취소 | Super Admin/Admin이 가능 (초대 대기 상태에서만) |
| 중복 초대 | 동일 이메일로 중복 초대 **불가** |
| 역할 변경 | 같은 Batch 내 역할 변경 **불가** |

### 11.5 재참여 규칙

| 역할 | 재참여 |
|------|--------|
| **Founder** | **불가** (1인 1기수 원칙, LinkedIn ID 기준 검증) |
| **Co-founder** | **불가** (1인 1기수 원칙, Founder와 동일) |
| **Mentor** | **가능** (여러 기수 동시 참여 가능) |
| **Admin** | **가능** (여러 기수 동시 참여 가능) |
| **Super Admin** | **가능** (여러 기수 동시 참여 가능) |

### 11.6 Co-founder 규칙

| 항목 | 규칙 |
|------|------|
| 인원 제한 | Founder당 **0~3명** |
| 권한 | Founder와 동일 (질문, 과제 제출, 오피스아워 요청 등) |
| 독립성 | Founder 없이는 참여 불가 |

---

## 12. File Upload 규칙

### 12.1 질문 첨부파일

| 항목 | 제약 |
|------|------|
| 최대 개수 | **5개** |
| 최대 크기 | 각 **10MB** |
| 허용 형식 | jpg, png, gif, pdf |
| 저장소 | Supabase Storage |

### 12.2 게시글 이미지

| 항목 | 제약 |
|------|------|
| 최대 개수 | **5장** |
| 최대 크기 | 각 **5MB** |
| 허용 형식 | jpg, png, gif |
| 저장소 | Supabase Storage |

---

## 13. Time/Timezone 규칙

### 13.1 시간대 처리

| 항목 | 규칙 |
|------|------|
| DB 저장 | 모든 시간은 **UTC**로 저장 |
| 오피스아워 표시 | PST / KST 선택 표시 |
| 이벤트 표시 | PST / KST 선택 표시 |
| 과제 마감일 | **KST 23:59** 기준 |

### 13.2 지각 판정

```typescript
// 과제 지각 판정
const dueDateTime = new Date(assignment.dueDate); // KST 23:59
const submittedAt = new Date(submission.submittedAt); // UTC

const isLate = submittedAt > dueDateTime;
```

---

## 14. Notification 규칙 (MVP)

### 14.1 필수 알림

| 트리거 | 발송 대상 | 방식 |
|--------|----------|------|
| 오피스아워 승인 | Host + Founder/Co-founder | Google Calendar Invite |
| 이벤트 생성 | 참석자 전원 | Google Calendar Invite |

### 14.2 Optional 알림 (시간/예산 여유 시)

| 트리거 | 수신자 | 방식 |
|--------|--------|------|
| 질문 등록 | Super Admin/Admin + 전체 Mentor | 이메일 |
| 요약 등록 | 질문 작성자 (Founder/Co-founder) | 이메일 |

### 14.3 MVP 제외 알림

- ❌ 답변 등록 알림
- ❌ 오피스아워 요청/거절 알림
- ❌ 과제 등록/피드백 알림
- ❌ 게시글 댓글 알림
- ❌ 좋아요 알림
- ❌ Slack/Push/인앱 알림

---

## 15. Validation Rules Summary

### 15.1 텍스트 필드 제한

| 엔티티 | 필드 | 최대 길이 |
|--------|------|----------|
| Batch | name | 100자 |
| Batch | description | 500자 |
| Question | title | 200자 |
| Question | content | 10,000자 |
| Answer | content | 10,000자 |
| Summary | content | 10,000자 |
| Assignment | title | 200자 |
| Assignment | description | 5,000자 |
| Submission | content | 5,000자 |
| Feedback | content | 3,000자 |
| Post | content | 3,000자 |
| Comment | content | 1,000자 |
| Event | title | 200자 |
| Event | description | 2,000자 |
| Group | name | 100자 |
| Group | description | 500자 |

### 15.2 Zod 스키마 예시

```typescript
import { z } from 'zod';

export const questionSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  attachments: z.array(z.string().url()).max(5).optional(),
});

export const answerSchema = z.object({
  content: z.string().min(1).max(10000),
});

export const summarySchema = z.object({
  content: z.string().min(1).max(10000),
});

export const assignmentSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  templateUrl: z.string().url().optional(),
  dueDate: z.date(),
});

export const submissionSchema = z.object({
  content: z.string().max(5000).optional(),
  linkUrl: z.string().url().optional(),
}).refine(
  (data) => data.content || data.linkUrl,
  { message: "Content or link is required" }
);

export const feedbackSchema = z.object({
  content: z.string().min(1).max(3000),
});

export const postSchema = z.object({
  content: z.string().min(1).max(3000),
  images: z.array(z.string().url()).max(5).optional(),
});

export const commentSchema = z.object({
  content: z.string().min(1).max(1000),
  parentId: z.string().uuid().optional(),
});

export const batchSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  startDate: z.date(),
  endDate: z.date(),
});

export const eventSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  eventDate: z.date(),
  location: z.string().optional(),
  meetingLink: z.string().url().optional(),
});

export const groupSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});
```

---

## 16. State Machine Diagrams

### 16.1 Question State

```
┌────────┐    Summary 작성    ┌────────┐
│  Open  │ ─────────────────> │ Closed │
└────────┘                    └────────┘
     │                             │
     │ (수정 가능:                 │ (수정 불가,
     │  답변 없을 때만)            │  역전환 불가)
```

### 16.2 Office Hour Request State

```
┌─────────┐
│ pending │
└────┬────┘
     │
     ├─────────────────────────────────┐
     │                                 │
     ▼                                 ▼
┌──────────┐                    ┌──────────┐
│ approved │                    │ rejected │
└────┬─────┘                    └──────────┘
     │
     │ (Super Admin/Admin만)
     ▼
┌───────────┐
│ cancelled │
└───────────┘
```

### 16.3 Office Hour Slot State

```
┌───────────┐    요청 접수     ┌───────────┐
│ available │ ───────────────> │ requested │
└───────────┘                  └─────┬─────┘
     ▲                               │
     │ (요청 없어짐)                 │
     └───────────────────────────────┤
                                     │
                        ┌────────────┴────────────┐
                        │                         │
                        ▼                         ▼
                 ┌───────────┐             (거절됨)
                 │ confirmed │
                 └─────┬─────┘
                       │
          ┌────────────┴────────────┐
          │                         │
          ▼                         ▼
   ┌───────────┐             ┌───────────┐
   │ completed │             │ cancelled │
   └───────────┘             └───────────┘
```

---

## 17. 권한 매트릭스 (Role-Based Access Control)

### 17.1 Batch 관련 권한

| 기능 | Super Admin | Admin | Mentor | Founder | Co-founder |
|------|:-----------:|:-----:|:------:|:-------:|:----------:|
| Batch 생성 | ✅ | ✅ | ❌ | ❌ | ❌ |
| Batch 아카이브 | ✅ | ✅ | ❌ | ❌ | ❌ |
| Batch 열람 | ✅ | ✅ | ✅ | ✅ | ✅ |

### 17.2 질문/답변 관련 권한

| 기능 | Super Admin | Admin | Mentor | Founder | Co-founder |
|------|:-----------:|:-----:|:------:|:-------:|:----------:|
| 질문 작성 | ❌ | ❌ | ❌ | ✅ | ✅ |
| 답변 작성 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 요약 작성 | ✅ | ✅ | ❌ | ❌ | ❌ |

### 17.3 오피스아워 관련 권한

| 기능 | Super Admin | Admin | Mentor | Founder | Co-founder |
|------|:-----------:|:-----:|:------:|:-------:|:----------:|
| 슬롯 생성 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 요청 제출 | ❌ | ❌ | ❌ | ✅ | ✅ |
| 요청 승인 | ✅ | ✅ | ✅ (Host만) | ❌ | ❌ |
| 확정 후 취소 | ✅ | ✅ | ❌ | ❌ | ❌ |

### 17.4 과제 관련 권한

| 기능 | Super Admin | Admin | Mentor | Founder | Co-founder |
|------|:-----------:|:-----:|:------:|:-------:|:----------:|
| 과제 생성 | ✅ | ✅ | ✅ | ❌ | ❌ |
| 과제 제출 | ❌ | ❌ | ❌ | ✅ | ✅ |
| 피드백 작성 | ✅ | ✅ | ✅ | ❌ | ❌ |

### 17.5 이벤트 관련 권한

| 기능 | Super Admin | Admin | Mentor | Founder | Co-founder |
|------|:-----------:|:-----:|:------:|:-------:|:----------:|
| 이벤트 생성 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 이벤트 수정 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 이벤트 삭제 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 이벤트 열람 | ✅ | ✅ | ✅ | ✅ | ✅ |

### 17.6 그룹 관련 권한

| 기능 | Super Admin | Admin | Mentor | Founder | Co-founder |
|------|:-----------:|:-----:|:------:|:-------:|:----------:|
| 그룹 생성 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 구성원 초대 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 그룹 피드 작성 | ✅ (구성원일 때) | ✅ (구성원일 때) | ✅ (구성원일 때) | ✅ (구성원일 때) | ✅ (구성원일 때) |
| 그룹 삭제 | ✅ | ✅ | ❌ | ❌ | ❌ |

### 17.7 커뮤니티 관련 권한

| 기능 | Super Admin | Admin | Mentor | Founder | Co-founder |
|------|:-----------:|:-----:|:------:|:-------:|:----------:|
| 게시글 작성 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 댓글 작성 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 좋아요 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 게시글 비공개 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 타인 글 삭제 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 공지 등록 | ✅ | ✅ | ❌ | ❌ | ❌ |

---

**문서 끝**
