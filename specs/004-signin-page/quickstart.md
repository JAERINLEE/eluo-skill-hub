# Quickstart: 로그인 페이지 및 로그인 기능

**Feature Branch**: `004-signin-page`
**Date**: 2026-03-03

## Prerequisites

- Node.js 18+
- pnpm (패키지 매니저)
- Supabase 프로젝트 (이미 구성됨)
- `.env.local` 파일에 다음 환경 변수 설정:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (또는 `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`)

## Getting Started

### 1. 브랜치 체크아웃

```bash
git checkout 004-signin-page
```

### 2. 의존성 설치

```bash
pnpm install
```

### 3. Shadcn UI 컴포넌트 설치

```bash
npx shadcn@latest add button input label card --yes
```

### 4. 개발 서버 실행

```bash
pnpm dev
```

### 5. 동작 확인

1. `http://localhost:3000` 접속 → 랜딩 페이지 확인
2. "시작하기" 버튼 클릭 → `/signin` 페이지 이동 확인
3. 등록된 계정으로 로그인 시도
4. 성공 시 `/dashboard` 리다이렉트 확인

## Key File Locations

| 파일 | 역할 |
|------|------|
| `src/app/signin/page.tsx` | 로그인 페이지 라우트 (Server Component) |
| `src/app/signin/actions.ts` | 로그인 Server Action |
| `src/features/auth/SigninForm.tsx` | 로그인 폼 UI (Client Component) |
| `src/auth/domain/types.ts` | 인증 도메인 타입 정의 |
| `src/auth/application/signin-use-case.ts` | 로그인 유즈케이스 |
| `src/auth/infrastructure/supabase-auth-repository.ts` | Supabase 인증 구현체 |
| `middleware.ts` | 세션 갱신 미들웨어 |
| `components.json` | Shadcn UI 설정 |

## Testing

### Unit Tests

```bash
pnpm test -- --testPathPattern="auth"
```

### E2E Tests

```bash
pnpm exec playwright test src/__tests__/e2e/signin.spec.ts
```

## Test Account

Supabase Dashboard에서 테스트 계정을 생성하거나, 기존 등록된 계정을 사용한다.
