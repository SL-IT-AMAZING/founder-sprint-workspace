# FounderSprint 파이널 검증 플랜 (전체 경우의 수 기준)

## 1. 목적
이 문서는 FounderSprint에서 현재 변경된 기능과 기존 핵심 운영 기능을 포함하여, **빠짐없이 검증해야 할 항목을 최종 기준으로 정리한 파이널 플랜**입니다.

이 플랜의 목표는 다음과 같습니다.
1. Clone / Invite / Onboarding / Reminder / Settings / Events / Sessions가 의도대로 동작하는지 확인
2. Batch-wide / Company-targeted / Role-based 차이를 모두 고려
3. Gmail / Google Calendar / Google Meet처럼 외부 시스템이 개입되는 경우도 별도 단계로 안전하게 검증
4. 무엇이 이미 검증됐고, 무엇이 아직 외부적으로만 남아 있는지 구분

---

## 2. 고정 안전 원칙

### 외부 발송/초대
- 라이브 테스트가 필요할 경우 **`slit.amazing@gmail.com` 하나만 사용**
- 다른 실제 사용자에게 발송 금지

### 시간대
- 외부 일정/미팅 테스트는 **KST 기준 4월 10일 새벽 시간대만 사용**
- 권장 시간:
  - 04:00 ~ 04:30
  - 05:00 ~ 05:30

### 데이터
- 운영 데이터 직접 수정 금지
- 임시 테스트 batch / session / event / assignment 우선 사용
- 테스트 종료 후 정리 가능해야 함

### 해석 원칙
- **앱 성공**과 **외부 시스템 성공**을 분리해서 기록
- 예:
  - API 성공
  - DB 저장 성공
  - Organizer calendar 반영
  - Recipient inbox/calendar 확인

---

## 3. 검증 범주

이 플랜은 다음 10개 축으로 검증합니다.

1. **Clone**
2. **Invite**
3. **Onboarding**
4. **Assignments / Reminder**
5. **Sessions**
6. **Events**
7. **Google Calendar / Meet**
8. **Settings / Batch Context**
9. **Roles / Permission 차이**
10. **Failure Modes / Edge Cases**

---

## 4. 상태 구분

- ✅ **이미 검증 완료**: 코드/빌드/브라우저/runtime 증거 있음
- 🧪 **추가 검증 필요**: 외부 시스템 또는 라이브 테스트 필요
- ❌ **범위 밖 / 정책 미확정**: 현재 제품 결정 필요

---

# 5. 검증 매트릭스

## A. Clone 프로세스

| 항목 | 설명 | 상태 | 검증 방법 | 성공 기준 |
|---|---|---:|---|---|
| A1 | Batch clone 가능 | ✅ | Playwright + DB | source batch에서 clone 성공 |
| A2 | Clone success modal 표시 | ✅ | Playwright | cloned batch명, count, 3개 CTA 표시 |
| A3 | `Close` 동작 | ✅ | Playwright | modal 닫히고 cloned batch card 보임 |
| A4 | `Invite Members Now` handoff | ✅ | Playwright | `/admin/users?...&openInvite=1` 진입 |
| A5 | `Review Batch First` handoff | ✅ | Playwright | `/admin/users?batchId=...` 진입 |
| A6 | Clone 시 assignments 복제 | ✅ | DB + UI | 새 batch에 assignment 존재 |
| A7 | Clone 시 sessions 복제 | ✅ | DB + UI | 새 batch에 session 존재 |
| A8 | Clone 시 members 미복제 | ✅ | DB | source 멤버가 자동 전체 복제되지 않음 |
| A9 | Clone 시 events 미복제 | ✅ | DB | event carry-over 없음 |
| A10 | Clone 시 googleEventId 미복제 | ✅ | 코드 + DB | cloned session `googleEventId = null` |
| A11 | Clone 시 targetCompanyIds 리셋 | ✅ | 코드 + DB | cloned assignment/session target 비움 |

---

## B. Invite 프로세스

| 항목 | 설명 | 상태 | 검증 방법 | 성공 기준 |
|---|---|---:|---|---|
| B1 | Single invite 가능 | ✅ | 기존 로직 + UI | 이메일/role로 초대 가능 |
| B2 | Bulk invite 가능 | ✅ | 기존 UI | 여러 이메일 일괄 처리 |
| B3 | Source preload 표시 | ✅ | Playwright | source batch active users 표시 |
| B4 | 체크박스 선택/해제 | ✅ | Playwright | selected count 변함 |
| B5 | `Invite Selected Members` 실제 실행 | ✅ | Playwright + DB | target batch membership 생성 |
| B6 | 결과 summary 단순화 | ✅ | Playwright | `Invited / Skipped`만 표시 |
| B7 | clone admin auto-added business rule | ✅ | Playwright + DB | 2 invited / 1 skipped 확인 |
| B8 | 새 이메일 + role 추가 | ✅ | 기존 invite flow + 코드 | cloned batch 기준 일반 초대 |
| B9 | existing user direct-active 처리 | ✅ | 코드 | 경우에 따라 메일 없이 active 가능 |
| B10 | 이미 같은 batch 존재 시 skip | ✅ | 결과 summary | `User already in this batch` |
| B11 | company conflict skip | ✅ | 코드 + summary | conflict reason 반환 |
| B12 | source preload가 없는 fallback route | ✅ | Playwright | `/admin/users?openInvite=1` generic invite UI |

