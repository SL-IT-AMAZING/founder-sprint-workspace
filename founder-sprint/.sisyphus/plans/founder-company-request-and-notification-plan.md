# Founder Company Request + Internal Notification Plan

## 목표
Founder / Co-founder가 회사 상태를 스스로 정리할 수 있게 하되, 운영상 중요한 변경은 관리자 화면과 내부 알림으로 안전하게 처리한다.

핵심 범위:
1. 회사 이탈(leave current company)
2. 새 회사 생성 요청(request new company)
3. founder / co-founder 전환 및 founder 이탈 edge case
4. admin 내부 알림 + 처리 목록

---

## 왜 이 방향이 맞나

현재 구조를 보면:
- `company`는 Profile에서 직접 수정하지 못하고 `CompanyMember`에서 동기화됨
- `Notification` 모델은 이미 있고 assignment / office hour / onboarding / reminder에 사용 중
- founder / co_founder는 권한은 거의 같지만, `UserBatch.founderId` 때문에 데이터 구조는 다름

즉,
> 역할을 지금 바로 합치기보다, 회사 상태 변경 요청과 내부 알림/승인 흐름을 추가하는 것이 가장 안전하다.

---

## 제품 방향

### 1. 회사 이탈은 기본적으로 사용자 자유 액션
- founder / co-founder 모두 회사 이탈을 요청할 수 있음
- 단, **대표 founder가 나갈 때 co-founder가 남아 있으면 자동 처리 금지**
- 그 경우는 관리자 검토 또는 명시적 전환 선택 필요

### 2. 새 회사 생성은 관리자 승인 흐름
- 사용자가 “새 회사가 필요함” 요청 생성
- 관리자가 승인 시 회사 생성 + batch 연결 + membership 연결

### 3. 내부 알림 우선
- Peter 이메일보다 먼저 **내부 Notification + 관리자 요청 목록**을 중심으로 설계
- 이메일은 나중에 선택적으로 추가 가능

---

## 데이터 모델

### 새 모델 제안
```prisma
model CompanyChangeRequest {
  id                     String   @id @default(uuid()) @db.Uuid
  userId                 String   @map("user_id") @db.Uuid
  batchId                String?  @map("batch_id") @db.Uuid
  currentCompanyId       String?  @map("current_company_id") @db.Uuid
  targetType             String   @map("target_type") // leave_company | new_company
  requestedCompanyName   String?  @map("requested_company_name")
  requestedDescription   String?  @map("requested_description")
  hasDependentCoFounders Boolean  @default(false) @map("has_dependent_co_founders")
  resolutionType         String?  @map("resolution_type") // promote_one | convert_all | manual_review
  promotedUserId         String?  @map("promoted_user_id") @db.Uuid
  note                   String?
  status                 String   @default("pending") // pending | approved | rejected | cancelled
  reviewedById           String?  @map("reviewed_by_id") @db.Uuid
  reviewedAt             DateTime? @map("reviewed_at")
  createdAt              DateTime @default(now()) @map("created_at")
}
```

### 기존 모델과의 연결
- `CompanyMember.isCurrent` → 현재 소속 여부 변경
- `User.company` → 회사명 sync
- `UserBatch.role`, `UserBatch.founderId` → founder/co-founder 전환 반영
- `CompanyBatch` → 새 회사가 현재 batch 맥락에 보이도록 연결
- `Notification` → admin/user에게 내부 알림 생성

---

## 사용자 진입점

### 추천 위치
**Settings / Profile 의 Company 섹션**

이유:
- 현재도 회사는 여기서 보이지만 직접 수정은 안 됨
- “내 회사 상태를 바꾸고 싶다”는 요구와 가장 가까움

### 사용자 액션
상태별 노출:

#### 회사가 있는 founder/co-founder
- `Leave current company`
- `Request new company`

#### 회사가 없는 founder/co-founder
- `Request new company`

### UI 문구
- `Leave current company`
- `Request new company`
- `This request will be reviewed by the admin team.`

---

## 관리자 진입점

### 추천 위치
1. `Admin → Users` 안의 요청 섹션
또는
2. `Admin → Companies` 안의 요청 섹션

### 관리자 화면에서 필요한 것
- Pending / Approved / Rejected 필터
- 요청자
- 현재 회사
- 요청 유형
- 요청 메모
- 승인 / 반려 버튼
- founder가 떠날 때 co-founder 처리 옵션

---

## founder 이탈 edge case

### 중요 규칙
대표 founder가 나갈 때, 연결된 co-founder가 남아 있으면 단순 승인 금지.

### 처리 방식
#### Case A. founder만 나가고 co-founder 없음
- 자유 이탈 가능
- `CompanyMember.isCurrent = false`
- `User.company` 재계산

#### Case B. founder가 나가고 co-founder가 1명 이상 남음
자동 승인 금지.
관리자가 아래 중 하나 선택:
1. co-founder 한 명을 founder로 승격
2. 남은 co-founder 전원을 founder로 전환
3. manual review 유지

