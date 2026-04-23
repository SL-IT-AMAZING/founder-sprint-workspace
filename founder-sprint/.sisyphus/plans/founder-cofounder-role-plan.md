# Founder / Co-founder 정리 플랜

## 결론 먼저

현재 구조에서는 **Founder / Co-founder를 바로 하나로 합치기보다**,

> **Co-founder는 유지하되, 회사 이탈 / Founder 전환 / 새 회사 생성 요청 흐름을 추가하는 쪽이 가장 안전합니다.**

이유는 권한은 거의 같지만, 데이터 구조는 다르게 설계되어 있기 때문입니다.

---

## 1. 현재 구조 요약

### 권한 면에서는 거의 비슷함
다음 영역은 founder / co_founder를 거의 동일하게 취급합니다.
- 질문 작성
- 과제 제출 / 리마인더 대상
- schedule / office hour 대상
- founder/co_founder 공통 권한 체크

### 하지만 데이터 모델은 다름
현재 `co_founder`는 단순 라벨이 아닙니다.

핵심 차이:
- `UserRole` enum에 별도 role 존재
- `UserBatch.founderId`가 있어 primary founder와 연결
- 초대 시 `co_founder`는 `founderId` 필수
- founder당 co_founder 최대 2명 제한
- office hour, directory, company/team 표시에서도 별도 처리 존재

즉,
> **기능은 비슷하지만, 데이터 구조는 founder / co_founder를 다르게 보고 있습니다.**

---

## 2. 선택지 비교

### 선택지 A. 완전 통합
즉:
- `co_founder` role 제거
- 전부 `founder`로 통합

#### 장점
- 역할 체계 단순
- 초대 UI 단순
- 운영 설명 쉬움

#### 단점
- 스키마 변경 필요
- 마이그레이션 필요
- `UserBatch.founderId` 처리 재설계 필요
- invite / office hour / directory / company 연결 로직 전부 재검토 필요
- 범위가 커짐

#### 판단
**지금 당장 하기는 큽니다.**
“권한이 비슷하니 합치자”에 비해, 바뀌는 코드/데이터 영향이 큽니다.

---

### 선택지 B. 역할은 유지, 전환 흐름 추가
즉:
- founder / co_founder는 유지
- co_founder가 회사를 떠나면 founder로 전환 가능
- 새 회사 생성은 관리자 요청으로 처리

#### 장점
- 현재 구조를 거의 유지 가능
- migration 부담 적음
- 운영상 필요한 실제 문제를 해결함

#### 단점
- 역할 2개는 계속 남음
- 완전 단순화는 아님

#### 판단
**현재 FounderSprint에는 이게 가장 현실적이고 안전한 방향입니다.**

---

## 3. 추천안 (최종)

### 추천 방향
1. `co_founder` role은 유지
2. co-founder가 팀에서 분리되면
   - 회사 소속을 떠날 수 있어야 함
   - founder로 전환할 수 있어야 함
3. 새 회사가 필요하면
   - 관리자가 새 회사 생성 요청을 처리할 수 있어야 함

즉,
> **역할 통합 대신, 상태 전환과 운영 흐름을 추가하는 것**이 핵심입니다.

---

## 4. 실제로 추가해야 하는 것

### A. 회사 이탈 요청
사용자가 “현재 회사에서 나가고 싶다”는 요청을 만들 수 있어야 합니다.

#### 추가 규칙: 대표 Founder가 나가는 경우
이건 일반 회사 이탈과 다르게 처리해야 합니다.

현재 구조상 co-founder는 `UserBatch.founderId`로 특정 founder에 연결됩니다.
따라서 primary founder가 나가면, 남아 있는 co-founder들의 관계가 붕 뜰 수 있습니다.

이 경우는 **자동 즉시 처리 금지**가 맞습니다.
반드시 아래 중 하나를 선택하도록 해야 합니다.

1. 남아 있는 co-founder 중 1명을 새 founder로 승격
2. 남아 있는 co-founder 전원을 founder로 전환
3. 관리자 검토 요청으로 넘김

추천 기본값:
- co-founder가 1명 이상 남아 있으면 **자동 승인 대신 관리자 검토**로 보냄
- founder만 나가고 co-founder가 없으면 자유 이탈 허용