---

## C. Onboarding

| 항목 | 설명 | 상태 | 검증 방법 | 성공 기준 |
|---|---|---:|---|---|
| C1 | invite acceptance 후 active 전환 | ✅ | 코드 + server path | `invited -> active` |
| C2 | onboarding digest 발송 트리거 | ✅ | 코드 + server path | acceptance 후 발송 |
| C3 | onboarding dedupe | ✅ | notification record | batch/user당 1회 |
| C4 | onboarding 링크 3개 포함 | ✅ | 코드 | assignments / sessions / events |
| C5 | batch-aware redirect 링크 | ✅ | `/api/batch/select` route | selected batch context 설정 |
| C6 | direct-active user onboarding | ❌ | 제품 정책 | 현재 확정 안 됨 |
| C7 | browser에서 full accept→digest end-to-end | 🧪 | 라이브/브라우저 통합 | 아직 Playwright full proof 없음 |

---

## D. Assignment / Reminder

| 항목 | 설명 | 상태 | 검증 방법 | 성공 기준 |
|---|---|---:|---|---|
| D1 | reminder cron route 존재 | ✅ | 코드 + build | `/api/cron/deadline-reminders` 존재 |
| D2 | hourly cron schedule | ✅ | `vercel.json` | `0 * * * *` |
| D3 | 23–24h window selection | ✅ | runtime test | inside only selected |
| D4 | outside-window 제외 | ✅ | runtime test | 22h / 25.5h 제외 |
| D5 | non-submitter only | ✅ | 코드 + route | 제출자 제외 |
| D6 | reminder dedupe | ✅ | notification record | 중복 방지 |
| D7 | safe overrideEmail test path | ✅ | route test | controlled recipient 가능 |
| D8 | 실제 Gmail 발송 경로 | ✅ | live test | `sent: 1` 확인 |
| D9 | inbox delivery guarantee | 🧪 | 외부 메일함 확인 | SMTP success와 별도 |

---

## E. Sessions

| 항목 | 설명 | 상태 | 검증 방법 | 성공 기준 |
|---|---|---:|---|---|
| E1 | session create path 정상 | ✅ | 코드 + build | 저장/캐시 revalidate |
| E2 | timezone → IANA 변환 | ✅ | 코드 | `toIanaTimezone` 사용 |
| E3 | local time → UTC 변환 | ✅ | 코드 | `fromZonedTime` 사용 |
| E4 | company targeting 지원 | ✅ | 코드 | `targetCompanyIds` 처리 |
| E5 | attendee 계산 로직 존재 | ✅ | 코드 | company or batch users |
| E6 | Google Calendar create path | ✅ | 코드 | `createCalendarEvent` |
| E7 | update path attendee 재계산 | ✅ | 코드 | `updateCalendarEvent` |
| E8 | cloned session은 googleEventId 없음 | ✅ | 코드 + DB | structure only |
| E9 | 실제 라이브 calendar proof (organizer side) | ✅ | 라이브 테스트 완료 | organizer calendar + attendee list 확인 |

---

## F. Events

| 항목 | 설명 | 상태 | 검증 방법 | 성공 기준 |
|---|---|---:|---|---|
| F1 | event create path 정상 | ✅ | 코드 + build | 저장/캐시 revalidate |
| F2 | virtual / office_hour → Meet path | ✅ | 코드 | `createCalendarEventWithMeet` |
| F3 | in_person → 일반 calendar path | ✅ | 코드 | `createCalendarEvent` |
| F4 | company targeting 지원 | ✅ | 코드 | `targetCompanyIds` 처리 |
| F5 | attendee 계산 로직 존재 | ✅ | 코드 | batch-wide vs company-targeted |
| F6 | update path calendar sync | ✅ | 코드 | `updateCalendarEvent` |
| F7 | 실제 Google Meet 링크 생성 확인 (organizer side) | ✅ | 라이브 테스트 완료 | DB + organizer calendar hangoutLink 확인 |
| F8 | company-targeted event가 single recipient로 제한되는지 | ✅ | 라이브 테스트 완료 | organizer attendee list가 `slit.amazing@gmail.com` + admin만 포함 |

---

## G. Google Calendar / Meet

