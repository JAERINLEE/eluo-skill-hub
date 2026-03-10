# Quickstart: Dashboard Mobile Responsive

**Feature**: 027-dashboard-mobile-responsive
**Date**: 2026-03-10

## Overview

대시보드 페이지를 모바일 반응형으로 구현하는 순수 프론트엔드 작업. 6개 기존 컴포넌트에 Tailwind 반응형 클래스를 추가하고, 사이드바 토글 로직을 구현한다.

## Prerequisites

- Node.js, pnpm 설치
- `pnpm install` 실행
- 브랜치 확인: `git checkout 027-dashboard-mobile-responsive`

## Quick Start

```bash
# 개발 서버 시작
pnpm dev

# 모바일 뷰포트 확인: 브라우저 DevTools → 375px 뷰포트
# 데스크톱 뷰포트 확인: 1280px 이상

# E2E 테스트 실행
pnpm exec playwright test src/__tests__/e2e/dashboard-mobile.spec.ts
```

## Implementation Order

### 1단계: 사이드바 토글 인프라 (DashboardLayoutClient + DashboardHeader)
- `DashboardLayoutClient`에 `sidebarOpen` state 추가
- `DashboardHeader`에 햄버거 버튼 추가 (모바일 전용)
- 사이드바 토글 콜백을 props로 전달

### 2단계: 사이드바 모바일 오버레이 (DashboardSidebar + DashboardLayoutClient)
- 모바일에서 사이드바를 `fixed` 오버레이로 변환
- 배경 오버레이 + 슬라이드 애니메이션
- 메뉴 선택 시 자동 닫기

### 3단계: 콘텐츠 영역 반응형 (DashboardSearchBar + DashboardSkillGrid + DashboardSkillCard)
- 패딩, 폰트 크기, 간격을 모바일에 맞게 조정
- 검색바 입력/버튼 크기 조정

## Key Files

| File | Change |
|------|--------|
| `src/features/dashboard/DashboardLayoutClient.tsx` | sidebarOpen state, 오버레이 래퍼 |
| `src/features/dashboard/DashboardSidebar.tsx` | 모바일 오버레이 스타일 |
| `src/features/dashboard/DashboardHeader.tsx` | 햄버거 버튼, 모바일 패딩 |
| `src/features/dashboard/DashboardSearchBar.tsx` | 모바일 패딩/폰트 |
| `src/features/dashboard/DashboardSkillGrid.tsx` | 모바일 간격 |
| `src/features/dashboard/DashboardSkillCard.tsx` | 모바일 패딩 |
| `src/__tests__/e2e/dashboard-mobile.spec.ts` | Playwright 테스트 |

## Testing

```bash
# Playwright E2E 테스트
pnpm exec playwright test src/__tests__/e2e/dashboard-mobile.spec.ts

# TypeScript 타입 체크
pnpm tsc --noEmit
```

## Constraints

- `any` 타입 사용 금지
- 데스크톱 레이아웃 변경 없음
- 신규 의존성 추가 없음
- 모바일 브레이크포인트: 768px (`md:`)
