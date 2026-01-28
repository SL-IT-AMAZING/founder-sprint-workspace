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

## 5. 결론

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
