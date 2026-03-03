# Research: 로그인 페이지 및 로그인 기능

**Feature Branch**: `004-signin-page`
**Date**: 2026-03-03

## R-001: Supabase Auth — 이메일/패스워드 인증 패턴

### Decision

`@supabase/ssr`의 Server Client를 Server Action 내에서 생성하고 `signInWithPassword()`를 호출한다. 쿠키 기반 세션은 `@supabase/ssr`이 자동으로 관리한다.

### Rationale

- `@supabase/ssr` v0.8.0은 Next.js App Router의 `cookies()` API와 통합되어 서버 사이드에서 안전하게 세션을 관리한다.
- Server Action에서 인증을 처리하면 자격 증명이 클라이언트 번들에 노출되지 않는다 (Constitution V: Security-First).
- `signInWithPassword()`는 이메일/패스워드 인증에 특화된 Supabase Auth 메서드로, 별도의 설정 없이 즉시 사용 가능하다.

### Code Pattern

```typescript
// src/app/signin/actions.ts (Server Action)
"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/shared/infrastructure/supabase/server";

export async function signin(formData: FormData) {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });
  if (error) {
    return { error: "이메일 또는 비밀번호가 올바르지 않습니다" };
  }
  redirect("/dashboard");
}
```

### Alternatives Considered

| Alternative | Rejected Because |
|------------|-----------------|
| API Route Handler (POST /api/auth/signin) | Server Action이 폼 제출과 자연스럽게 통합되며 추가 클라이언트 fetch 불필요 |
| Client-side signInWithPassword | 자격 증명 처리를 클라이언트에서 하면 보안 원칙 위반 가능성 |
| Magic Link (signInWithOtp) | 스펙 범위가 이메일/패스워드만 포함 |

---

## R-002: Shadcn UI 설치 — Tailwind CSS v4 환경

### Decision

`components.json`을 수동 생성 후 `npx shadcn@latest add` CLI로 Button, Input, Label, Card 컴포넌트를 설치한다. 컴포넌트 경로를 `@/shared/ui`로 설정하여 기존 프로젝트 구조와 일치시킨다.

### Rationale

- Shadcn v3.8.5 (devDependencies에 이미 존재)는 Tailwind v4를 지원한다.
- `globals.css`에 이미 Shadcn 테마 토큰(`--background`, `--foreground`, `--radius` 등)이 정의되어 있어 추가 스타일링 설정이 불필요하다.
- 컴포넌트를 `src/shared/ui/`에 배치하면 Constitution IV(Feature Module Isolation)의 공유 추상화 규칙을 준수한다.

### Code Pattern

```json
// components.json (프로젝트 루트)
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true
  },
  "aliases": {
    "components": "@/shared/ui",
    "utils": "@/lib/utils",
    "hooks": "@/hooks",
    "lib": "@/lib",
    "ui": "@/shared/ui"
  }
}
```

```bash
npx shadcn@latest add button input label card --yes
```

### Alternatives Considered

| Alternative | Rejected Because |
|------------|-----------------|
| 수동 컴포넌트 작성 | CLI가 Radix 기반 접근성 보장 컴포넌트를 자동 생성하므로 수동 작성은 비효율적 |
| 컴포넌트를 src/components/ui에 배치 | 기존 프로젝트의 `src/shared/ui/` 패턴과 불일치 |
| Headless UI 사용 | shadcn이 스펙에서 명시적으로 요구됨 |

---

## R-003: Next.js 미들웨어 — 세션 갱신 및 인증 라우팅

### Decision

프로젝트 루트에 `middleware.ts`를 생성하여 Supabase 세션 쿠키를 자동 갱신하고, 인증 상태에 따라 라우트를 보호한다.

### Rationale

- `@supabase/ssr`의 세션은 쿠키 기반이므로 모든 요청에서 미들웨어가 쿠키를 갱신해야 세션이 만료되지 않는다.
- 미들웨어에서 인증 상태를 확인하면 Server Component보다 빠르게 리다이렉트를 처리할 수 있다.
- 인증된 사용자의 `/signin` 접근 차단과, 미인증 사용자의 보호된 경로 접근 차단을 단일 지점에서 처리한다.

### Code Pattern

```typescript
// middleware.ts (프로젝트 루트)
import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, options);
          });
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();

  // 인증된 사용자 → /signin 접근 시 대시보드로 리다이렉트
  if (user && request.nextUrl.pathname === "/signin") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
```

### Alternatives Considered

| Alternative | Rejected Because |
|------------|-----------------|
| Server Component에서 리다이렉트 | 미들웨어가 더 빠르고, 세션 갱신 로직을 한 곳에 집중 가능 |
| API Route를 통한 세션 확인 | 추가 네트워크 요청 발생, 미들웨어가 더 효율적 |
| 미들웨어 없이 각 페이지에서 처리 | 코드 중복, 세션 갱신 누락 위험 |

---

## R-004: 로그인 폼 — 클라이언트/서버 분리 패턴

### Decision

로그인 페이지를 Server Component(`page.tsx`)로, 폼 UI를 Client Component(`SigninForm.tsx`)로 분리한다. Client Component에서 `useActionState`(React 19)를 사용하여 Server Action을 호출하고 폼 상태를 관리한다.

### Rationale

- Server Component에서 인증 상태를 사전 확인하여 미들웨어 외 이중 방어 제공
- Client Component에서 클라이언트 측 유효성 검증과 로딩 상태 관리 가능
- `useActionState`는 React 19의 공식 패턴으로, 서버 응답(에러 메시지)을 폼 상태에 자연스럽게 통합

### Code Pattern

```typescript
// src/app/signin/page.tsx (Server Component)
export default function SigninPage() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <SigninForm />
    </div>
  );
}

// src/features/auth/SigninForm.tsx (Client Component)
"use client";
import { useActionState } from "react";
import { signin } from "@/app/signin/actions";

export function SigninForm() {
  const [state, formAction, isPending] = useActionState(signin, { error: "" });
  return (
    <form action={formAction}>
      {/* 이메일/패스워드 필드 + 제출 버튼 */}
      {state.error && <p className="text-destructive">{state.error}</p>}
    </form>
  );
}
```

### Alternatives Considered

| Alternative | Rejected Because |
|------------|-----------------|
| 전체 페이지를 Client Component로 | 서버 사이드 인증 상태 확인 불가, SEO 불리 |
| useFormStatus만 사용 | 서버 응답(에러 메시지)을 폼 상태에 반영하려면 useActionState 필요 |
| fetch + useState 패턴 | Server Action이 폼 제출과 직접 통합되어 더 간결 |

---

## R-005: Supabase DB — 기존 스키마 분석 결과

### Decision

기존 `profiles` 및 `roles` 테이블을 그대로 사용한다. 스키마 변경 불필요.

### Rationale

분석 결과 필요한 모든 요소가 이미 구현되어 있다:

- **profiles 테이블**: `id`(auth.users FK), `email`, `created_at`, `role_id`(roles FK, default: user)
- **roles 테이블**: admin, user 두 역할 존재
- **handle_new_user() 트리거**: auth.users INSERT 시 profiles 자동 생성
- **is_admin() 함수**: 관리자 권한 확인 유틸리티
- **RLS 정책**: 사용자는 자신의 프로필만 조회/수정, 관리자는 모든 프로필 조회/역할 수정 가능
- **roles RLS**: 인증된 사용자는 역할 목록 조회 가능

### Alternatives Considered

해당 없음 — 기존 스키마가 요구사항을 완전히 충족
