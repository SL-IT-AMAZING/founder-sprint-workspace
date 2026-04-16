# Founder / Co-founder 회사 이탈 + 새 회사 요청 + 내부 알림 상세 구현 플랜

## 목표
Founder / Co-founder를 지금 당장 통합하지 않고, 아래 문제를 실제로 해결한다.

1. Founder / Co-founder가 **현재 회사에서 나갈 수 있게 한다**
2. 회사가 없거나 새 회사가 필요할 때 **새 회사 생성 요청을 할 수 있게 한다**
3. 요청이 생성되면 **관리자 내부 알림(Notification)** 이 생기게 한다
4. 관리자는 **요청 목록 화면**에서 승인 / 반려 / 팀 구조 재정리를 할 수 있게 한다
5. Founder가 나갈 때 co-founder가 남는 경우를 안전하게 처리한다

---

## 제품 결정 (고정)

### 1. Founder / Co-founder는 유지
- 현재는 role 통합 안 함
- 데이터 구조 변경을 최소화함

### 2. 회사 이탈은 기본적으로 사용자 요청 액션
- 자유롭게 시작할 수 있음
- 단, **대표 founder가 나가고 co-founder가 남는 경우는 자동 처리 금지**

### 3. 새 회사 생성은 관리자 승인 필요
- 사용자는 요청만 생성
- 실제 회사 생성은 admin/super_admin 승인 후 처리

### 4. Notification은 이메일보다 우선
- 우선은 내부 Notification + 관리자 요청 목록 화면
- 필요하면 나중에 이메일 보강

### 5. Push는 승인 전 금지
- 구현/검증은 진행 가능
- **git push / deploy는 사용자 승인 전 금지**

---

## 구현 단위

## Phase 1. 데이터 모델

### 1-1. 새 Prisma 모델 추가
추가 모델: `CompanyChangeRequest`

필드(권장):
- `id`
- `userId`
- `batchId`
- `currentCompanyId`
- `targetType` (`leave_company` | `new_company`)
- `requestedCompanyName`
- `requestedDescription`
- `hasDependentCoFounders`
- `resolutionType` (`promote_one` | `convert_all` | `manual_review`)
- `promotedUserId`
- `note`
- `status` (`pending` | `approved` | `rejected` | `cancelled`)
- `reviewedById`
- `reviewedAt`
- `createdAt`

### 1-2. 최소 relation / index
- user relation
- batch relation (optional)
- currentCompany relation (optional)
- reviewedBy relation (optional)
- index: `userId`, `status`, `batchId`

### 1-3. 성공 기준
- migration 생성 가능
- request row 하나로 모든 요청 상태 추적 가능

---

## Phase 2. 서버 액션

### 2-1. 사용자용 액션
#### `createCompanyLeaveRequest()`
입력:
- currentCompanyId
- batchId(optional)
- note(optional)

처리:
- 현재 user 확인
- user가 실제 current company member인지 검증
- founder leaves with co-founders 여부 계산
- request row 생성
- admin 대상 notification 생성

#### `createNewCompanyRequest()`
입력:
- requestedCompanyName
- requestedDescription(optional)
- batchId(optional)
- note(optional)

처리:
- 현재 user 확인
- request row 생성
- admin 대상 notification 생성

### 2-2. 관리자용 액션
#### `approveCompanyChangeRequest(requestId, resolution?)`
처리 분기:
- `leave_company`
  - 일반 케이스: `CompanyMember.isCurrent = false`, `User.company` sync
  - co-founder 케이스: founder 전환
  - founder leaves with co-founders: resolutionType에 따라 처리
- `new_company`
  - `Company` 생성
  - `CompanyBatch` 생성
  - `CompanyMember` 생성
  - `User.company` sync

그리고 마지막에:
- request status → approved
- requester 대상 notification 생성

#### `rejectCompanyChangeRequest(requestId, reason?)`
- request status → rejected
- requester 대상 notification 생성

#### `cancelCompanyChangeRequest(requestId)`
- 본인이 pending request 취소 가능
- status → cancelled

### 2-3. 성공 기준
- 각 액션이 role/ownership 검증을 함
- admin notification / requester notification이 생성됨
- 승인 시 실제 DB 상태가 바뀜

---

## Phase 3. 사용자 UI

### 3-1. 위치
`Settings / Profile` 안의 Company 섹션

### 3-2. 회사가 있는 사용자
보여줄 것:
- 현재 회사명
- `Leave current company`
- `Request new company`
- 현재 pending request 상태 (있을 때)

### 3-3. 회사가 없는 사용자
보여줄 것:
- `No company assigned`
- `Request new company`
- 현재 pending request 상태 (있을 때)

