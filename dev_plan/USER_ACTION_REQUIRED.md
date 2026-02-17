# 사용자 조치 필요 항목

프로젝트 소유자가 수동으로 설정해야 하는 항목들 (자동화 불가).

---

## 1. LinkedIn OIDC 활성화 (Supabase) [필수 ⚠️]

**필수 이유**: 로그인 시 `linkedin_oidc` 인증이 작동하지 않음 → 모든 인증 차단

**영향도**: 로그인 완전히 차단됨

### 단계별 절차

1. **LinkedIn App 생성/확인**
   - https://www.linkedin.com/developers/apps 접속
   - 앱 생성 또는 기존 앱 선택
   - **Products** 탭 → **"Sign In with LinkedIn using OpenID Connect"** 추가

2. **LinkedIn 앱 설정**
   - **Auth** 탭 → Authorized redirect URI 추가:
     ```
     https://YOUR-PROJECT-REF.supabase.co/auth/v1/callback
     ```
   - **Client ID**와 **Client Secret** 복사

3. **Supabase에서 provider 활성화**
   - https://supabase.com/dashboard → 프로젝트 선택
   - **Authentication** → **Providers**
   - **"LinkedIn (OIDC)"** 찾기 (일반 "LinkedIn" 아님)
   - **ON** 토글
   - Client ID와 Client Secret 붙여넣기
   - 저장

### 검증 방법
- 로그인 페이지 "Sign in with LinkedIn" 클릭
- LinkedIn 동의 화면으로 리다이렉트되어야 함 (JSON 에러 아님)
- 승인 후 `/auth/callback` 으로 리다이렉트 확인

---

## 2. 이메일 설정: Gmail SMTP [진행 중 ✅]

**필수 이유**: 이메일 발송 기능 활성화

**현황**: Gmail SMTP로 임시 구성 완료 (hanjisang0914@gmail.com 사용)

### 완료된 항목
- ✅ GMAIL_USER: `hanjisang0914@gmail.com`
- ✅ GMAIL_APP_PASSWORD: 로컬 `.env.local` + Vercel 환경변수 설정됨
- ✅ 이메일 발송 기능 작동 중

### 미래 단계: peter@outsome.co 전환 (선택)

이메일을 peter@outsome.co로 변경하고 싶을 때:

1. **Gmail 앱 비밀번호 생성** (peter@outsome.co 계정)
   - https://myaccount.google.com/apppasswords 접속
   - App: Mail, Device: Windows/Mac/Linux 선택
   - 앱 비밀번호 생성 및 복사

2. **환경변수 업데이트**
   - `.env.local`:
     ```
     GMAIL_USER=peter@outsome.co
     GMAIL_APP_PASSWORD=[생성한 비밀번호]
     ```
   - Vercel 환경변수도 동일하게 업데이트

3. **검증**
   - "문의하기" 등에서 이메일 발송 테스트
   - 받는 사람이 peter@outsome.co에서 온 것으로 확인

### 현재 상태
- **블로킹**: 아니오 (Gmail SMTP 작동 중)

---

## 3. Google Calendar 설정 [선택 사항]

**필수 이유**: 캘린더 기능을 위해 Google Service Account 키 필수

**영향도**: 캘린더 기능 미작동 (다른 기능에는 영향 없음)

### 단계별 절차

1. https://console.cloud.google.com 접속
2. 프로젝트 생성/선택 → **"Google Calendar API"** 활성화
3. **Credentials** → **Service Account** 생성
4. JSON 키 다운로드
5. 키 파일에서 다음 정보 복사:
   - `client_email` → `.env.local` 및 Vercel의 `GOOGLE_SERVICE_ACCOUNT_EMAIL`
   - `private_key` → `.env.local` 및 Vercel의 `GOOGLE_PRIVATE_KEY`
6. 대상 캘린더를 service account 이메일과 공유 (권한: "이벤트 변경 가능")

### 검증 방법
- 캘린더 API 호출 성공 (인증 에러 없음)

### 현재 상태
- **블로킹**: 아니오 (캘린더 기능 아직 필요 없음)

---

## 4. Resend 도메인 검증 (선택 사항 - 미래 이메일 업그레이드용)

**필수 이유**: DNS 레코드 설정 필요 (outsome.co 도메인 인증)

**현황**: 현재 Gmail SMTP 사용 중이므로 필수 아님

### 단계별 절차 (미래 필요 시)

1. https://resend.com 접속 → 대시보드
2. **Domains** → **Add Domain** 클릭
3. `outsome.co` 입력
4. Resend가 제시하는 DNS 레코드 3개 복사:
   - MX 레코드
   - DKIM 레코드
   - SPF 레코드
5. 도메인 등록업체(가비아 등)의 DNS 설정에 추가
6. Resend 대시보드에서 "Verify" 버튼 클릭

### 검증 방법
- Resend 대시보드에서 도메인 상태가 "Verified"로 표시

### 현재 상태
- **블로킹**: 아니오 (Gmail SMTP로 대체 가능)
- **용도**: 임의의 발신자 주소로 이메일 발송 필요할 때 필요

---

## 5. Supabase Storage 버킷 생성 [선택 사항]

**필수 이유**: 파일 업로드 기능을 위해 스토리지 버킷 필수

**영향도**: 파일 업로드 미작동 (다른 기능에는 영향 없음)

### 단계별 절차

Supabase 대시보드 → **Storage**:

1. 버킷 생성: `question-attachments` (Private)
2. 버킷 생성: `post-images` (Private)
3. 버킷 생성: `profile-images` (Public)

### 검증 방법
- 파일 업로드 시 "bucket not found" 에러 없음

### 현재 상태
- **블로킹**: 아니오 (파일 업로드 기능 아직 필요 없음)

---

## 6. Vercel 환경변수 설정 [진행 중 ✅]

**필수 이유**: 배포 환경에서 필요한 모든 설정값 필수

### 완료된 항목
- ✅ GMAIL_USER
- ✅ GMAIL_APP_PASSWORD
- ✅ GOOGLE_SERVICE_ACCOUNT_EMAIL
- ✅ GOOGLE_PRIVATE_KEY
- ✅ GOOGLE_CALENDAR_ID
- ✅ 모든 필수 환경변수 설정 완료

### 현재 상태
- **블로킹**: 아니오 (모두 설정됨)

---

## 요약

| 항목 | 상태 | 블로킹 | 우선순위 |
|------|------|--------|---------|
| LinkedIn OIDC | ⚠️ 필요 | 예 | 1순위 |
| Gmail SMTP | ✅ 완료 | 아니오 | - |
| Google Calendar | 🔲 선택 | 아니오 | 낮음 |
| Resend 검증 | 🔲 선택 | 아니오 | 낮음 |
| Storage 버킷 | 🔲 선택 | 아니오 | 낮음 |
| Vercel 환경변수 | ✅ 완료 | 아니오 | - |