즉, founder가 떠날 때 co-founder가 남아 있는 경우는 단순 “회사 이탈”이 아니라 **팀 구조 재정리 작업**으로 다뤄야 합니다.

#### 저장 구조 필요
현재 schema에는 이 요청을 저장할 전용 모델이 없습니다.
따라서 예를 들면 아래 같은 모델이 필요합니다.

```prisma
model CompanyChangeRequest {
  id            String   @id @default(uuid()) @db.Uuid
  userId        String   @map("user_id") @db.Uuid
  batchId       String?  @map("batch_id") @db.Uuid
  currentCompanyId String? @map("current_company_id") @db.Uuid
  targetType    String   @map("target_type") // leave_company | new_company
  requestedCompanyName String? @map("requested_company_name")
  requestedCompanyDescription String? @map("requested_company_description")
  status        String   @default("pending") // pending | approved | rejected | cancelled
  note          String?
  reviewedById  String?  @map("reviewed_by_id") @db.Uuid
  reviewedAt    DateTime? @map("reviewed_at")
  createdAt     DateTime @default(now()) @map("created_at")
}
```

이건 예시고, 핵심은:
- 누가 요청했는지
- 지금 어느 회사 소속인지
- 무엇을 원하는지
- 상태가 무엇인지
를 저장할 수 있어야 한다는 점입니다.

### B. Founder 전환 처리
co-founder가 회사를 떠날 때:
- `CompanyMember.isCurrent = false`
- `User.company` sync 재계산
- `UserBatch.role = founder`
- `UserBatch.founderId = null`

이렇게 하면 “공동창업자 → 독립 founder” 전환이 됩니다.

### C. 새 회사 생성 요청
사용자가 “새 회사가 필요합니다”를 요청하면:
- 관리자 승인 후 회사 생성
- **반드시 `CompanyBatch` 생성** (해당 활성 batch에 연결)
- `CompanyMember` 생성
- 사용자 `company` 필드 sync

즉, 새 회사는 단순 회사 레코드만 만드는 것이 아니라,
**현재 운영 중인 batch 문맥에 연결되어야** 실제 FounderSprint 화면들에 정상 노출됩니다.

---

## 5. UI/운영 흐름

### 사용자 입장
#### 추천 진입점
- `Settings` 또는 `Profile` 안의 Company 섹션
- 여기서:
  - `Leave current company`
  - `Request new company`
  중 하나를 선택 가능

### 관리자 입장
#### 추천 처리 화면
- `Admin → Users` 안의 별도 요청 섹션 또는
- `Admin → Companies` 안의 요청 섹션

여기서 해야 할 일:
- 들어온 요청 목록 보기
- 승인 / 반려
- 승인 시:
  - 회사 이탈 처리
  - founder 전환 처리
  - 새 회사 생성 처리
  - 새 회사를 현재 batch에 `CompanyBatch`로 연결

---

## 6. 구현 순서

### Phase 1. Request 모델 추가
- Prisma schema에 요청 모델 추가
- migration 생성
- 최소 server action 추가
  - create request
  - approve request
  - reject request
- founder leaves with co-founders case를 위한 추가 필드 정의
  - `hasDependentCoFounders`
  - `resolutionType` (promote_one | convert_all | manual_review)
  - `promotedUserId` (선택 시)
- 책임 위치 명시
  - 생성: `Settings/Profile` 사용자 액션
  - 승인/반려: `Admin → Users` 또는 `Admin → Companies` 관리 액션

### Phase 2. 사용자 요청 UI
- 사용자가 회사 이탈 요청 가능
- 새 회사 생성 요청 가능
- 현재 요청 상태 확인 가능

### Phase 3. 관리자 처리 UI
- pending 요청 목록
- 승인 / 반려
- 승인 시 실제 DB 변경

### Phase 4. founder 전환 로직
- co-founder → founder 전환
- founderId 제거
- company membership 정리

---

## 7. 검증 계획 (실행 가능한 QA)

### 시나리오 1. Co-founder가 회사 이탈 요청
**도구**: Playwright + DB 확인
1. co-founder 계정으로 로그인
2. Settings 또는 회사 관련 화면에서 `Leave current company` 클릭
3. 요청 생성
4. 요청 상태가 pending으로 보이는지 확인
5. DB에서 `CompanyChangeRequest(status=pending, targetType=leave_company)` 확인