### 3-4. founder가 나갈 때 주의 UI
Founder이며 dependent co-founder가 있으면:
- 경고 문구 표시
- “이 요청은 관리자 검토가 필요합니다” 표시
- 사용자는 직접 resolution 선택 안 함 (단순화)

### 3-5. 성공 기준
- Founder / Co-founder가 요청 생성 가능
- 현재 요청 상태를 다시 볼 수 있음
- 회사 없는 사람도 자연스럽게 진입 가능

---

## Phase 4. 관리자 UI

### 4-1. 위치
1순위: `Admin → Users`
2순위: `Admin → Companies`

### 4-2. 화면 구성
`Pending company requests` 섹션

컬럼:
- Request type
- Requester
- Current company
- Requested company name
- Status
- Created at
- Note

### 4-3. founder leaves with co-founders 처리 UI
이 요청이면 추가 제어 표시:
- `Promote one co-founder`
- `Convert all co-founders to founders`
- `Keep for manual review`

co-founder 목록을 보여주고,
- 한 명 승격 선택 시 `promotedUserId` 지정 가능

### 4-4. 성공 기준
- 관리자가 pending 요청을 한 화면에서 처리 가능
- founder departure edge case도 같은 화면에서 해결 가능

---

## Phase 5. Notification 설계

## admin 대상 notification
### type
- `company_request_new`
- `company_request_leave`
- `company_request_founder_restructure`

### 생성 시점
- 사용자 요청 생성 직후

### title 예시
- `New company request`
- `Company leave request`
- `Founder departure needs review`

### message 예시
- `{name} requested a new company`
- `{name} requested to leave {company}`
- `{name} is leaving, but co-founders remain`

## requester 대상 notification
### type
- `company_request_approved`
- `company_request_rejected`

### 생성 시점
- admin 승인/반려 직후

### title 예시
- `Company request approved`
- `Company request rejected`

### 성공 기준
- admin은 요청을 놓치지 않음
- requester는 결과를 확인 가능

---

## Phase 6. founder / co-founder edge case 세부 규칙

### Case A. co-founder 이탈
- 회사 이탈 요청 생성
- 승인 시:
  - company membership 종료
  - `UserBatch.role = founder`
  - `founderId = null`

### Case B. founder 이탈, co-founder 없음
- 자유 이탈 가능
- 승인 시 단순 처리

### Case C. founder 이탈, co-founder 남음
자동 승인 금지.
관리자 선택 필요:
1. 한 명 승격 (`resolutionType = promote_one`)
2. 전원 founder 전환 (`resolutionType = convert_all`)
3. review 상태 유지 (`resolutionType = manual_review`)

### 추천 기본 처리
- founder leaves with dependents는 **무조건 pending + review required**

---

## Phase 7. QA 계획

### QA 1. 회사 없는 founder의 새 회사 요청
**도구**: Playwright + DB 확인
1. 회사 없는 founder 로그인
2. Settings/Profile에서 `Request new company`
3. 요청 생성
4. request row 확인
5. admin notification 확인

### QA 2. co-founder 회사 이탈
**도구**: Playwright + DB 확인
1. co-founder 로그인
2. `Leave current company`
3. admin 승인
4. DB 확인:
   - `CompanyMember.isCurrent = false`
   - `UserBatch.role = founder`
   - `founderId = null`

### QA 3. founder 이탈 + co-founder 2명 존재
**도구**: Playwright + DB 확인
1. founder 1, co-founder 2 상태 준비
2. founder 요청 생성
3. admin 화면에서 review-required 확인
4. promote_one / convert_all 각각 테스트
5. DB 관계 재정리 확인

### QA 4. 새 회사 요청 승인
**도구**: Playwright + DB 확인
1. request 생성
2. admin 승인
3. DB 확인:
   - `Company`
   - `CompanyBatch`
   - `CompanyMember`
   - `User.company`
   - requester notification

### QA 5. 회귀 검증
**도구**: Playwright + DB 확인
- founder 질문 작성
- co-founder 질문 작성
- assignment 대상 계산
- reminder 대상 계산
- office hour 대상 인식
- 전환 후에도 founder 기능 유지

---

## 구현/검증 순서
1. Prisma model + migration
2. server actions
3. user UI
4. admin UI
5. notification wiring
6. founder departure edge case logic
7. Playwright + DB verification

---

## Push 정책
- 구현/검증은 가능
- **push는 사용자 승인 후에만 진행**

---

## 최종 판단
이 플랜은 현재 FounderSprint 구조를 유지하면서도,
- 회사 이탈
- 새 회사 생성 요청
- founder / co-founder 전환
- admin 내부 알림
을 가장 안전하게 추가하는 방법입니다.

> 지금 당장은 역할 통합보다, **요청 + 내부 알림 + 승인 흐름**을 먼저 넣는 것이 맞습니다.
