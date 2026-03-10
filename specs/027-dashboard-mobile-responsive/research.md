# Research: Dashboard Mobile Responsive

**Feature**: 027-dashboard-mobile-responsive
**Date**: 2026-03-10

## R1: 모바일 사이드바 오버레이 패턴

**Decision**: CSS `fixed` + `transform` + `transition`으로 오버레이 사이드바 구현
**Rationale**: Tailwind CSS v4 유틸리티만으로 구현 가능하며, Next.js App Router의 Client Component에서 `useState`로 토글 상태를 관리하면 충분하다. 별도 라이브러리 불필요.
**Alternatives considered**:
- Shadcn UI `Sheet` 컴포넌트: Radix Dialog 기반으로 접근성(a11y) 지원이 우수하나, 기존 사이드바의 카테고리 탭/라우팅 로직을 Sheet 내부로 이식하는 것이 비효율적
- framer-motion `AnimatePresence`: 이미 프로젝트에 존재하지만 단순 slide-in에 과도한 번들 추가

## R2: Tailwind CSS v4 반응형 유틸리티

**Decision**: `md:` 프리픽스 기반 모바일-퍼스트 스타일링
**Rationale**: Tailwind v4는 CSS-based 설정(`@theme`)을 사용하며, 기존 코드가 이미 `md:grid-cols-2` 패턴을 사용 중. 모바일-퍼스트 접근(기본값=모바일, `md:`=데스크톱)이 가장 자연스러움.
**Alternatives considered**:
- `max-md:` 유틸리티: Tailwind v4에서 지원되지만, 기존 코드가 `md:` 패턴이므로 일관성 위해 `md:` 유지
- CSS Media Query 직접 작성: Tailwind 유틸리티가 충분하므로 불필요

## R3: 모바일 터치 타겟 크기

**Decision**: 최소 44x44px 터치 영역 보장
**Rationale**: Apple HIG와 WCAG 2.1 Success Criterion 2.5.5 권장사항. 기존 버튼들의 `py-3 px-4` 패딩이 대부분 이를 충족하나, 검색 버튼과 태그 버튼의 모바일 크기를 확인 필요.
**Alternatives considered**: 없음 — 업계 표준 준수

## R4: 사이드바 상태 관리 위치

**Decision**: `DashboardLayoutClient`에 `sidebarOpen` state 추가
**Rationale**: 이 컴포넌트가 이미 `DashboardSidebar`와 `DashboardHeader`를 자식으로 포함하며, `DashboardFilterContext`를 통해 상태를 공유하는 패턴이 존재. 동일 패턴으로 사이드바 토글 콜백을 props drilling하면 추가 Context 없이 해결 가능.
**Alternatives considered**:
- 별도 `MobileSidebarContext` 생성: 단일 boolean 상태를 위한 Context는 과도
- URL state (`searchParams`): 사이드바 열림/닫힘은 영구 상태가 아니므로 부적절

## R5: 데스크톱 레이아웃 보존 전략

**Decision**: 모바일-퍼스트 스타일을 기본으로, `md:` 프리픽스로 데스크톱 스타일 복원
**Rationale**: 기존 클래스에 `md:` 프리픽스를 추가하고 기본값을 모바일 스타일로 변경하는 패턴. 예: `p-10` → `p-4 md:p-10`. 데스크톱에서는 `md:` 스타일이 적용되어 기존과 동일하게 렌더링.
**Alternatives considered**:
- 별도 모바일 전용 컴포넌트: 코드 중복, 유지보수 어려움
- CSS-in-JS 조건부 스타일: 프로젝트 스택(Tailwind)과 불일치
