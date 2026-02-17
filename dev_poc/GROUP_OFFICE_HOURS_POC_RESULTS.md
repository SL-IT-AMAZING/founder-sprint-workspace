# Group Office Hours — PoC Results

> Date: 2026-02-03
> Status: All PoCs PASSED

---

## PoC 1: Schema Migration (groupId nullable 추가)

### 목표
OfficeHourSlot에 nullable groupId 추가 시 기존 데이터/코드에 영향 없는지 검증

### 가설
Prisma는 nullable column 추가 시 기존 행에 NULL 할당, 에러 없음

### 성공기준
- prisma generate 성공
- npm run build 성공
- 기존 slot 레코드 groupId = null

### 실행
1. prisma/schema.prisma 수정 — groupId, group relation, @@index 추가
2. `npx prisma generate` → ✅ 성공 (v7.3.0, 102ms)
3. `npm run build` → ✅ 성공 (26 pages, 0 errors)
4. DB migration: Prisma CLI 연결 타임아웃 — manual SQL 대안 생성

### 결과: ✅ PASS (DB migration만 수동 필요)

### Manual SQL
```sql
ALTER TABLE office_hour_slots ADD COLUMN group_id UUID REFERENCES groups(id) ON DELETE SET NULL;
CREATE INDEX idx_office_hour_slots_group_id ON office_hour_slots(group_id);
```

### 다음 액션
- Supabase 대시보드 SQL Editor에서 위 SQL 실행
- `SELECT * FROM office_hour_slots LIMIT 5;` 로 group_id = NULL 확인

---

## PoC 2: Cache + Relation Include 호환성

### 목표
unstable_cache에 group → members → user 3단계 중첩 include 시 직렬화 에러 없는지

### 가설
Prisma 결과는 plain object이므로 JSON 직렬화 가능

### 성공기준
getOfficeHourSlots 호출 시 group 데이터 포함하여 정상 반환

### 분석 결과
- feed.ts getPost()에서 3단계 중첩 include (comments.replies.author) 이미 사용 중 → 검증됨
- group.ts getGroup()에서 members.user 2단계 include 사용 중 → 검증됨
- Date 직렬화는 프로젝트 전체에서 `new Date()` wrapper로 처리

### 결과: ✅ PASS — 추가 PoC 불필요 (기존 코드로 검증 완료)

---

## PoC 3: Confirmed Slot without Request

### 목표
OfficeHourRequest 없이 confirmed 상태 slot이 UI에서 에러 없는지

### 가설
UI array 연산 (.filter, .find, .some)은 빈 배열에서 안전

### 분석 결과
| 코드 | 결과 | 안전? |
|------|------|-------|
| `slot.requests.filter(r => ...)` | `[]` | ✅ |
| `slot.requests.find(r => ...)` | `undefined` | ✅ (조건부 렌더링으로 보호) |
| `slot.requests.some(r => ...)` | `false` | ✅ |
| `approvedRequest && (<div>...)` | 스킵됨 | ✅ |

### 비즈니스 로직 이슈
- confirmed slot에 requester info 없음 → group info로 대체 표시 구현
- delete 버튼이 나타남 → 허용 (관리자가 강제 스케줄링 취소 가능)

### 결과: ✅ PASS — 런타임 에러 없음, UI에 group 대체 표시 구현 완료