#### 추천 기본값
- **manual review** 기본
- 운영자가 명시적으로 결정하게 함

---

## 내부 Notification 설계

### 왜 notification이 필요한가
현재 `Notification`은 이미 의미 있는 상태 변화에 쓰이고 있음.
새 회사 관련 요청도 같은 철학으로 넣는 게 맞음.

### 관리자 대상 notification
#### type 제안
- `company_request_new`
- `company_request_leave`
- `company_request_founder_restructure`

#### title 예시
- `New company request`
- `Company leave request`
- `Founder departure needs review`

#### message 예시
- `{name} requested a new company`
- `{name} requested to leave {company}`
- `{name} is leaving, but 2 co-founders remain`

### 요청자 대상 notification
#### type 제안
- `company_request_approved`
- `company_request_rejected`

#### title 예시
- `Company request approved`
- `Company request rejected`

---

## 무엇을 notification에 넣을까

### 반드시 넣기
- 새 회사 생성 요청
- 회사 이탈 요청
- founder departure with co-founders review needed
- 요청 승인/반려 결과

### 넣지 않는 것이 좋은 것
- 단순 저장 성공
- 단순 프로필 수정 성공
- 운영 로그 수준의 내부 처리 메시지

즉,
> notification은 "행동 필요" 또는 "중요 상태 변화"만 담당하게 한다.

---

## 구현 순서

### Phase 1. 데이터 모델
- `CompanyChangeRequest` 추가
- migration 작성

### Phase 2. 서버 액션
- create request
- approve request
- reject request
- founder departure resolution handler

### Phase 3. 사용자 UI
- Settings/Profile Company 섹션에 버튼 추가
- 요청 생성 폼 추가
- 현재 요청 상태 표시

### Phase 4. 관리자 UI
- Admin 요청 목록 추가
- 승인/반려 버튼 추가
- founder leaves with co-founders resolution UI 추가

### Phase 5. 내부 notification
- admin 대상 create
- requester 대상 결과 알림 create

---

## 실행 가능한 QA

### 시나리오 1. 회사 없는 founder가 새 회사 요청
**도구**: Playwright + DB 확인
1. 회사 소속이 없는 founder 로그인
2. Settings/Profile에서 `Request new company` 클릭
3. 회사명 입력 후 요청 생성
4. DB에서 pending request 확인
5. admin notification 생성 확인

**기대 결과**:
- 요청 생성됨
- 관리자 알림 생성됨

### 시나리오 2. co-founder가 회사 이탈 요청
**도구**: Playwright + DB 확인
1. co-founder 로그인
2. `Leave current company` 실행
3. pending request 확인
4. admin이 승인
5. `CompanyMember.isCurrent = false`
6. `UserBatch.role = founder`
7. `UserBatch.founderId = null`

**기대 결과**:
- co-founder가 독립 founder로 전환됨

### 시나리오 3. founder가 나가고 co-founder가 남아 있음
**도구**: Playwright + DB 확인
1. founder 1, co-founder 2 상태 준비
2. founder가 회사 이탈 요청 생성
3. 자동 승인되지 않고 review-needed로 뜨는지 확인
4. admin이 resolutionType 선택 후 승인
5. founder/co-founder 관계 재정리 확인

**기대 결과**:
- 관계가 붕 뜨지 않음
- 명시적 전환이 일어남

### 시나리오 4. 새 회사 요청 승인
**도구**: Playwright + DB 확인
1. founder/co-founder가 새 회사 요청 생성
2. admin 승인
3. DB에서 확인:
   - `Company` 생성
   - `CompanyBatch` 생성
   - `CompanyMember` 생성
   - `User.company` sync
   - requester notification 생성

**기대 결과**:
- 새 회사가 현재 batch 맥락에 보임
- 사용자에게 승인 결과 알림이 감

### 시나리오 5. 기존 founder/co_founder 공통 기능 회귀
**도구**: Playwright + DB 확인
1. founder / co-founder 각각 질문 작성
2. assignment 대상/리마인더 계산 확인
3. office hour 대상 인식 확인
4. 전환 후에도 founder 기능 유지 확인

**기대 결과**:
- 기존 기능이 깨지지 않음

---

## 최종 추천

### 지금 가장 좋은 방향
- founder / co_founder는 유지
- 회사 이탈은 자유 요청 + 필요 시 자동 founder 전환
- founder가 나가고 co-founder가 남으면 manual review
- 새 회사 생성은 관리자 승인
- Peter 이메일보다 **내부 notification + 관리자 요청 목록** 우선

## 한 줄 결론

> Founder / Co-founder를 지금 합치지 말고, 회사 이탈 / 새 회사 요청 / founder departure edge case를 처리하는 요청+내부알림+승인 플로우를 추가하는 것이 가장 안전하고 자연스러운 방향입니다.