**기대 결과**:
- 요청이 생성됨
- DB에 pending request 저장됨

### 시나리오 2. Admin이 회사 이탈 요청 승인
**도구**: Playwright + DB 확인
1. admin으로 로그인
2. 요청 목록에서 해당 요청 승인
3. DB에서 확인:
   - `CompanyMember.isCurrent = false`
   - `UserBatch.role = founder`
   - `UserBatch.founderId = null`

**기대 결과**:
- 사용자는 더 이상 기존 회사 current member가 아님
- founder로 전환됨

### 시나리오 2-1. Founder가 나가고 co-founder가 남아 있는 경우
**도구**: Playwright + DB 확인
1. founder 1명과 co-founder 2명이 연결된 상태 준비
2. founder가 회사 이탈 요청 생성
3. 시스템이 자동 승인하지 않고 추가 선택 또는 admin review로 넘기는지 확인
4. admin이
   - 한 명 승격
   - 전원 founder 전환
   - manual review 유지
   중 하나를 선택
5. DB에서 `founderId` 관계와 role이 기대대로 재정리됐는지 확인

**기대 결과**:
- founder가 나갈 때 남은 co-founder 관계가 붕 뜨지 않음
- founder/co-founder 구조가 명시적으로 재정리됨

### 시나리오 3. 새 회사 요청 후 승인
**도구**: Playwright + DB 확인
1. 사용자가 `Request new company` 제출
2. admin이 승인
3. DB 확인:
   - `Company` 생성
   - `CompanyBatch` 생성
   - `CompanyMember` 생성
   - `User.company` sync
   - request status가 `approved`로 변경

**기대 결과**:
- 새 회사가 정상 생성되고 사용자와 연결됨
- batch 문맥에서도 회사가 보임

### 시나리오 4. 기존 founder/co_founder 기능 유지 확인
**도구**: Playwright + DB 확인

#### 4-1. 질문 작성 권한
1. founder 계정으로 로그인
2. `Questions`에서 새 질문 작성 시도
3. co-founder 계정으로 로그인
4. 동일하게 새 질문 작성 시도

**기대 결과**:
- founder, co-founder 모두 질문 작성 가능

#### 4-2. assignment 대상/리마인더 유지
1. founder 1명, co-founder 1명이 포함된 batch 준비
2. assignment를 생성하고 둘 다 미제출 상태 유지
3. 대상 계산 또는 reminder 대상 계산 실행
4. 결과에서 founder / co-founder 둘 다 포함되는지 확인

**기대 결과**:
- founder, co-founder 모두 동일하게 assignment 대상 및 reminder 대상으로 잡힘

#### 4-3. office hour 대상 유지
1. founder, co-founder가 포함된 batch 준비
2. office hour 요청/슬롯 생성 화면 진입
3. founder / co-founder가 모두 선택 가능한지 확인

**기대 결과**:
- founder, co-founder 모두 office hour 대상자로 인식됨

#### 4-4. 전환 후 회귀 확인
1. co-founder를 founder로 전환하는 승인 플로우 실행
2. 다시 Questions / Assignment / Office Hour 관련 화면 진입
3. 동일 기능이 계속 가능한지 확인

**기대 결과**:
- 전환 후에도 founder 권한으로 질문/과제/오피스아워 기능이 정상 동작함

---

## 8. 지금 당장 추천하는 결정

### 가장 안전한 결론
- **co_founder를 없애지 않는다**
- 대신 **회사 이탈 + founder 전환 + 새 회사 요청**을 추가한다

### 이유
- 현재 구조를 거의 유지 가능
- 데이터 migration 부담 적음
- 운영상 실제로 필요한 문제를 해결함
- 나중에 정말 필요하면 role 통합은 별도 프로젝트로 진행 가능

---

## 9. 최종 한 줄

> **Founder / Co-founder는 지금 합치지 말고, “회사를 나가면 founder로 전환되는 흐름”과 “새 회사 생성 요청 흐름”을 추가하는 것이 가장 현실적이고 안전한 플랜입니다.**
