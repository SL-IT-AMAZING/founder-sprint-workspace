# FounderSprint 라이브 테스트 플랜 (KST 4월 10일 새벽 / 단일 수신자)

## 목적
이 문서는 FounderSprint의 Gmail / Google Calendar / Google Meet 관련 라이브 테스트를 **안전하게** 수행하기 위한 계획서입니다.

핵심 목표:
1. 타임존(KST) 처리 정확성 확인
2. 이벤트 / 세션 생성 시 Google Calendar / Meet 연동 확인
3. 단일 외부 수신자만 사용해 운영 피해 없이 검증

---

## 고정 안전 규칙

### 외부 수신자
- **`slit.amazing@gmail.com` + `jgamer0914@gmail.com`만 사용**
- 다른 실제 사용자에게는 발송하지 않음

### 시간대
- **KST 기준 2026-04-10 새벽 시간만 사용**
- 권장 시간 예시:
  - 04:00 ~ 04:30
  - 05:00 ~ 05:30

### 데이터 원칙
- 운영용 기존 session/event를 건드리지 않음
- 반드시 **임시 테스트 batch / 임시 테스트 event/session** 사용
- 테스트 종료 후 정리 가능해야 함

---

## 왜 이 플랜이 필요한가

현재 내부 코드와 브라우저 검증은 강하게 끝났지만, 다음은 아직 외부 시스템 기준으로 100% 증명되지 않았습니다.
- 실제 Google Calendar 생성 결과
- 실제 Google Meet 링크 생성 결과
- 실제 수신자 Gmail/Calendar에서 보이는 방식
- KST 새벽 시간 입력이 외부 시스템에서 그대로 반영되는지

즉, 이 문서는 **외부 시스템 최종 검증용**입니다.

---

## 사전 조건

### 앱 쪽
- build 성공 상태여야 함
- Google Calendar 환경변수 설정 완료 상태여야 함
  - `GOOGLE_SERVICE_ACCOUNT_EMAIL`
  - `GOOGLE_PRIVATE_KEY`
  - `GOOGLE_CALENDAR_ID`
  - `GOOGLE_CALENDAR_IMPERSONATE` (필요 시)
- Gmail/SMTP 환경변수 설정 완료 상태여야 함
  - `GMAIL_USER`
  - `GMAIL_APP_PASSWORD`

### 운영 규칙
- 테스트 전 기존 운영 이벤트와 구분 가능한 제목 사용
- 테스트 대상은 반드시 임시 이름 사용
  - 예: `FS TEST KST 0410 DAWN SESSION`
  - 예: `FS TEST KST 0410 DAWN EVENT`

---

## 테스트 항목

### 1. Gmail reminder 테스트
목적:
- 메일 발송 경로와 실제 수신 가능성 확인
- 단일 수신자와 다중 수신자 시나리오를 구분해 확인

방법:
- assignment reminder route를 사용
- 1차: `slit.amazing@gmail.com` 단일 수신자
- 2차: `slit.amazing@gmail.com`, `jgamer0914@gmail.com` 다중 수신자
- override / 안전한 테스트 데이터 사용

성공 기준:
- route summary에서 `sent: 1`
- 수신자 메일함에서 reminder 제목 확인

주의:
- 이건 Gmail 경로 검증이지 Google Calendar / Meet 검증은 아님

---

### 2. Virtual Event 라이브 테스트
목적:
- Google Calendar event 생성
- Google Meet 링크 생성
- KST 새벽 시간 반영
- 2명 이상의 참석자에게 동시에 초대 메일이 전달되는지 확인
- recipient 쪽 확인이 끝날 때까지 이벤트를 삭제하지 않고 유지

설정:
- Event type: `virtual`
- 시작 시각: **2026-04-10 04:00 KST**
- 종료 시각: **2026-04-10 04:30 KST**
- attendee: `slit.amazing@gmail.com`, `jgamer0914@gmail.com`만 포함되도록 제한

성공 기준:
1. 앱에서 event 생성 성공
2. DB에 `googleEventId` 저장
3. DB에 `googleMeetLink` 저장
4. organizer 쪽 calendar에서 event 확인
5. `slit.amazing@gmail.com`, `jgamer0914@gmail.com`에서 초대 메일 또는 calendar invite 확인
6. 시간이 **KST 새벽 4시**로 보이는지 확인
7. 두 수신자 모두 동일한 이벤트 제목/시간/Meet 링크를 받는지 확인

주의:
- Google은 attendee array를 append가 아니라 replace로 다룸
- `sendUpdates=all` 사용 시 초대 메일이 갈 수 있음
- API 성공과 inbox/calendar 표시를 분리해서 기록해야 함
- **recipient 확인 전에는 테스트 이벤트를 삭제하지 않는다** (삭제 시 취소 메일이 발송될 수 있음)

