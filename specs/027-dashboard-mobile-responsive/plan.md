# Implementation Plan: Dashboard Mobile Responsive

**Branch**: `027-dashboard-mobile-responsive` | **Date**: 2026-03-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/027-dashboard-mobile-responsive/spec.md`

## Summary

대시보드 페이지(`/dashboard`)를 모바일 반응형으로 구현한다. 현재 사이드바가 고정 `w-72`로 항상 표시되어 모바일에서 콘텐츠 영역을 사용할 수 없는 문제를 해결하고, 검색바/헤더/스킬 카드 그리드의 패딩과 크기를 모바일에 맞게 조정한다. Tailwind CSS의 `md:` 브레이크포인트(768px)를 기준으로 모바일/데스크톱 레이아웃을 분리하며, 사이드바는 모바일에서 오버레이 방식 토글로 전환한다.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode, `any` 금지)
**Primary Dependencies**: Next.js 16.1.6 (App Router), React 19.2.3, Tailwind CSS v4, Shadcn UI, lucide-react
**Storage**: N/A (순수 프론트엔드 UI 변경, DB 스키마 변경 없음)
**Testing**: Playwright (E2E 모바일/데스크톱 뷰포트 테스트)
**Target Platform**: 웹 브라우저 (모바일: 375px+, 데스크톱: 768px+)
**Project Type**: web-service (Next.js App Router)
**Performance Goals**: 사이드바 토글 애니메이션 300ms 이내
**Constraints**: 데스크톱 기존 레이아웃 변경 없음, 가로 스크롤 없음
**Scale/Scope**: 6개 컴포넌트 수정 (DashboardLayoutClient, DashboardSidebar, DashboardHeader, DashboardSearchBar, DashboardSkillGrid, DashboardSkillCard)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Type Safety | PASS | 모든 새 props/state에 명시적 타입 지정 (sidebarOpen: boolean, toggleSidebar: () => void) |
| II. Clean Architecture | PASS | 순수 UI 변경 — domain/application/infrastructure 계층 수정 없음. 변경은 `src/features/dashboard/` UI 컴포넌트에만 국한 |
| III. Test Coverage | PASS | Playwright E2E 테스트로 모바일/데스크톱 뷰포트 검증 계획 |
| IV. Feature Module Isolation | PASS | dashboard 모듈 내 컴포넌트만 수정. 타 모듈 의존성 추가 없음 |
| V. Security-First | PASS | UI 전용 변경 — 인증/권한 로직 변경 없음 |
| Tech Stack | PASS | Tailwind CSS v4 반응형 유틸리티만 사용. 신규 의존성 없음 |

## Project Structure

### Documentation (this feature)

```text
specs/027-dashboard-mobile-responsive/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── quickstart.md        # Phase 1 output
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/features/dashboard/
├── DashboardLayoutClient.tsx   # 사이드바 토글 상태 관리 + 모바일 오버레이 래퍼
├── DashboardSidebar.tsx        # 모바일: 오버레이 슬라이드인, 데스크톱: 고정 사이드바
├── DashboardHeader.tsx         # 모바일: 햄버거 버튼 추가, 콤팩트 높이/패딩
├── DashboardSearchBar.tsx      # 모바일: 제목 크기, 입력 패딩, 버튼 배치 조정
├── DashboardSkillGrid.tsx      # 모바일: 패딩/간격 축소
└── DashboardSkillCard.tsx      # 모바일: 카드 패딩 축소

src/__tests__/e2e/
└── dashboard-mobile.spec.ts    # Playwright 모바일/데스크톱 반응형 테스트
```

**Structure Decision**: 기존 `src/features/dashboard/` 컴포넌트에 Tailwind 반응형 클래스를 추가하는 방식. 새 파일 생성은 Playwright 테스트 파일 1개만 필요.

## Design Decisions

### D1: 사이드바 토글 방식

**Decision**: `DashboardLayoutClient`에 `sidebarOpen` state를 추가하고, 모바일에서만 오버레이 토글로 동작하도록 구현
**Rationale**: 사이드바 상태가 헤더(햄버거 버튼)와 사이드바(오버레이) 양쪽에서 필요하므로, 이미 두 컴포넌트를 포함하는 DashboardLayoutClient에서 관리하는 것이 자연스러움
**Alternatives rejected**: 별도 MobileSidebar 컴포넌트 생성 — 코드 중복 발생, 카테고리/탭 로직 재구현 필요

### D2: 반응형 브레이크포인트 전략

**Decision**: Tailwind `md:` (768px) 단일 브레이크포인트로 모바일/데스크톱 분리
**Rationale**: 기존 코드가 이미 `md:grid-cols-2`, `lg:grid-cols-3`을 사용하고 있어 일관성 유지. 태블릿은 데스크톱 레이아웃 유지
**Alternatives rejected**: 3단계 브레이크포인트(sm/md/lg) — 태블릿 전용 디자인 요구사항 없으므로 불필요한 복잡성

### D3: 오버레이 구현 방식

**Decision**: CSS `transform: translateX(-100%)` + `transition` + `fixed` positioning
**Rationale**: Tailwind CSS v4의 내장 유틸리티(`-translate-x-full`, `translate-x-0`, `transition-transform`, `duration-300`)로 구현 가능. 별도 애니메이션 라이브러리 불필요
**Alternatives rejected**: framer-motion 사용 — 이미 프로젝트에 있지만 단순 슬라이드 애니메이션에 과도함

### D4: 검색바 모바일 레이아웃

**Decision**: 검색 버튼을 입력 필드 아래로 이동하는 대신, 버튼 크기를 축소하고 입력 필드 내부에 유지
**Rationale**: 데스크톱과 동일한 구조를 유지하면서 패딩/크기만 조정하는 것이 구현 복잡도가 낮고 사용성도 충분
**Alternatives rejected**: 검색 버튼을 별도 행으로 분리 — 레이아웃 변경이 크고, 검색 UX 일관성 저하

## Complexity Tracking

> No constitution violations — table intentionally empty.

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (없음) | — | — |
