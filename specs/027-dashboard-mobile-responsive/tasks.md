# Tasks: Dashboard Mobile Responsive

**Feature**: 027-dashboard-mobile-responsive
**Date**: 2026-03-10

## Phase 1: 사이드바 토글 인프라

- [x] T1: DashboardLayoutClient에 sidebarOpen state 및 토글 함수 추가
  - File: `src/features/dashboard/DashboardLayoutClient.tsx`
  - sidebarOpen boolean state, toggleSidebar callback
  - DashboardHeader에 onMenuToggle prop 전달
  - DashboardSidebar에 isOpen/onClose props 전달
  - 모바일 오버레이 배경 + 사이드바 래퍼 추가

- [x] T2: DashboardHeader에 햄버거 메뉴 버튼 추가 + 모바일 반응형
  - File: `src/features/dashboard/DashboardHeader.tsx`
  - onMenuToggle prop 추가
  - 모바일에서만 보이는 Menu 아이콘 버튼 (md:hidden)
  - 헤더 높이/패딩 모바일 조정 (h-14 md:h-20, px-4 md:px-10)

- [x] T3: DashboardSidebar 모바일 오버레이 변환
  - File: `src/features/dashboard/DashboardSidebar.tsx`
  - isOpen/onClose props 추가
  - 모바일: fixed 오버레이, 슬라이드 애니메이션
  - 데스크톱: 기존 고정 사이드바 유지
  - 메뉴 선택 시 onClose 호출

## Phase 2: 콘텐츠 영역 반응형 [P]

- [x] T4: DashboardSearchBar 모바일 반응형 [P]
  - File: `src/features/dashboard/DashboardSearchBar.tsx`
  - 제목: text-2xl md:text-4xl
  - 여백: mb-8 md:mb-16
  - 입력: pl-10 md:pl-14, pr-20 md:pr-36, py-3 md:py-5, text-base md:text-lg
  - 버튼: px-4 md:px-8, text-xs md:text-sm

- [x] T5: DashboardSkillGrid 모바일 반응형 [P]
  - File: `src/features/dashboard/DashboardSkillGrid.tsx`
  - 그리드 간격: gap-4 md:gap-8
  - 제목 영역: mb-4 md:mb-8

- [x] T6: DashboardSkillCard 모바일 반응형 [P]
  - File: `src/features/dashboard/DashboardSkillCard.tsx`
  - 카드 패딩: p-5 md:p-8
  - 라운드: rounded-2xl md:rounded-3xl

## Phase 3: E2E 테스트

- [x] T7: Playwright 모바일/데스크톱 반응형 E2E 테스트
  - File: `src/__tests__/e2e/dashboard-mobile.spec.ts`
  - 모바일(375px): 사이드바 숨김, 햄버거 토글, 검색, 카드 표시
  - 데스크톱(1280px): 기존 레이아웃 유지 확인