---

### 3. Session 라이브 테스트
목적:
- session create path의 Google Calendar 동기화 확인
- KST timezone 저장/표시/외부 전송 확인
- 2명 이상 attendee가 동시에 들어갈 때도 일정이 올바르게 생성되는지 확인

중요:
- **Session은 Meet 링크를 생성하지 않음**
- Meet proof는 반드시 Virtual Event 또는 Office Hour 경로로 확인해야 함

설정:
- 시작 시각: **2026-04-10 05:00 KST**
- 종료 시각: **2026-04-10 05:30 KST**
- 가능하면 단일 company 또는 단일 테스트 batch 사용
- attendee는 `slit.amazing@gmail.com`, `jgamer0914@gmail.com`만 포함되도록 테스트용 batch/company 구성 사용

성공 기준:
1. session 생성 성공
2. DB에 `googleEventId` 저장
3. schedule / sessions UI에 시간 표시가 KST 기준으로 맞음
4. `slit.amazing@gmail.com`, `jgamer0914@gmail.com`에 초대가 도달

주의:
- cloned session은 `googleEventId = null` 상태로 복제되므로, clone된 session 자체를 proof 대상으로 삼지 말고 **새로 생성한 test session**으로 확인하는 것이 안전함

---

### 4. Company-targeted Event 테스트
목적:
- company targeting이 실제로 attendee 계산에 반영되는지 확인
- attendee가 테스트 회사 멤버(`slit.amazing@gmail.com`, `jgamer0914@gmail.com`) + organizer 외에는 포함되지 않는지 확인

설정:
- 테스트용 company 하나 생성
- 그 company에 `slit.amazing@gmail.com`, `jgamer0914@gmail.com`에 대응되는 테스트 사용자만 current membership으로 포함
- event targetCompanyIds를 해당 company로만 설정

성공 기준:
1. event 생성 성공
2. attendee 계산 대상이 회사 멤버로 제한됨
3. 실제 외부 발송은 `slit.amazing@gmail.com`, `jgamer0914@gmail.com`에게만 발생

주의:
- 이 테스트는 DB 준비가 더 필요하므로 가장 마지막 단계에 수행

---

## 권장 실행 순서

1. **Gmail reminder**
   - SMTP / 기본 메일 경로 확인
2. **Virtual Event (recipient confirmation 전 삭제 금지)**
   - Meet 생성 + KST 반영 + 2명 recipient-side 확인
3. **Session create**
   - session path의 calendar sync 확인 (Meet proof 아님)
4. **Company-targeted Event**
   - 타겟팅 제한 검증

이 순서가 가장 안전합니다.

---

## 결과 기록 형식
각 테스트마다 아래 형식으로 남깁니다.

### 테스트 이름
- 예: `Virtual Event / KST 04:00 / slit.amazing@gmail.com`

### 입력값
- batch
- event/session type
- start/end time
- timezone
- attendee(들)

### 앱 결과
- 생성 성공/실패
- warning 여부
- `googleEventId`
- `googleMeetLink`

### 외부 결과
- Gmail 수신 여부 (각 recipient별)
- Google Calendar 반영 여부 (각 recipient별)
- 시간이 KST로 맞게 보였는지

### 판정
- ✅ 성공
- 🧪 부분 성공
- ❌ 실패

---

## 공식 제약 (테스트 시 반드시 감안)

Google 공식 문서 기준:
- timezone은 반드시 **`Asia/Seoul`** 같이 명시적 IANA timezone으로 넣는 것이 안전
- Meet 생성은 `conferenceDataVersion=1` + 고유 `requestId` 필요
- attendee는 전체 배열 교체 방식
- `sendUpdates=all`이어야 메일 초대 전달이 보장됨
- Gmail SMTP acceptance는 inbox delivery와 동일하지 않음

즉, 테스트 결과를 기록할 때는 반드시 아래를 구분해야 합니다.
- **API 성공**
- **DB 저장 성공**
- **Organizer calendar 반영**
- **Recipient inbox/calendar 확인**

---

## 최종 판단 기준

이 라이브 테스트가 끝나면 다음을 말할 수 있습니다.

### 확실히 검증됨
- KST 새벽 시간 입력이 외부 Google Calendar/Meet에 기대대로 반영되는지
- 제한된 두 외부 수신자만으로 다중 수신 시나리오를 안전하게 테스트 가능한지
- Gmail / Calendar / Meet 외부 시스템까지 포함한 실제 동작 여부

### 여전히 제품 정책 결정이 필요한 것
- direct-active existing user onboarding 처리
- clone 이후 기존 future calendar invite 자동 재동기화 여부
