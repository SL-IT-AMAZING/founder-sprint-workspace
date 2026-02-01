# POC 검증 리포트

**작성일**: 2026년 1월 22일  
**POC 위치**: `/Users/cosmos/fs/dev_poc/poc-test`

---

## 1. 검증 요약

| POC 항목 | 결과 | 발견 사항 |
|----------|------|----------|
| Next.js + Supabase SSR | ✅ 성공 | `cookies()`는 `await` 필요 (Next.js 15+) |
| LinkedIn OIDC | ✅ 성공 | `linkedin_oidc` 프로바이더 사용 필수 |
| Tailwind CSS 4 | ✅ 성공 | `@theme inline {}` 블록 사용 |
| Prisma 7 | ✅ 성공 | **BREAKING**: `prisma.config.ts` 필수 |
| Google Calendar API | ✅ 성공 | TypeScript 타입 정상 동작 |
| Server Actions | ✅ 성공 | `useActionState` + Zod 4.x 호환 |

---

## 2. 원래 계획서 대비 발견된 오류 (할루시네이션)

### 2.1 패키지 버전 오류 (치명적)

| 패키지 | 원래 계획서 | 실제 최신 | 상태 |
|--------|------------|----------|------|
| next | 15.1.6 | **16.1.4** | ❌ 오류 |
| react | 19.0.0 | **19.2.3** | ❌ 오류 |
| @supabase/supabase-js | 2.49.1 | **2.91.0** | ❌ 오류 |
| @supabase/ssr | 0.5.2 | **0.8.0** | ❌ 오류 |
| prisma | 6.3.0 | **7.3.0** | ❌ 오류 |
| @prisma/client | 6.3.0 | **7.3.0** | ❌ 오류 |
| googleapis | 146.0.0 | **170.1.0** | ❌ 오류 |
| tailwindcss | 4.x | **4.1.18** | ✅ 정확 |
| zod | 3.24.1 | **4.3.5** | ❌ 오류 |

### 2.2 Prisma 7 Breaking Change (치명적)

**원래 계획서**:
```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

**실제 Prisma 7**:
- `url`과 `directUrl`은 schema.prisma에서 **더 이상 지원 안됨**
- `prisma.config.ts` 파일 필수

**수정된 코드**:
```typescript
// prisma.config.ts
import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    url: env("DATABASE_URL"),
  },
});
```

```prisma
// schema.prisma - url 제거
datasource db {
  provider = "postgresql"
}
```

### 2.3 Zod 4.x API 변경

**원래 코드**:
```typescript
result.error.errors[0].message
```

**Zod 4.x 수정**:
```typescript
result.error.issues[0]?.message
```

### 2.4 Tailwind CSS 4 @theme 문법

**원래 계획서**:
```css
@theme {
  --color-cream: #fefaf3;
}
```

**실제 Tailwind 4.1**:
```css
@theme inline {
  --color-cream: #fefaf3;
}
```
`inline` 키워드 추가 필요 (create-next-app 기본 생성 확인)

### 2.5 PrismaClient 생성자 변경

**원래 코드**:
```typescript
new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
  log: ["query"],
});
```

**Prisma 7 수정**:
```typescript
new PrismaClient({
  log: ["query"],
});
// datasourceUrl은 prisma.config.ts에서 설정
```

---

## 3. POC 빌드 로그

```
▲ Next.js 16.1.4 (Turbopack)
- Environments: .env

✓ Compiled successfully in 2.0s
✓ Running TypeScript ...
✓ Generating static pages (7/7) in 223.0ms

Route (app)
├ ○ /
├ ○ /_not-found
├ ƒ /auth/callback
├ ○ /login
└ ○ /test-action

ƒ Proxy (Middleware)
```

---

## 4. 검증된 코드 패턴

### 4.1 Supabase Server Client (Next.js 16)
```typescript
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies(); // await 필수!
  
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}
```

### 4.2 LinkedIn OIDC 인증
```typescript
const { data, error } = await supabase.auth.signInWithOAuth({
  provider: "linkedin_oidc", // 반드시 linkedin_oidc
  options: {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`,
  },
});
```

### 4.3 Tailwind CSS 4 테마
```css
@import "tailwindcss";

@theme inline {
  --color-cream: #fefaf3;
  --font-body: "BDO Grotesk", Arial, sans-serif;
}
```

### 4.4 useActionState 패턴
```typescript
"use client";
import { useActionState } from "react";

const [state, formAction, pending] = useActionState(serverAction, initialState);
```

---

## 5. LinkedIn OIDC 프로필 데이터 제한사항

### 5.1 가져올 수 있는 데이터 (Sign In with LinkedIn 기본)

| 필드 | OpenID Connect Claim | 설명 |
|------|---------------------|------|
| 이름 | `name`, `given_name`, `family_name` | ✅ 자동 수집 |
| 이메일 | `email`, `email_verified` | ✅ 자동 수집 |
| 프로필 사진 | `picture` | ✅ 자동 수집 |
| LinkedIn 프로필 URL | `sub` (LinkedIn member ID) | ✅ 자동 수집 |

### 5.2 가져올 수 없는 데이터

| 필드 | 사유 | 대안 |
|------|------|------|
| 직함 (Job Title) | LinkedIn Partner Program 필요 (승인 2~6개월, 보장 없음) | **수동 입력** |
| 회사 (Company) | LinkedIn Partner Program 필요 | **수동 입력** |
| 산업 (Industry) | LinkedIn Partner Program 필요 | **수동 입력** |
| 경력 (Experience) | LinkedIn Partner Program + r_liteprofile 스코프 필요 | MVP 제외 |
| 학력 (Education) | LinkedIn Partner Program 필요 | MVP 제외 |
| 연결 수 (Connections) | API 미제공 | MVP 제외 |

### 5.3 MVP 결정사항

| 항목 | 결정 | 근거 |
|------|------|------|
| 프로필 기본 정보 | LinkedIn OIDC 자동 수집 | name, email, picture |
| 직함/회사/소개 | **수동 입력** (프로필 설정 화면) | Partner Program 승인 불확실 |
| 확장 가능 구조 | User 모델에 `job_title`, `company`, `bio` 필드 추가 | 나중에 자동화 전환 가능 |

### 5.4 향후 자동화 경로

```
현재 (MVP): LinkedIn OIDC → name, email, picture 자동 + job_title, company, bio 수동 입력
향후 옵션 1: LinkedIn Partner Program 승인 → API로 직함/회사 자동 수집
향후 옵션 2: 웹 크롤링 (LinkedIn 프로필 URL 기반) → 법적 리스크 검토 필요
향후 옵션 3: 사용자가 직접 LinkedIn 프로필 URL 입력 → 공개 정보 파싱
```

### 5.5 구현 시 주의사항

1. **User 모델 필드**: `job_title`, `company`, `bio`는 nullable (Optional)
2. **온보딩 플로우**: 첫 로그인 후 프로필 완성 화면으로 리다이렉트
3. **프로필 설정**: `/settings` 화면에서 수동 입력/수정 가능
4. **표시 로직**: 직함/회사가 없으면 "미입력" 표시 (빈칸 아님)

---

## 6. 결론

원래 계획서에는 **8개의 할루시네이션/오류**가 있었음:
1. Next.js 버전 오류
2. React 버전 오류  
3. Supabase 패키지 버전 오류
4. Prisma 버전 오류
5. Prisma 7 Breaking Change 미반영
6. googleapis 버전 오류
7. Zod 버전 및 API 변경 미반영
8. Tailwind @theme inline 키워드 누락

**모든 오류가 POC를 통해 발견되어 수정됨.**
