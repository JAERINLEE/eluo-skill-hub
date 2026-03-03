# Implementation Plan: 회원가입 페이지

**Branch**: `005-signup-page` | **Date**: 2026-03-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-signup-page/spec.md`

## Summary

eluocnc.com 도메인 이메일만 허용하는 회원가입 페이지(`/signup`)를 구현한다. Supabase Auth의 `signUp()` + `verifyOtp()` 흐름을 사용하여 이메일/비밀번호 입력 → 8자리 OTP 인증코드 발송 → 인증코드 확인 → 회원가입 완료의 2단계 플로우를 제공한다. 기존 auth 도메인 모듈의 Clean Architecture 패턴(domain/application/infrastructure)을 확장하여 구현한다.

## Technical Context

**Language/Version**: TypeScript (strict mode) — `any` 금지
**Primary Dependencies**: Next.js 16.1.6 (App Router), React 19.2.3, @supabase/ssr ^0.8.0, @supabase/supabase-js ^2.98.0, Shadcn UI, Tailwind CSS v4
**Storage**: Supabase (PostgreSQL) — auth.users(Supabase Auth 관리), public.profiles, public.roles
**Testing**: Jest ^30.2.0 + React Testing Library ^16.3.2 (단위), Playwright ^1.58.2 (E2E)
**Target Platform**: Web (Next.js on Vercel)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: 회원가입 전체 과정 3분 이내, OTP 발송 30초 이내
**Constraints**: eluocnc.com 도메인 이메일만 허용, 비밀번호 최소 8자, OTP 8자리 숫자 (10분 유효)
**Scale/Scope**: 사내 서비스 (eluocnc.com 직원 대상)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Type Safety | PASS | 모든 타입을 명시적으로 정의 (SignupCredentials, VerifyOtpCredentials, 결과 타입 등). `any` 사용 없음 |
| II. Clean Architecture | PASS | 기존 `src/auth/` 모듈에 domain/application/infrastructure 레이어 확장. 인프라 레이어만 Supabase 의존 |
| III. Test Coverage | PASS | 유스케이스 단위 테스트 + SignupForm 컴포넌트 테스트 + E2E 테스트 계획 포함 |
| IV. Feature Module Isolation | PASS | auth 도메인 내에서 구현. 공유 타입은 `src/shared/`에 배치. 크로스 도메인 import 없음 |
| V. Security-First | PASS | 이메일 도메인 검증은 서버 사이드에서 재검증. RLS 활성화 상태 유지. Server Action으로 인증 처리 |

**Post-Phase 1 Re-check**: PASS — 데이터 모델 변경 없음, 기존 RLS 정책 유지, 모든 인증 로직 서버 사이드 처리

## Project Structure

### Documentation (this feature)

```text
specs/005-signup-page/
├── spec.md
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── auth-signup.md
├── checklists/
│   └── requirements.md
└── tasks.md             # /speckit.tasks 명령으로 생성
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── signup/
│   │   ├── page.tsx                    # 회원가입 페이지 (Server Component)
│   │   └── actions.ts                  # Server Actions
│   └── signin/                         # 기존
├── auth/
│   ├── domain/
│   │   └── types.ts                    # 기존 + signup 타입 확장
│   ├── application/
│   │   ├── signin-use-case.ts          # 기존
│   │   ├── signup-use-case.ts          # 신규
│   │   ├── verify-otp-use-case.ts      # 신규
│   │   ├── resend-otp-use-case.ts      # 신규
│   │   └── __tests__/
│   │       ├── signup-use-case.test.ts
│   │       └── verify-otp-use-case.test.ts
│   └── infrastructure/
│       └── supabase-auth-repository.ts # 기존 + signUp/verifyOtp/resendOtp 추가
├── features/
│   ├── auth/
│   │   ├── SigninForm.tsx              # 기존
│   │   ├── SignupForm.tsx              # 신규
│   │   └── __tests__/
│   │       └── SignupForm.test.tsx
│   └── root-page/                      # 기존
├── shared/                             # 기존 (변경 없음)
└── __tests__/
    └── e2e/
        ├── landing-page.spec.ts        # 기존
        └── signup.spec.ts              # 신규

middleware.ts                           # 기존 + /signup 경로 처리 추가
```

**Structure Decision**: 기존 Next.js App Router + Clean Architecture 패턴을 따름. auth 도메인 모듈 내에서 signup 관련 코드를 확장. 신규 도메인 모듈 생성 없음.

## Complexity Tracking

> 헌법 위반 사항 없음 — 테이블 비어 있음

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (없음) | - | - |
