# Implementation Plan: 회원가입 페이지 — 중복 이메일 분기 처리 및 인증 리다이렉트

**Branch**: `007-signup-page` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/007-signup-page/spec.md`

## Summary

이미 가입 완료(이메일 인증 완료)된 이메일로 회원가입을 시도할 때, OTP 인증 화면 대신 별도 글래스카드 뷰("이미 가입된 이메일입니다" + 로그인 이동 버튼 + "다른 이메일로 가입하기" 링크)를 표시한다. 미인증 이메일은 기존 OTP 단계를 유지한다. 또한 인증된 사용자가 `/signin`, `/signup`에 접근하면 `proxy.ts`가 `/dashboard`로 리다이렉트한다.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode, `any` 금지)
**Primary Dependencies**: Next.js 16.1.6 (App Router), React 19.2.3, @supabase/ssr ^0.8.0, @supabase/supabase-js ^2.98.0, Shadcn UI, Tailwind CSS v4
**Storage**: Supabase (PostgreSQL) — `auth.users` (Supabase Auth 관리), `user_metadata.display_name`
**Testing**: Jest + React Testing Library (단위/컴포넌트), Playwright (E2E)
**Target Platform**: Web (브라우저)
**Project Type**: web-service (Next.js App Router)
**Performance Goals**: N/A (순수 UI/로직 변경)
**Constraints**: `eluocnc.com` 이메일 도메인만 허용, 비밀번호 최소 8자
**Scale/Scope**: 단일 페이지 (`/signup`) 내 상태 분기 추가 + 미들웨어 위치 수정

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Type Safety | PASS | 새 `step` 타입 `"duplicate"` 추가 시 discriminated union 유지, `any` 미사용 |
| II. Clean Architecture | PASS | domain → application → infrastructure 레이어 분리 유지. `SignupActionState`에 새 step 추가는 domain 타입 변경 |
| III. Test Coverage | PASS | `SignupForm.test.tsx`에 중복 이메일 카드 뷰 테스트 추가, `signup-use-case.test.ts` 기존 테스트 유지 |
| IV. Feature Module Isolation | PASS | `auth` 모듈 내부 변경만 발생, 외부 모듈 의존 없음 |
| V. Security-First | PASS | 서버 액션에서 Supabase `getUser()` 검증 유지, `proxy.ts`에서 인증 분기 처리 |
| Tech Stack | PASS | 기존 스택 내 변경, 신규 의존성 없음 |

## Project Structure

### Documentation (this feature)

```text
specs/007-signup-page/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (변경 대상)

```text
src/
├── proxy.ts                                    # [이동 완료] 인증 분기 미들웨어
├── auth/
│   ├── domain/
│   │   └── types.ts                           # [수정] SignupActionState.step에 "duplicate" 추가
│   ├── application/
│   │   ├── signup-use-case.ts                 # [변경 없음]
│   │   └── __tests__/
│   │       └── signup-use-case.test.ts        # [변경 없음]
│   └── infrastructure/
│       └── supabase-auth-repository.ts        # [변경 없음] 이미 인증완료 이메일 구분 로직 구현됨
├── features/
│   └── auth/
│       ├── SignupForm.tsx                     # [수정] 중복 이메일 별도 카드 뷰 추가
│       └── __tests__/
│           └── SignupForm.test.tsx            # [수정] 중복 이메일 카드 뷰 테스트 추가
├── app/
│   ├── signup/
│   │   ├── page.tsx                          # [변경 없음]
│   │   └── actions.ts                        # [수정] 중복 이메일 시 step: "duplicate" 반환
│   └── dashboard/
│       └── page.tsx                          # [생성 완료] 플레이스홀더
```

**Structure Decision**: 기존 Clean Architecture 구조 유지. `auth` 모듈 내 도메인 타입 확장 + 프레젠테이션 레이어(SignupForm) 수정으로 구현.

## Implementation Approach

### 변경 1: 도메인 타입 확장

`SignupActionState.step`에 `"duplicate"` 리터럴 추가:

```typescript
// src/auth/domain/types.ts
export interface SignupActionState {
  error: string;
  step: "form" | "verify" | "duplicate";  // "duplicate" 추가
  email: string;
}
```

### 변경 2: 서버 액션 분기 로직

`src/app/signup/actions.ts`의 `signup()` 함수에서 중복 이메일 에러 감지 시 `step: "duplicate"` 반환:

```typescript
// 기존: !result.success → { error: result.error, step: "form", email: "" }
// 변경: 중복 이메일 에러 → { error: result.error, step: "duplicate", email: "" }
if (!result.success) {
  if (result.error === "이미 가입된 이메일입니다") {
    return { error: result.error, step: "duplicate", email: "" };
  }
  return { error: result.error, step: "form", email: "" };
}
```

### 변경 3: 중복 이메일 별도 카드 뷰 (SignupForm)

`SignupForm.tsx`에 `step === "duplicate"` 분기 추가. OTP 카드와 동일한 글래스카드 스타일로:
- 아이콘 (👤)
- 제목: "이미 가입된 이메일입니다"
- 안내 메시지
- 로그인 이동 버튼 (`/signin` Link)
- "다른 이메일로 가입하기" 링크 (폼으로 복귀, 빈 폼 초기화)

### 변경 4: 기존 인라인 오류 제거

`SignupForm.tsx`에서 `isDuplicateEmailError` 관련 인라인 오류 표시 로직 제거 (별도 카드 뷰로 대체됨).

### 미들웨어 (완료)

`proxy.ts`를 `src/proxy.ts`로 이동 완료. 인증된 사용자의 `/signin`, `/signup` 접근 시 `/dashboard` 리다이렉트 동작 확인됨.

## Complexity Tracking

> 이번 변경에 Constitution 위반 사항 없음. Complexity Tracking 해당 없음.
