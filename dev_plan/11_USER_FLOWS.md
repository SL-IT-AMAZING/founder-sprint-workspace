# 11. 유저 플로우 (User Flows)

> **Zero Context AI Guide**: 이 문서는 5개 핵심 유저 플로우를 정의합니다.
> 개발 시 이 플로우를 기준으로 화면 전환과 비즈니스 로직을 구현합니다.
> 각 플로우는 화면 번호(Screen #), 비즈니스 규칙(BR #), 권한(PERM #) 참조를 포함합니다.

---

## 문서 참조 규약

| 접두사 | 출처 문서 | 예시 |
|--------|----------|------|
| **Screen** | 21개 화면 스펙 | Screen 5 = 질문 작성 |
| **BR** | `09_BUSINESS_RULES.md` 섹션 | BR 2.3 = 질문 상태 규칙 |
| **PERM** | `10_PERMISSIONS.md` 섹션 | PERM 2.3 = 질문/답변/요약 권한 |
| **ROUTE** | `08_ROUTES.md` 경로 | ROUTE /questions/new |

### 화면 번호 매핑

| # | 화면명 | 라우트 |
|---|--------|--------|
| 1 | Login | `/login` |
| 2 | Dashboard | `/dashboard` |
| 3 | Question List | `/questions` |
| 4 | Question Detail | `/questions/[id]` |
| 5 | Question Create | `/questions/new` |
| 6 | Event/Office Hour Calendar | `/events` |
| 7 | Event Creation | `/events/new` |
| 8 | Office Hour Slot Registration | `/office-hours/new` |
| 9 | Session List | `/sessions` |
| 10 | Session Create/Edit | `/sessions/new`, `/sessions/[id]/edit` |
| 11 | Assignment List | `/assignments` |
| 12 | Assignment Detail | `/assignments/[id]` |
| 13 | Submission Status | `/submissions` |
| 14 | Feed | `/feed` |
| 15 | Post Detail | `/feed/[id]` |
| 16 | Post Create | `/feed/new` |
| 17 | Group List | `/groups` |
| 18 | Group Detail | `/groups/[id]` |
| 19 | Group Management | `/admin/groups` |
| 20 | Admin: Batch Management | `/admin/batches` |
| 21 | Admin: User Management | `/admin/users` |

---

## Flow 1: Founder 질문 -> 답변 -> 요약

### 개요

| 항목 | 내용 |
|------|------|
| **플로우 제목** | 질문 생성부터 요약 완료까지의 전체 생명주기 |
| **설명** | Founder/Co-founder가 질문을 작성하면, Mentor/Admin이 답변하고, Admin이 요약을 작성하여 질문을 종료하는 플로우 |
| **주요 Actor** | Founder/Co-founder (질문 작성), Mentor/Admin/Super Admin (답변), Admin/Super Admin (요약) |
| **관련 화면** | Screen 2, 3, 4, 5 |
| **관련 규칙** | BR 2, 3, 4 / PERM 2.3 |

### 사전 조건 (Preconditions)

- 사용자가 LinkedIn OIDC로 인증 완료 (Screen 1)
- Active Batch에 소속되어 있음
- 질문 작성자: Founder 또는 Co-founder 역할

### 상태 머신

```
질문(Question) 상태:

  ┌────────┐     요약 작성      ┌────────┐
  │  Open  │ ──────────────────>│ Closed │
  └───┬────┘                    └────────┘
      │                              │
      │ 수정 가능: 답변 0개일 때     │ 수정 불가
      │ 답변 추가: 가능              │ 답변 추가: 불가
      │ 삭제: 불가                   │ 역전환: 불가
```

### 단계별 플로우

#### Phase A: 질문 작성 (Founder/Co-founder)

| 단계 | 화면 | 행위자 | 액션 | 상세 |
|------|------|--------|------|------|
| A1 | Screen 2 | Founder | Dashboard에서 "질문하기" 클릭 | Dashboard에 빠른 액션 버튼 표시 |
| A2 | Screen 5 | Founder | 질문 작성 폼 진입 | ROUTE `/questions/new` |
| A3 | Screen 5 | Founder | 제목 입력 | 필수, 최대 200자 (BR 2.1) |
| A4 | Screen 5 | Founder | 내용 입력 | 필수, 최대 10,000자 (BR 2.1) |
| A5 | Screen 5 | Founder | 첨부파일 업로드 (선택) | 최대 5개, 각 10MB, jpg/png/gif/pdf (BR 12.1) |
| A6 | Screen 5 | Founder | "질문 등록" 버튼 클릭 | Server Action: `createQuestion` |
| A7 | Screen 4 | System | 질문 상세 페이지로 리다이렉트 | 상태: "Open" |

**A5 첨부파일 업로드 상세:**

```
파일 선택 → 클라이언트 검증 → 서버 업로드 → URL 저장

클라이언트 검증:
  - 파일 개수 <= 5
  - 각 파일 크기 <= 10MB
  - 확장자: jpg, png, gif, pdf

서버 처리:
  - Supabase Storage에 업로드
  - 업로드된 URL을 question.attachments에 저장
```

#### Phase B: 질문 수정 (답변 전까지만)

| 단계 | 화면 | 행위자 | 액션 | 상세 |
|------|------|--------|------|------|
| B1 | Screen 4 | Founder | 질문 상세에서 "수정" 버튼 확인 | 답변 0개일 때만 표시 (BR 2.4) |
| B2 | Screen 5 | Founder | 수정 폼에서 내용 변경 | 동일한 필드 제약 적용 |
| B3 | Screen 4 | System | 수정 완료 후 상세 페이지로 복귀 | |

**분기점 (Decision Point):**

```
답변이 존재하는가?
  ├── YES → "수정" 버튼 비활성화/숨김, 수정 불가
  └── NO  → "수정" 버튼 표시, 수정 가능
```

#### Phase C: 답변 작성 (Mentor/Admin/Super Admin)

| 단계 | 화면 | 행위자 | 액션 | 상세 |
|------|------|--------|------|------|
| C1 | Screen 3 | Mentor | 질문 목록에서 "Open" 질문 확인 | 필터: Open/Closed |
| C2 | Screen 4 | Mentor | 질문 상세 진입 | 질문 내용 + 기존 답변 + 첨부파일 확인 |
| C3 | Screen 4 | Mentor | 답변 작성 영역에 내용 입력 | 최대 10,000자 (BR 3.1) |
| C4 | Screen 4 | Mentor | "답변 등록" 클릭 | Server Action: `createAnswer` |
| C5 | Screen 4 | System | 답변 목록에 새 답변 표시 | 복수 답변 가능 (BR 3.4) |

**답변 수정:**

| 단계 | 화면 | 행위자 | 액션 | 상세 |
|------|------|--------|------|------|
| C6 | Screen 4 | Mentor | 본인 답변의 "수정" 클릭 | 본인 답변만 수정 가능 (BR 3.3) |
| C7 | Screen 4 | Mentor | 답변 내용 수정 후 저장 | Server Action: `updateAnswer` |

#### Phase D: 요약 작성 및 질문 종료 (Admin/Super Admin)

| 단계 | 화면 | 행위자 | 액션 | 상세 |
|------|------|--------|------|------|
| D1 | Screen 4 | Admin | 질문 상세에서 "요약 작성" 버튼 확인 | Admin/Super Admin만 표시 (PERM 2.3) |
| D2 | Screen 4 | Admin | 요약 내용 입력 | 최대 10,000자 (BR 4.1) |
| D3 | Screen 4 | Admin | "요약 등록" 클릭 | Server Action: `createSummary` |
| D4 | Screen 4 | System | 질문 상태 자동 변경: Open -> Closed | 자동 전환 (BR 4.3) |
| D5 | Screen 3 | System | 질문 목록에서 "Closed" 표시 | |

### 권한 매트릭스

| 액션 | Super Admin | Admin | Mentor | Founder | Co-founder |
|------|:-----------:|:-----:|:------:|:-------:|:----------:|
| 질문 작성 | - | - | - | O | O |
| 질문 수정 (답변 전) | - | - | - | O (본인) | O (본인) |
| 질문 열람 | O | O | O | O | O |
| 답변 작성 | O | O | O | - | - |
| 답변 수정 | O (본인) | O (본인) | O (본인) | - | - |
| 요약 작성 | O | O | - | - | - |
| 요약 수정 | O | O | - | - | - |

### 사후 조건 (Postconditions)

- 질문이 "Closed" 상태로 전환됨
- 요약이 질문 상세 페이지 상단에 표시됨
- 추가 답변 불가
- 해당 질문은 기수 내 전체 공개 상태 유지 (지식 자산)

### 에러 케이스

| 에러 | 발생 시점 | 처리 |
|------|----------|------|
| 제목/내용 미입력 | A3-A4 | 폼 유효성 검사 실패, 인라인 에러 메시지 |
| 첨부파일 크기 초과 (>10MB) | A5 | 클라이언트 측 검증, 업로드 차단 + 에러 토스트 |
| 첨부파일 형식 불일치 | A5 | 클라이언트 측 검증, 허용 형식 안내 |
| 첨부파일 개수 초과 (>5개) | A5 | 추가 업로드 버튼 비활성화 |
| 답변 후 질문 수정 시도 | B1 | API 레벨 거부 + "답변이 존재하여 수정할 수 없습니다" 메시지 |
| Closed 질문에 답변 시도 | C3 | 답변 작성 영역 비활성화 + 안내 메시지 |
| 요약 중복 작성 시도 | D2 | 이미 요약 존재 시 "수정" 모드로 전환 |
| 파일 업로드 네트워크 실패 | A5 | 재시도 버튼 표시, 부분 업로드 롤백 |

---

## Flow 2: 오피스아워 요청 -> 승인 -> Google Meet

### 개요

| 항목 | 내용 |
|------|------|
| **플로우 제목** | 오피스아워 슬롯 등록부터 Google Meet 미팅 완료까지 |
| **설명** | Mentor/Admin이 30분 슬롯을 등록하고, Founder가 요청하면, Host가 승인하여 Google Calendar + Meet가 자동 생성되는 플로우 |
| **주요 Actor** | Mentor/Admin (슬롯 등록, 승인), Founder/Co-founder (요청), System (Google Calendar 연동) |
| **관련 화면** | Screen 2, 6, 8 |
| **관련 규칙** | BR 5 / PERM 2.4 |

### 사전 조건 (Preconditions)

- 모든 참여자가 LinkedIn OIDC로 인증 완료
- Active Batch에 소속
- Google Calendar 연동: peter@outsome.co 서비스 계정 설정 완료
- 슬롯 등록자: Mentor, Admin, 또는 Super Admin 역할

### 상태 머신

```
Slot 상태:
  ┌───────────┐    요청 접수     ┌───────────┐
  │ available │ ───────────────> │ requested │
  └─────┬─────┘                  └─────┬─────┘
        │                               │
        │ (수정/삭제 가능:              ├──────────────────────┐
        │  요청 없을 때만)              │                      │
        │                              ▼                      ▼
        │                       ┌───────────┐          (모든 요청 거절/취소
        │                       │ confirmed │           → available 복귀)
        │                       └─────┬─────┘
        │                             │
        │                ┌────────────┴────────────┐
        │                │                         │
        │                ▼                         ▼
        │         ┌───────────┐             ┌───────────┐
        │         │ completed │             │ cancelled │
        │         └───────────┘             └───────────┘
        │
        └─── (요청 없을 때) 삭제 가능

Request 상태:
  ┌─────────┐
  │ pending │
  └────┬────┘
       │
       ├─────────────────┬────────────────┐
       │                 │                │
       ▼                 ▼                ▼
  ┌──────────┐    ┌──────────┐    ┌───────────┐
  │ approved │    │ rejected │    │ cancelled │
  └────┬─────┘    └──────────┘    └───────────┘
       │                           (요청자가 확정 전 취소)
       │ (Super Admin/Admin만)
       ▼
  ┌───────────┐
  │ cancelled │
  └───────────┘
```

### 단계별 플로우

#### Phase A: 슬롯 등록 (Mentor/Admin)

| 단계 | 화면 | 행위자 | 액션 | 상세 |
|------|------|--------|------|------|
| A1 | Screen 6 | Mentor | 캘린더에서 "슬롯 등록" 클릭 | 또는 Dashboard에서 바로가기 |
| A2 | Screen 8 | Mentor | 슬롯 등록 폼 진입 | ROUTE `/office-hours/new` |
| A3 | Screen 8 | Mentor | 날짜/시간 선택 | 30분 고정 단위 (BR 5.1) |
| A4 | Screen 8 | Mentor | 시간대 확인 | UTC 저장, PST/KST 표시 (BR 13.1) |
| A5 | Screen 8 | Mentor | "슬롯 등록" 클릭 | Server Action: `createSlot` |
| A6 | Screen 6 | System | 캘린더에 슬롯 표시 (available) | |

**분기점 - 과거 시간 검증:**

```
선택한 시간 > 현재 시간?
  ├── YES → 등록 진행
  └── NO  → 에러: "과거 시간에는 슬롯을 등록할 수 없습니다"
```

#### Phase B: 슬롯 요청 (Founder/Co-founder)

| 단계 | 화면 | 행위자 | 액션 | 상세 |
|------|------|--------|------|------|
| B1 | Screen 6 | Founder | 캘린더에서 "available" 슬롯 확인 | Mentor 이름, 시간 표시 |
| B2 | Screen 6 | Founder | 슬롯 클릭 후 "요청" 버튼 클릭 | |
| B3 | Screen 6 | System | 요청 접수, Request 상태: pending | Slot 상태: available -> requested |
| B4 | Screen 6 | System | 슬롯 표시 변경 (requested) | 다른 Founder도 동일 슬롯에 요청 가능 |

**다중 요청 시나리오:**

```
Slot A (Mentor Kim, 14:00-14:30)
  ├── Request 1: Founder Park (pending)
  ├── Request 2: Founder Lee (pending)
  └── Request 3: Founder Choi (pending)

→ Host(Mentor Kim) 또는 Admin이 1명을 선택 승인
→ 나머지 요청은 pending 상태 유지 (자동 거절되지 않음)
```

#### Phase C: 요청 승인 (Host Mentor / Admin / Super Admin)

| 단계 | 화면 | 행위자 | 액션 | 상세 |
|------|------|--------|------|------|
| C1 | Screen 2 | Mentor | Dashboard에서 "대기 중 요청" 알림 확인 | |
| C2 | Screen 6 | Mentor | 해당 슬롯의 요청 목록 확인 | 요청자 이름, 요청 시간 표시 |
| C3 | Screen 6 | Mentor | 승인할 요청 선택 후 "승인" 클릭 | Server Action: `approveRequest` |
| C4 | - | System | Google Calendar 이벤트 자동 생성 | peter@outsome.co 서비스 계정 사용 |
| C5 | - | System | Google Meet 링크 자동 생성 | Calendar 이벤트에 Meet 링크 포함 |
| C6 | - | System | Calendar Invite 이메일 발송 | Mentor + Founder 양쪽에 발송 |
| C7 | Screen 6 | System | Slot 상태: confirmed | Request 상태: approved |

**분기점 - Google Calendar 연동 실패:**

```
Google Calendar API 호출 성공?
  ├── YES → C5로 진행 (Meet 링크 생성)
  └── NO  → 에러 메시지 표시
           → "Google Calendar 연동에 실패했습니다. 수동으로 미팅을 설정해주세요."
           → 승인 자체는 유효 (롤백하지 않음)
           → Admin에게 수동 처리 안내
```

#### Phase D: 미팅 진행 및 완료

| 단계 | 화면 | 행위자 | 액션 | 상세 |
|------|------|--------|------|------|
| D1 | Screen 6 | Founder | 캘린더에서 확정된 슬롯의 Meet 링크 확인 | |
| D2 | (외부) | 양측 | Google Meet으로 미팅 진행 | 30분 |
| D3 | Screen 6 | System | 미팅 시간 경과 후 Slot 상태: completed | 자동 또는 수동 처리 |

#### Phase E: 취소 시나리오

| 시나리오 | 행위자 | 조건 | 결과 |
|----------|--------|------|------|
| 확정 전 요청 취소 | Founder (요청자) | Request 상태: pending | Request -> cancelled |
| 확정 후 취소 | Admin/Super Admin만 | Request 상태: approved | Request -> cancelled, Slot -> cancelled |
| 거절 | Host Mentor / Admin | Request 상태: pending | Request -> rejected |

### 권한 매트릭스

| 액션 | Super Admin | Admin | Mentor | Founder | Co-founder |
|------|:-----------:|:-----:|:------:|:-------:|:----------:|
| 슬롯 등록 | O | O | O | - | - |
| 슬롯 수정 (요청 없을 때) | O (전체) | O (전체) | O (본인) | - | - |
| 슬롯 삭제 (요청 없을 때) | O (전체) | O (전체) | O (본인) | - | - |
| 요청 제출 | - | - | - | O | O |
| 요청 취소 (확정 전) | O | O | - | O (본인) | O (본인) |
| 요청 취소 (확정 후) | O | O | - | - | - |
| 승인 | O (전체) | O (전체) | O (본인 슬롯) | - | - |
| 거절 | O (전체) | O (전체) | O (본인 슬롯) | - | - |

### 사후 조건 (Postconditions)

- Google Calendar에 미팅 이벤트 생성됨 (Mentor + Founder 초대)
- Google Meet 링크가 Calendar 이벤트에 포함됨
- 캘린더(Screen 6)에서 confirmed 상태로 표시
- 미팅 완료 후 completed 상태로 전환

### 에러 케이스

| 에러 | 발생 시점 | 처리 |
|------|----------|------|
| 과거 시간 슬롯 등록 시도 | A3 | 폼 유효성 검사 거부 |
| 이미 요청한 슬롯에 중복 요청 | B2 | "이미 요청한 슬롯입니다" 안내 |
| Google Calendar API 실패 | C4 | 승인은 유지, 수동 처리 안내 메시지 |
| Google Meet 링크 생성 실패 | C5 | 승인은 유지, Meet 링크 없이 진행 + Admin 알림 |
| 확정된 슬롯을 Founder가 취소 시도 | E | API 거부: "확정된 오피스아워는 Admin만 취소할 수 있습니다" |
| 요청이 있는 슬롯 수정/삭제 시도 | A | API 거부: "요청이 존재하는 슬롯은 수정/삭제할 수 없습니다" |

### 시간대 처리 상세

```
저장: UTC (모든 시간)
표시: PST 또는 KST (사용자 선택)

예시:
  Mentor가 KST 14:00 선택
  → DB 저장: 2024-03-15T05:00:00Z (UTC)
  → PST 표시: 2024-03-14 21:00 (PST)
  → KST 표시: 2024-03-15 14:00 (KST)
```

---

## Flow 3: 과제 제출 -> 피드백

### 개요

| 항목 | 내용 |
|------|------|
| **플로우 제목** | 과제 생성부터 피드백 완료까지의 전체 생명주기 |
| **설명** | Admin이 과제를 생성하면, Founder가 제출하고, Mentor/Admin이 피드백을 작성하는 플로우 |
| **주요 Actor** | Admin/Super Admin (과제 생성), Founder/Co-founder (제출), Mentor/Admin/Super Admin (피드백) |
| **관련 화면** | Screen 2, 11, 12, 13 |
| **관련 규칙** | BR 9 / PERM 2.6 |

### 사전 조건 (Preconditions)

- Active Batch 존재
- 과제 생성자: Admin 또는 Super Admin 역할
- 제출자: Founder 또는 Co-founder 역할

### 상태 머신

```
과제(Assignment) 생명주기:

  ┌──────────┐    제출물 존재     ┌───────────────┐
  │ 수정가능 │ ─────────────────>│ 수정/삭제 불가 │
  │ 삭제가능 │    (1개 이상)     │ (잠금 상태)    │
  └──────────┘                   └───────────────┘

제출(Submission) 상태:

  ┌──────────────┐   재제출   ┌──────────────┐
  │ 제출 완료    │ ────────>  │ 덮어쓰기     │
  │ (정시/지각)  │           │ (최신만 유지) │
  └──────────────┘           └──────────────┘

  지각 판정:
    submittedAt > dueDate (KST 23:59) → isLate = true
```

### 단계별 플로우

#### Phase A: 과제 생성 (Admin/Super Admin)

| 단계 | 화면 | 행위자 | 액션 | 상세 |
|------|------|--------|------|------|
| A1 | Screen 20 | Admin | Admin 대시보드에서 과제 관리 진입 | ROUTE `/admin/assignments` |
| A2 | - | Admin | "과제 생성" 클릭 | ROUTE `/admin/assignments/new` |
| A3 | - | Admin | 제목 입력 | 필수, 최대 200자 (BR 9.1) |
| A4 | - | Admin | 설명 입력 | 필수, 최대 5,000자 (BR 9.1) |
| A5 | - | Admin | 템플릿 링크 입력 (선택) | Google Docs URL |
| A6 | - | Admin | 마감일 설정 | KST 23:59 기준 (BR 13.1) |
| A7 | - | Admin | "과제 등록" 클릭 | Server Action: `createAssignment` |
| A8 | Screen 11 | System | 과제 목록에 새 과제 표시 | |

**분기점 - 과제 수정/삭제:**

```
해당 과제에 제출물이 존재하는가?
  ├── YES → 수정 불가, 삭제 불가 (잠금)
  └── NO  → 수정 가능, 삭제 가능 (Admin/Super Admin)
```

#### Phase B: 과제 확인 및 제출 (Founder/Co-founder)

| 단계 | 화면 | 행위자 | 액션 | 상세 |
|------|------|--------|------|------|
| B1 | Screen 2 | Founder | Dashboard에서 "마감 임박 과제" 확인 | |
| B2 | Screen 11 | Founder | 과제 목록에서 대상 과제 확인 | 마감일, 제출 여부 표시 |
| B3 | Screen 12 | Founder | 과제 상세 진입 | 제목, 설명, 템플릿 링크, 마감일 확인 |
| B4 | Screen 12 | Founder | 제출 폼에서 텍스트 또는 링크 입력 | 텍스트: 최대 5,000자, 링크: URL (BR 9.3) |
| B5 | Screen 12 | Founder | "제출" 클릭 | Server Action: `submitAssignment` |
| B6 | Screen 12 | System | 제출 완료 표시 | isLate 판정 포함 |

**분기점 - 마감 후 제출:**

```
현재 시간 > 마감일 (KST 23:59)?
  ├── YES → 제출 허용, isLate = true ("지각 제출" 표시)
  └── NO  → 정상 제출, isLate = false
```

**분기점 - 재제출:**

```
이미 제출한 과제인가?
  ├── YES → 기존 제출물 덮어쓰기 (최신 제출물만 유지)
  │         → isLate 재판정
  └── NO  → 신규 제출
```

**제출 유효성 검증:**

```
텍스트 OR 링크 중 최소 하나 필수:
  - content만 입력 → OK
  - linkUrl만 입력 → OK
  - 둘 다 입력 → OK
  - 둘 다 미입력 → 에러: "텍스트 또는 링크를 입력해주세요"
```

#### Phase C: 제출 현황 확인 (Admin/Mentor/Super Admin)

| 단계 | 화면 | 행위자 | 액션 | 상세 |
|------|------|--------|------|------|
| C1 | Screen 2 | Mentor | Dashboard에서 "피드백 대기 제출물" 확인 | |
| C2 | Screen 13 | Mentor | 제출 현황 대시보드 진입 | ROUTE `/submissions` |
| C3 | Screen 13 | Mentor | 과제별 제출 현황 확인 | 제출자, 제출 시간, isLate 여부, 피드백 여부 |
| C4 | Screen 13 | Mentor | 특정 제출물 상세 확인 | 제출 내용/링크 + 피드백 목록 |

#### Phase D: 피드백 작성 (Admin/Mentor/Super Admin)

| 단계 | 화면 | 행위자 | 액션 | 상세 |
|------|------|--------|------|------|
| D1 | Screen 13 | Mentor | 제출물 상세에서 "피드백 작성" 클릭 | |
| D2 | Screen 13 | Mentor | 피드백 내용 입력 | 텍스트만, 최대 3,000자 (BR 9.4) |
| D3 | Screen 13 | Mentor | "피드백 등록" 클릭 | Server Action: `createFeedback` |
| D4 | Screen 13 | System | 피드백 목록에 새 피드백 표시 | |

**복수 피드백:**

```
하나의 제출물에 대해:
  - Admin A → 피드백 작성 가능
  - Mentor B → 피드백 작성 가능
  - Mentor C → 피드백 작성 가능
  → 각 reviewer당 1개씩 복수 피드백 가능

피드백 수정:
  - 작성자 본인만 수정 가능
  - 삭제 불가
```

### 권한 매트릭스

| 액션 | Super Admin | Admin | Mentor | Founder | Co-founder |
|------|:-----------:|:-----:|:------:|:-------:|:----------:|
| 과제 생성 | O | O | - | - | - |
| 과제 수정 (제출물 없을 때) | O | O | - | - | - |
| 과제 삭제 (제출물 없을 때) | O | O | - | - | - |
| 과제 열람 | O | O | O | O | O |
| 과제 제출 | - | - | - | O | O |
| 재제출 (덮어쓰기) | - | - | - | O (본인) | O (본인) |
| 전체 제출 현황 조회 | O | O | O | - | - |
| 본인 제출물 열람 | O | O | O | O | O |
| 피드백 작성 | O | O | O | - | - |
| 피드백 수정 | O (본인) | O (본인) | O (본인) | - | - |

### 사후 조건 (Postconditions)

- 모든 Founder/Co-founder의 제출물에 피드백이 존재
- 제출 현황 대시보드에서 전체 현황 확인 가능
- 지각 제출은 isLate 플래그로 명확히 구분

### 에러 케이스

| 에러 | 발생 시점 | 처리 |
|------|----------|------|
| 텍스트/링크 모두 미입력 | B4 | 폼 유효성 검사: "텍스트 또는 링크를 입력해주세요" |
| 텍스트 5,000자 초과 | B4 | 인라인 에러: 글자 수 카운터 + 초과 경고 |
| 잘못된 URL 형식 | B4 | 인라인 에러: "올바른 URL을 입력해주세요" |
| 제출물 있는 과제 수정 시도 | A | API 거부: "제출물이 존재하여 수정할 수 없습니다" |
| 제출물 있는 과제 삭제 시도 | A | API 거부: "제출물이 존재하여 삭제할 수 없습니다" |
| 피드백 3,000자 초과 | D2 | 인라인 에러: 글자 수 카운터 + 초과 경고 |
| 타인의 피드백 수정 시도 | D | API 거부: "본인의 피드백만 수정할 수 있습니다" |

---

## Flow 4: Admin 배치/사용자 관리

### 개요

| 항목 | 내용 |
|------|------|
| **플로우 제목** | 배치 생성 -> 사용자 초대 -> LinkedIn 가입 -> 역할 배정 전체 플로우 |
| **설명** | Admin이 새 배치를 생성하고, 이메일로 사용자를 초대하며, 초대받은 사용자가 LinkedIn으로 가입하는 플로우 |
| **주요 Actor** | Admin/Super Admin (배치 생성, 사용자 초대), 초대받은 사용자 (LinkedIn 가입) |
| **관련 화면** | Screen 1, 2, 20, 21 |
| **관련 규칙** | BR 1, 11 / PERM 2.1, 2.2 |

### 사전 조건 (Preconditions)

- Admin 또는 Super Admin 역할로 인증 완료
- 이메일 발송 서비스 설정 완료
- LinkedIn OIDC 연동 설정 완료

### 상태 머신

```
Batch 상태:
  ┌────────┐    Archive     ┌──────────┐
  │ Active │ ──────────────>│ Archived │
  └────────┘                └──────────┘
       │                         │
       │ 모든 기능 사용 가능     │ Read-only (열람만)
       │ 삭제 불가               │ 재활성화 불가
       │                         │ 삭제 불가

Invite(초대) 상태:
  ┌─────────┐    7일 경과     ┌─────────┐
  │ invited │ ──────────────> │ expired │
  └────┬────┘                 └─────────┘
       │
       ├──────────────────────┐
       │                      │
       ▼                      ▼
  ┌──────────┐          ┌───────────┐
  │ accepted │          │ cancelled │
  │ (가입됨) │          │ (취소됨)  │
  └──────────┘          └───────────┘

User Batch Membership:
  ┌────────┐
  │ active │
  └────────┘
  (역할 변경 불가, 탈퇴/제거만 가능)
```

### 단계별 플로우

#### Phase A: 배치 생성 (Admin/Super Admin)

| 단계 | 화면 | 행위자 | 액션 | 상세 |
|------|------|--------|------|------|
| A1 | Screen 20 | Admin | Admin 대시보드 -> Batch 관리 진입 | ROUTE `/admin/batches` |
| A2 | Screen 20 | Admin | "새 배치 생성" 클릭 | ROUTE `/admin/batches/new` |
| A3 | Screen 20 | Admin | 배치명 입력 | 최대 100자, 중복 허용 (BR 1.1) |
| A4 | Screen 20 | Admin | 설명 입력 (선택) | 최대 500자 |
| A5 | Screen 20 | Admin | 시작일/종료일 설정 | |
| A6 | Screen 20 | Admin | "배치 생성" 클릭 | Server Action: `createBatch` |
| A7 | Screen 20 | System | 배치 목록에 새 배치 표시 (Active) | |

**주요 제약 사항:**

```
- 동시 Active Batch: 여러 기수 가능 (제한 없음) (BR 1.1)
- 배치 삭제: 불가 (잘못 생성 시 DB 직접 처리) (BR 1.3)
- Archived -> Active: 불가 (재활성화 불가) (BR 1.3)
```

#### Phase B: 사용자 초대 (Admin/Super Admin)

| 단계 | 화면 | 행위자 | 액션 | 상세 |
|------|------|--------|------|------|
| B1 | Screen 21 | Admin | 사용자 관리 진입 | ROUTE `/admin/users` |
| B2 | Screen 21 | Admin | "사용자 초대" 클릭 | ROUTE `/admin/users/invite` |
| B3 | Screen 21 | Admin | 이메일 주소 입력 | 초대 대상의 이메일 |
| B4 | Screen 21 | Admin | 역할 선택 | Founder / Co-founder / Mentor / Admin 중 택 1 |
| B5 | Screen 21 | Admin | 배치 선택 | 어떤 Active Batch에 초대할지 |
| B6 | Screen 21 | Admin | "초대 발송" 클릭 | Server Action: `inviteUser` |
| B7 | - | System | 초대 이메일 발송 | 초대 링크 포함 (유효기간 7일) |
| B8 | Screen 21 | System | 사용자 목록에 "초대 대기" 상태 표시 | |

**분기점 - 초대 검증:**

```
중복 초대 검사:
  동일 이메일로 이미 초대했는가?
  ├── YES → 에러: "이미 초대된 이메일입니다"
  └── NO  → 진행

인원 제한 검사 (역할이 Founder인 경우):
  해당 배치의 Founder 수 < 30?
  ├── YES → 진행
  └── NO  → 에러: "기수당 Founder는 최대 30명입니다"

인원 제한 검사 (역할이 Co-founder인 경우):
  해당 Founder의 Co-founder 수 < 3?
  ├── YES → 진행
  └── NO  → 에러: "Founder당 Co-founder는 최대 3명입니다"

재참여 검사 (Founder/Co-founder):
  해당 사용자가 다른 배치에 Founder/Co-founder로 참여 중인가?
  ├── YES → 에러: "이미 다른 기수에 참여 중입니다 (1인 1기수 원칙)"
  └── NO  → 진행

재참여 검사 (Mentor/Admin/Super Admin):
  → 복수 배치 참여 허용, 검사 불필요
```

#### Phase C: 초대 수락 및 LinkedIn 가입 (초대받은 사용자)

| 단계 | 화면 | 행위자 | 액션 | 상세 |
|------|------|--------|------|------|
| C1 | (이메일) | 사용자 | 초대 이메일의 가입 링크 클릭 | `/invite/[token]` |
| C2 | Screen 1 | 사용자 | "LinkedIn으로 로그인" 클릭 | LinkedIn OIDC 시작 |
| C3 | (LinkedIn) | 사용자 | LinkedIn 계정으로 인증 | |
| C4 | - | System | LinkedIn에서 프로필 정보 수신 | name, email, profile_photo |
| C5 | - | System | 이메일 매칭 검증 | LinkedIn 이메일 = 초대 이메일? |
| C6 | - | System | 사용자 계정 생성 + 배치 매핑 | |
| C7 | Screen 2 | System | Dashboard로 리다이렉트 | |

**분기점 - 이메일 매칭:**

```
LinkedIn 계정 이메일 == 초대 이메일?
  ├── MATCH  → 자동 매핑, 가입 완료
  └── MISMATCH → 초대 이메일은 알림용
               → LinkedIn 계정 이메일 기준으로 매칭 (BR 11.4)
               → LinkedIn ID 기준으로 중복 참여 검증
```

**LinkedIn 프로필 정보 처리:**

```
LinkedIn OIDC로 받는 정보:
  - name (이름)          → 자동 설정
  - email (이메일)       → 자동 설정
  - profile_photo (사진) → 자동 설정

수동 입력 필요 (LinkedIn에서 제공하지 않음):
  - job_title (직책)     → 프로필 설정에서 직접 입력
  - company (회사명)     → 프로필 설정에서 직접 입력
  - bio (자기소개)       → 프로필 설정에서 직접 입력
```

#### Phase D: 초대 만료 및 재발송

| 단계 | 화면 | 행위자 | 액션 | 상세 |
|------|------|--------|------|------|
| D1 | - | System | 초대 발송 후 7일 경과 | 초대 상태: expired |
| D2 | Screen 21 | Admin | 만료된 초대 확인 | "만료" 상태 표시 |
| D3 | Screen 21 | Admin | "재발송" 클릭 | 새 초대 생성 (동일 이메일 + 역할) |

#### Phase E: 배치 종료 (Archive)

| 단계 | 화면 | 행위자 | 액션 | 상세 |
|------|------|--------|------|------|
| E1 | Screen 20 | Admin | 배치 상세에서 "배치 종료" 클릭 | |
| E2 | Screen 20 | Admin | 확인 대화상자에서 "종료" 확인 | 되돌릴 수 없음 경고 |
| E3 | Screen 20 | System | 배치 상태: Active -> Archived | |
| E4 | - | System | 해당 배치의 모든 기능 Read-only 전환 | |

### 권한 매트릭스

| 액션 | Super Admin | Admin | Mentor | Founder | Co-founder |
|------|:-----------:|:-----:|:------:|:-------:|:----------:|
| 배치 생성 | O | O | - | - | - |
| 배치 수정 | O | O | - | - | - |
| 배치 종료 (Archive) | O | O | - | - | - |
| 배치 열람 (Active) | O | O | O | O | O |
| 배치 열람 (Archived) | O | O | O (참여자) | O (참여자) | O (참여자) |
| 사용자 초대 | O | O | - | - | - |
| 초대 취소 | O | O | - | - | - |
| 사용자 목록 조회 | O | O | O | O | O |

### 사후 조건 (Postconditions)

- 배치가 생성되어 Active 상태
- 초대된 사용자가 LinkedIn으로 가입 완료
- 역할이 정확히 배정됨
- Founder 30명 + Co-founder 90명 이내 인원 제한 준수

### 에러 케이스

| 에러 | 발생 시점 | 처리 |
|------|----------|------|
| 배치명 미입력 | A3 | 폼 유효성 검사 실패 |
| 중복 이메일 초대 | B3 | "이미 초대된 이메일입니다" |
| Founder 30명 초과 | B4 | "기수당 Founder는 최대 30명입니다" |
| Co-founder 3명 초과 | B4 | "Founder당 Co-founder는 최대 3명입니다" |
| 1인 1기수 위반 (Founder/Co-founder) | B6 | "이미 다른 기수에 참여 중입니다" |
| 초대 만료 (7일) | C1 | "초대가 만료되었습니다. 관리자에게 재발송을 요청해주세요" |
| LinkedIn 인증 실패 | C3 | LinkedIn 에러 페이지 -> 재시도 안내 |
| 같은 배치 내 역할 변경 시도 | - | API 거부: "같은 배치 내 역할 변경은 불가합니다" (BR 11.4) |
| 배치 재활성화 시도 | - | API 거부: "종료된 배치는 재활성화할 수 없습니다" |
| 배치 삭제 시도 | - | 기능 미제공 (DB 직접 처리만 가능) |

---

## Flow 5: 그룹 생성 -> 그룹 피드

### 개요

| 항목 | 내용 |
|------|------|
| **플로우 제목** | 그룹 생성부터 그룹 내 피드 활동까지 |
| **설명** | Admin이 그룹을 생성하고 멤버를 추가하면, 그룹 멤버들이 전용 피드에서 소통하는 플로우 |
| **주요 Actor** | Admin/Super Admin (그룹 생성/관리), 그룹 멤버 전체 (피드 활동) |
| **관련 화면** | Screen 17, 18, 19 |
| **관련 규칙** | BR 7, 10 / PERM 2.9 |

### 사전 조건 (Preconditions)

- Active Batch 존재
- 그룹 생성자: Admin 또는 Super Admin 역할
- 그룹에 추가할 멤버가 해당 배치에 소속되어 있음

### 상태 머신

```
그룹(Group) 생명주기:

  ┌────────┐    삭제 (Admin)    ┌─────────┐
  │ Active │ ──────────────────>│ Deleted │
  └───┬────┘                    └─────────┘
      │
      │ 멤버 추가/제거 가능
      │ 그룹 피드 활성화
      │ 그룹 정보 수정 가능

그룹 피드 = 메인 피드와 동일한 기능:
  - 게시글: 작성/수정(본인)/삭제(본인)
  - 댓글: 작성/수정(본인)/삭제(본인), 대댓글 2단계
  - 좋아요: 토글 방식
  - 접근: 그룹 구성원만
```

### 단계별 플로우

#### Phase A: 그룹 생성 (Admin/Super Admin)

| 단계 | 화면 | 행위자 | 액션 | 상세 |
|------|------|--------|------|------|
| A1 | Screen 19 | Admin | Admin 대시보드 -> 그룹 관리 진입 | ROUTE `/admin/groups` |
| A2 | Screen 19 | Admin | "그룹 생성" 클릭 | ROUTE `/groups/new` |
| A3 | Screen 19 | Admin | 그룹명 입력 | 최대 100자 (BR 7.1) |
| A4 | Screen 19 | Admin | 설명 입력 (선택) | 최대 500자 (BR 7.1) |
| A5 | Screen 19 | Admin | "그룹 생성" 클릭 | Server Action: `createGroup` |
| A6 | Screen 19 | System | 그룹 생성 완료 | |

#### Phase B: 멤버 추가 (Admin/Super Admin)

| 단계 | 화면 | 행위자 | 액션 | 상세 |
|------|------|--------|------|------|
| B1 | Screen 19 | Admin | 생성된 그룹의 관리 페이지 진입 | |
| B2 | Screen 19 | Admin | "멤버 추가" 클릭 | |
| B3 | Screen 19 | Admin | 배치 내 사용자 목록에서 멤버 선택 | 체크박스 또는 검색으로 선택 |
| B4 | Screen 19 | Admin | "추가" 클릭 | Server Action: `addGroupMember` |
| B5 | Screen 19 | System | 멤버 목록에 추가된 사용자 표시 | |

**추가 가능 대상:**

```
배치 내 모든 역할의 사용자:
  - Super Admin (해당 배치)
  - Admin (해당 배치)
  - Mentor
  - Founder
  - Co-founder

→ 역할 무관하게 배치 멤버면 그룹에 추가 가능
```

#### Phase C: 그룹 확인 (그룹 멤버)

| 단계 | 화면 | 행위자 | 액션 | 상세 |
|------|------|--------|------|------|
| C1 | Screen 17 | 멤버 | 그룹 리스트에서 소속 그룹 확인 | ROUTE `/groups` |
| C2 | Screen 17 | 멤버 | 그룹 카드 또는 리스트 항목 표시 | 그룹명, 설명, 멤버 수 |
| C3 | Screen 18 | 멤버 | 그룹 클릭 -> 그룹 상세 진입 | ROUTE `/groups/[id]` |

**분기점 - 접근 권한:**

```
요청한 사용자가 해당 그룹의 구성원인가?
  ├── YES → 그룹 상세 페이지 표시 (Screen 18)
  └── NO  → 접근 거부 → /dashboard 리다이렉트
            (Admin/Super Admin도 구성원이 아니면 접근 불가)
```

> **참고**: `10_PERMISSIONS.md`에서 Admin/Super Admin은 requireGroupMembership에서 예외 처리되어 있으나, 그룹 피드 열람/작성은 구성원만 가능으로 정의됨 (PERM 2.9). 구현 시 정책 확인 필요.

#### Phase D: 그룹 피드 활동 (그룹 멤버)

| 단계 | 화면 | 행위자 | 액션 | 상세 |
|------|------|--------|------|------|
| D1 | Screen 18 | 멤버 | 그룹 상세에서 피드 확인 | 그룹 전용 게시글 목록 |
| D2 | Screen 18 | 멤버 | "글쓰기" 클릭 | |
| D3 | Screen 18 | 멤버 | 게시글 작성 | 내용: 최대 3,000자, 이미지: 최대 5장 (BR 10.1) |
| D4 | Screen 18 | 멤버 | "게시" 클릭 | Server Action: `createGroupPost` |
| D5 | Screen 18 | System | 그룹 피드에 새 게시글 표시 | |

**댓글 작성:**

| 단계 | 화면 | 행위자 | 액션 | 상세 |
|------|------|--------|------|------|
| D6 | Screen 18 | 멤버 | 게시글의 "댓글" 영역에 내용 입력 | 최대 1,000자 (BR 10.2) |
| D7 | Screen 18 | 멤버 | "댓글 등록" 클릭 | |
| D8 | Screen 18 | 멤버 | 대댓글 작성 (선택) | 2단계까지만 (댓글 -> 대댓글) (BR 10.2) |

**좋아요:**

| 단계 | 화면 | 행위자 | 액션 | 상세 |
|------|------|--------|------|------|
| D9 | Screen 18 | 멤버 | 게시글/댓글의 좋아요 버튼 클릭 | 토글 방식 (BR 10.3) |
| D10 | Screen 18 | System | 좋아요 수 업데이트 | 재클릭 시 취소 |

**그룹 피드 vs 메인 피드 비교:**

| 기능 | 메인 피드 (Screen 14) | 그룹 피드 (Screen 18) |
|------|---------------------|---------------------|
| 접근 권한 | 배치 내 전체 | 그룹 구성원만 |
| 게시글 작성 | 전체 역할 | 그룹 구성원만 |
| 댓글 (2단계) | O | O |
| 좋아요 (토글) | O | O |
| 공지 고정 | O (Admin) | - (그룹에는 미적용) |
| 게시글 비공개 | O (Admin) | - (그룹에는 미적용) |
| 이미지 첨부 | O (최대 5장, 각 5MB) | O (동일) |

#### Phase E: 그룹 관리 (Admin/Super Admin)

| 단계 | 화면 | 행위자 | 액션 | 상세 |
|------|------|--------|------|------|
| E1 | Screen 19 | Admin | 그룹 관리에서 멤버 제거 | Server Action: `removeGroupMember` |
| E2 | Screen 19 | Admin | 그룹 삭제 | Server Action: `deleteGroup` |
| E3 | - | System | 그룹 및 그룹 내 모든 피드 데이터 처리 | |

**멤버 제거 결과:**

```
멤버 제거 시:
  - 해당 사용자의 그룹 접근 권한 즉시 박탈
  - 기존 게시글/댓글은 유지 (삭제되지 않음)
  - 그룹 리스트(Screen 17)에서 해당 그룹 미표시
```

### 권한 매트릭스

| 액션 | Super Admin | Admin | Mentor | Founder | Co-founder |
|------|:-----------:|:-----:|:------:|:-------:|:----------:|
| 그룹 생성 | O | O | - | - | - |
| 그룹 수정 | O | O | - | - | - |
| 그룹 삭제 | O | O | - | - | - |
| 멤버 추가 | O | O | - | - | - |
| 멤버 제거 | O | O | - | - | - |
| 그룹 피드 열람 | 구성원만 | 구성원만 | 구성원만 | 구성원만 | 구성원만 |
| 그룹 피드 작성 | 구성원만 | 구성원만 | 구성원만 | 구성원만 | 구성원만 |
| 그룹 댓글 작성 | 구성원만 | 구성원만 | 구성원만 | 구성원만 | 구성원만 |
| 좋아요 | 구성원만 | 구성원만 | 구성원만 | 구성원만 | 구성원만 |

### 사후 조건 (Postconditions)

- 그룹이 생성되어 멤버가 배정됨
- 그룹 멤버만 해당 그룹 피드에 접근 가능
- 그룹 피드에서 게시글/댓글/좋아요 활동 가능
- 비멤버는 그룹 존재 자체를 그룹 리스트에서 볼 수 없음

### 에러 케이스

| 에러 | 발생 시점 | 처리 |
|------|----------|------|
| 그룹명 미입력 | A3 | 폼 유효성 검사 실패 |
| 그룹명 100자 초과 | A3 | 인라인 에러 + 글자 수 카운터 |
| 비멤버 그룹 접근 시도 | C3 | 접근 거부 -> /dashboard 리다이렉트 |
| 비멤버 그룹 피드 작성 시도 | D4 | API 거부: "그룹 구성원만 게시글을 작성할 수 있습니다" |
| 3단계 대댓글 시도 | D8 | API 거부: "2단계까지만 댓글을 작성할 수 있습니다" |
| 게시글 3,000자 초과 | D3 | 인라인 에러 + 글자 수 카운터 |
| 이미지 5MB 초과 | D3 | 클라이언트 측 검증: "이미지는 5MB 이하만 업로드 가능합니다" |
| 이미지 5장 초과 | D3 | 추가 업로드 버튼 비활성화 |
| 삭제된 그룹 접근 시도 | C3 | 404 페이지 표시 |

---

## 플로우 간 관계도

```
Flow 4: 배치/사용자 관리
   │
   │ (배치 생성 + 사용자 초대 → 배치 운영 시작)
   │
   ├──> Flow 1: 질문 → 답변 → 요약
   │      (Founder가 질문, Mentor가 답변, Admin이 요약)
   │
   ├──> Flow 2: 오피스아워 → Google Meet
   │      (Mentor가 슬롯 등록, Founder가 요청, 승인 → Meet)
   │
   ├──> Flow 3: 과제 → 피드백
   │      (Admin이 과제 생성, Founder가 제출, Mentor가 피드백)
   │
   └──> Flow 5: 그룹 → 그룹 피드
          (Admin이 그룹 생성, 멤버가 피드 활동)
```

### 공통 진입점: Dashboard (Screen 2)

| 역할 | Dashboard에서 접근 가능한 플로우 |
|------|--------------------------------|
| **Founder/Co-founder** | 내 질문 현황 (Flow 1), 다가오는 오피스아워 (Flow 2), 과제 마감 (Flow 3), 그룹 피드 (Flow 5) |
| **Mentor** | 답변 대기 질문 (Flow 1), 내 오피스아워 요청 (Flow 2), 피드백 대기 제출물 (Flow 3) |
| **Admin/Super Admin** | 전체 현황 요약, Batch 관리 (Flow 4), 빠른 관리 링크 (모든 Flow) |

---

**문서 끝**
