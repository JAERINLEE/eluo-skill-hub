# Implementation Plan: 탭/브라우저 종료 시 자동 로그아웃

**Branch**: `024-fix-session-persistence` | **Date**: 2026-03-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/024-fix-session-persistence/spec.md`

## Summary

현재 Supabase Auth의 영속적 쿠키로 인해 브라우저/탭 종료 후에도 세션이 유지되는 문제를 해결한다. `beforeunload` 이벤트 + `navigator.sendBeacon`을 활용한 탭 종료 시 자동 로그아웃과, 세션 쿠키(maxAge 없음)로의 전환을 통한 이중 보호 메커니즘을 구현한다.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode)
**Primary Dependencies**: Next.js 16.1.6 (App Router), @supabase/ssr ^0.8.0, @supabase/supabase-js ^2.98.0
**Storage**: Supabase (PostgreSQL) — auth.sessions (변경 없음)
**Testing**: Playwright (E2E), Jest + React Testing Library (Unit)
**Target Platform**: Web (브라우저)
**Project Type**: Web application (Next.js)
**Performance Goals**: `beforeunload` 핸들러가 탭 종료를 차단하지 않아야 함 (sendBeacon은 비동기)
**Constraints**: `sendBeacon`은 POST만 지원, payload 크기 제한 64KB
**Scale/Scope**: 단일 기능 변경, 4개 파일 수정/생성

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Type Safety | PASS | 모든 새 코드에 명시적 타입 사용, `any` 사용 없음 |
| II. Clean Architecture | PASS | Route Handler는 `src/app/api/`에, 클라이언트 컴포넌트는 `src/features/auth/`에 배치. 인프라 변경은 `src/shared/infrastructure/`에 한정 |
| III. Test Coverage | PASS | E2E 테스트(Playwright)로 탭 종료/재접속 시나리오 검증 |
| IV. Feature Module Isolation | PASS | auth 도메인 내에서 자체 완결, 다른 모듈 의존 없음 |
| V. Security-First | PASS | 서버 사이드에서 `auth.signOut()` 호출로 세션 무효화, 클라이언트만의 쿠키 삭제에 의존하지 않음 |

## Project Structure

### Documentation (this feature)

```text
specs/024-fix-session-persistence/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── signout-api.md   # Route Handler contract
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── signout/
│   │           └── route.ts          # (신규) sendBeacon용 로그아웃 Route Handler
│   └── (portal)/
│       └── layout.tsx                # SessionCleanupProvider 삽입
├── features/
│   └── auth/
│       └── SessionCleanupProvider.tsx # (신규) beforeunload 이벤트 핸들러
└── shared/
    └── infrastructure/
        └── supabase/
            └── server.ts             # 쿠키 옵션 변경 (maxAge 제거)
```

**Structure Decision**: 기존 clean architecture 구조를 따라 Route Handler는 `src/app/api/auth/`, 클라이언트 컴포넌트는 `src/features/auth/`, 인프라 변경은 `src/shared/infrastructure/supabase/`에 배치한다.

## Complexity Tracking

> 위반 사항 없음. 모든 Constitution 원칙 준수.
