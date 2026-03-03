# Implementation Plan: 로그인 페이지 디자인 리뉴얼

**Branch**: `006-signin-page-design` | **Date**: 2026-03-03 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/006-signin-page-design/spec.md`

## Summary

기존 로그인 페이지(`src/app/signin/page.tsx` + `src/features/auth/SigninForm.tsx`)의 UI를 signin.html 레퍼런스 디자인 기반으로 리뉴얼한다. 핵심 변경: (1) 상단 헤더 추가(eluo-logo.svg + font-eluo 타이틀), (2) 글래스모피즘 카드 스타일 적용, (3) BackgroundBeamsWithCollision 배경 애니메이션 통합(framer-motion 의존성 추가), (4) 비밀번호 표시/숨기기 토글 추가. 기존 인증 로직(Server Action, useActionState, Clean Architecture)은 변경하지 않는다.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode, `any` 금지)
**Primary Dependencies**: Next.js 16.1.6 (App Router), React 19.2.3, Tailwind CSS v4, Shadcn UI, Radix UI, lucide-react 0.576.0, **framer-motion (신규 추가)**
**Storage**: N/A (순수 UI 변경, 데이터 모델 변경 없음)
**Testing**: Jest + React Testing Library (단위), Playwright (E2E)
**Target Platform**: 웹 브라우저 (모바일 375px ~ 데스크톱 1920px)
**Project Type**: web-service (Next.js App Router)
**Performance Goals**: FCP 2초 이내, 애니메이션 60fps 목표
**Constraints**: framer-motion 번들 크기 최소화 (dynamic import 활용), backdrop-filter 미지원 브라우저 폴백
**Scale/Scope**: 단일 페이지(signin) 디자인 변경, 약 5개 파일 수정/생성

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Type Safety | PASS | 모든 새 컴포넌트는 명시적 타입 사용. BackgroundBeamsWithCollision 컴포넌트의 props 인터페이스 정의 완료. `any` 미사용 |
| II. Clean Architecture | PASS | 순수 UI 변경. domain/application 계층 변경 없음. 새 UI 컴포넌트는 `src/shared/ui/`(공용) 또는 `src/features/auth/`(인증 전용)에 배치 |
| III. Test Coverage | PASS | SigninForm 리뉴얼에 대한 단위 테스트 업데이트 필요. E2E 테스트로 시각적 렌더링 검증 |
| IV. Feature Module Isolation | PASS | 인증 도메인 내 UI 변경. 다른 모듈 의존성 없음. 공용 컴포넌트(BackgroundBeamsWithCollision)는 `src/shared/ui/`에 배치 |
| V. Security-First | PASS | 인증 로직 변경 없음. Server Action, RLS 정책 그대로 유지 |
| Tech Stack: framer-motion 추가 | JUSTIFIED | BackgroundBeamsWithCollision 컴포넌트가 framer-motion에 의존. 기존 tw-animate-css로는 복잡한 충돌 감지/파티클 애니메이션 구현 불가 |

## Project Structure

### Documentation (this feature)

```text
specs/006-signin-page-design/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output (minimal - UI only)
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── app/
│   ├── signin/
│   │   ├── page.tsx              # [MODIFY] 헤더 + BackgroundBeamsWithCollision 래퍼 추가
│   │   └── actions.ts            # [UNCHANGED] 기존 서버 액션 유지
│   ├── globals.css               # [MODIFY] glass-card 유틸리티 클래스 추가
│   └── layout.tsx                # [UNCHANGED] 폰트 설정 이미 완료
├── features/
│   └── auth/
│       ├── SigninForm.tsx         # [MODIFY] 글래스모피즘 카드, 비밀번호 토글, 브랜드 아이콘 적용
│       └── __tests__/
│           └── SigninForm.test.tsx # [MODIFY] 리뉴얼된 UI에 맞게 테스트 업데이트
├── shared/
│   └── ui/
│       └── background-beams-with-collision.tsx  # [NEW] 배경 애니메이션 컴포넌트
└── lib/
    └── utils.ts                  # [UNCHANGED] cn 유틸리티 이미 존재
```

**Structure Decision**: 기존 Next.js App Router + Clean Architecture 구조를 유지한다. BackgroundBeamsWithCollision은 인증 도메인에 국한되지 않는 범용 UI 컴포넌트이므로 `src/shared/ui/`에 배치한다. 헤더는 로그인 페이지 전용이므로 `src/app/signin/page.tsx` 내에 인라인으로 구현하되, 향후 공용화가 필요하면 `src/shared/ui/`로 분리한다.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| framer-motion 신규 의존성 | BackgroundBeamsWithCollision 컴포넌트의 애니메이션(빛줄기 이동, 충돌 감지, 파티클 폭발)에 필수 | CSS 애니메이션/tw-animate-css만으로는 충돌 감지 기반 동적 애니메이션 구현 불가. Intersection Observer로 대체 시 파티클 폭발 효과 구현이 복잡해짐 |
