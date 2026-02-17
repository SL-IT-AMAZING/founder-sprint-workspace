# 13. Group Office Hours — 구현 명세

> Status: ✅ 구현 완료 (2026-02-03)
> PoC: 3건 모두 PASS

---

## 개요

오피스아워 시스템을 1:1에서 그룹 기반으로 전환.
- 관리자(jisang@any-on.com)가 **그룹에게** 오피스아워를 강제 스케줄링
- 그룹 멤버가 관리자에게 오피스아워를 **요청** (관리자가 승인/거절)
- Google Meet 링크를 **그룹 전원**에게 발송

---

## Schema 변경

### OfficeHourSlot — groupId 추가
```prisma
model OfficeHourSlot {
  groupId  String?  @map("group_id") @db.Uuid
  group    Group?   @relation(fields: [groupId], references: [id], onDelete: SetNull)
  @@index([groupId])
}
```

### Group — 역관계 추가
```prisma
model Group {
  officeHourSlots  OfficeHourSlot[]
}
```

### OfficeHourRequest — 변경 없음
requesterId는 required로 유지. 팀 요청 시 제출자 = requesterId.

---

## 서버 액션

### 신규: scheduleGroupOfficeHour(formData)
- **파일**: src/actions/office-hour.ts
- **권한**: Staff only (admin/super_admin/mentor)
- **입력**: groupId, startTime, endTime, timezone
- **동작**:
  1. 그룹 검증 (존재, 같은 배치, 멤버 1명+)
  2. Slot 생성 (status: confirmed, groupId 설정)
  3. Google Calendar + Meet 생성 (그룹 전원 초대)
  4. Meet 링크 저장

### 수정: createOfficeHourSlot
- optional groupId 추가 (사전 그룹 지정 가능)

### 수정: requestOfficeHour(slotId, groupId, message?)
- groupId 필수 — 그룹 멤버 검증
- requesterId = 요청 제출자

### 수정: respondToRequest
- 승인 시: slot.groupId가 있으면 그룹 전원 이메일 조회
- Calendar 제목: "Office Hour: {host} × {group}"
- 그룹 전원에게 Meet 초대

### 수정: getOfficeHourSlots
- group relation include 추가 (members → user)

---

## 유저 초대 시 그룹 배정

### 수정: inviteUser (src/actions/user-management.ts)
- optional groupId 파라미터 추가
- 유저 생성 후 GroupMember 자동 생성
- 그룹 캐시 revalidate

---

## UI 변경

### 초대 모달 (UserManagement.tsx)
- 역할이 founder/co_founder일 때 그룹 선택 드롭다운 표시
- 배치 변경 시 그룹 목록 자동 로드

### 오피스아워 페이지 (page.tsx)
- groups 데이터 fetch → OfficeHoursList에 prop 전달

### 오피스아워 목록 (OfficeHoursList.tsx)
- **관리자**: "Schedule Group Office Hour" 버튼 + 모달
- **파운더**: 요청 시 그룹 선택 필수 (1개면 자동선택)
- **슬롯 카드**: 그룹명 + 멤버 수 표시
- **confirmed + 그룹**: 그룹 멤버 아바타 표시
- **그룹 없는 파운더**: "Join a group to request" 메시지

---

## 검증 상태

| 항목 | 상태 |
|------|------|
| Schema migration | ✅ generate + build 성공 |
| Cache 호환성 | ✅ 기존 패턴으로 검증 |
| Request 없는 confirmed slot | ✅ UI 안전 |
| npm run build | ✅ 0 errors |

---

## DB Migration (수동 실행 필요)

Supabase SQL Editor에서 실행:
```sql
ALTER TABLE office_hour_slots ADD COLUMN group_id UUID REFERENCES groups(id) ON DELETE SET NULL;
CREATE INDEX idx_office_hour_slots_group_id ON office_hour_slots(group_id);
```

검증:
```sql
SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'office_hour_slots' AND column_name = 'group_id';
```