| 항목 | 설명 | 상태 | 검증 방법 | 성공 기준 |
|---|---|---:|---|---|
| G1 | 환경변수 기반 config check | ✅ | 코드 | `isCalendarConfigured()` |
| G2 | Meet 생성 requires `conferenceDataVersion=1` | ✅ | 공식 Google docs + 코드 | 명시적 설정 |
| G3 | Meet 생성 requires unique requestId | ✅ | 코드 | unique requestId 생성 |
| G4 | attendee array replace behavior | ✅ | 공식 docs | 업데이트 시 전체 배열 재전송 필요 |
| G5 | `sendUpdates=all` 사용 | ✅ | 코드 | attendee mail path 포함 |
| G6 | API success ≠ inbox/calendar proof | ✅ | 공식 docs | 결과 기록 시 분리 필요 |
| G7 | 실제 organizer calendar 반영 | ✅ | 라이브 테스트 완료 | organizer calendar 확인 |
| G8 | 실제 recipient invite/calendar 반영 | 🧪 | recipient 계정 직접 확인 필요 | slit 쪽 확인 |
| G9 | KST 새벽 시간이 외부에도 그대로 보이는지 | ✅ | 라이브 테스트 완료 | organizer calendar에 `Asia/Seoul` + `+09:00` 확인 |

---

## H. Settings / Batch Context

| 항목 | 설명 | 상태 | 검증 방법 | 성공 기준 |
|---|---|---:|---|---|
| H1 | settings 페이지 로드 | ✅ | 코드 + 기존 UI | 정상 렌더 |
| H2 | onboarding mode (`?onboarding=true`) | ✅ | 코드 | 별도 onboarding copy/path |
| H3 | selected batch context 유지 | ✅ | 코드 | batch switcher / cookie 기반 |
| H4 | onboarding digest links batch-aware | ✅ | `/api/batch/select` | 컨텍스트 설정 후 이동 |
| H5 | settings sidebar timezone/batch 표시 | ✅ | 코드 | 현재 user/batch 정보 반영 |

---

## I. Roles / Permissions

| 역할 | 핵심 권한 | 제한 |
|---|---|---|
| Super Admin | 전역 최고 권한, super_admin 지정 가능 | 사실상 없음 |
| Admin | batch/user/group/event/session/settings 관리, 초대, clone | super_admin 지정 불가 |
| Mentor | assignment 생성, 질문 답변, office hour slot 생성 | batch/user 관리 불가 |
| Founder | assignment 제출, 질문 작성, office hour 요청 | 운영 권한 없음 |
| Co-founder | founder와 실질적 동일 권한 | primary founder 연결 필요 |

추가 검증 포인트:
- `getCurrentUser()`는 `global_role` 우선 해석 → E2E bootstrap 시 반드시 role까지 설정 필요 ✅

---

## J. Failure Mode / Edge Case 매트릭스

| 케이스 | 기대 동작 | 상태 |
|---|---|---:|
| Clone 성공 후 modal 안 뜸 | 실패 | ✅ 브라우저 E2E로 검출 가능 |
| Invite handoff URL 누락 | 실패 | ✅ 브라우저 E2E로 검출 가능 |
| Source preload 비어 있음 | summary/UI로 감지 | ✅ 브라우저 E2E 일부 검출 |
| cloning admin이 중복 invite 됨 | `User already in this batch` + skipped | ✅ 검증 완료 |
| no-batch 화면인데 smoke pass | 안 됨 | ✅ 버그 발견 후 수정 |
| global role mismatch로 admin 권한 상실 | 안 됨 | ✅ E2E bootstrap 수정 |
| reminder가 하루 한 번 narrow slice만 잡음 | 안 됨 | ✅ hourly cron으로 수정 |
| reminder가 outside window도 잡음 | 안 됨 | ✅ runtime 검증 |
| Gmail SMTP 성공 but inbox 미도착 | 외부 확인 필요 | 🧪 |
| Meet link 생성 요청은 성공했지만 recipient 쪽 캘린더 안 보임 | organizer/recipient 분리 기록 | 🧪 |
| clone된 session이 기존 Meet까지 carry-over | 안 됨이 정상 | ✅ 확인 완료 |
| direct-active user onboarding 안 감 | 현재 정책 미확정 | ❌ |

---

## 6. 라이브 테스트 우선순위 (최소 but 빠짐없이)

### 1차: 이미 끝난 것
- build
- diagnostics
- reminder runtime / window
- clone/invite 브라우저 E2E

### 2차: 외부 통합 최소 검증
1. Gmail reminder → `slit.amazing@gmail.com`
2. Virtual Event (KST 04:00) → Meet + Calendar + email
3. Session create (KST 05:00) → Calendar sync
4. Company-targeted Event → recipient 제한 검증

### 3차: 남는 정책 항목
- direct-active existing user onboarding rule 확정
- clone 후 future calendar auto-resync 필요 여부 판단

---

## 7. 최종 완료 기준

이 플랜 기준으로 “빠짐없이” 완료됐다고 말하려면:
- 내부 기능 검증 ✅
- 브라우저 E2E 검증 ✅
- reminder 경로 및 시간창 검증 ✅
- company-targeted / batch-wide 차이 검증 ✅
- KST 새벽 시간 라이브 검증 ✅
- Gmail / Calendar / Meet 외부 반영 구분 기록 ✅
- 운영 매뉴얼 한국어 버전 작성 ✅

현재 상태:
- 내부/브라우저/리마인더는 완료
- **외부 organizer-side Google Calendar / Meet + company-targeted 라이브 검증도 완료**
- recipient-side inbox/calendar visibility만 별도 외부 확인 항목으로 남아 있음
