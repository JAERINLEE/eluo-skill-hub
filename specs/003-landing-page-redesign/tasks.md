# Tasks: 랜딩페이지 디자인 수정 (커스텀 폰트 + 인터랙티브 글로브)

**Input**: Design documents from `/specs/003-landing-page-redesign/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ ✅, quickstart.md ✅

**Organization**: User Story 단위로 그룹화하여 각 스토리를 독립적으로 구현·테스트·배포 가능.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: 다른 파일 작업이므로 병렬 실행 가능
- **[Story]**: 연결된 유저 스토리 (US1, US2, US3)
- 각 태스크에 정확한 파일 경로 포함

---

## Phase 1: Setup (공유 인프라)

**Purpose**: 컴포넌트 테스트 디렉토리 구조 초기화

- [x] T001 Create `src/shared/ui/__tests__/` directory (필요 시 `.gitkeep` 추가)

---

## Phase 2: Foundational (US1·US2의 선행 조건)

**Purpose**: 커스텀 폰트 등록 — US1 구현 전 반드시 완료해야 하는 CSS 토큰 기반

**⚠️ CRITICAL**: 이 Phase가 완료되기 전까지 US1·US2 작업 시작 불가

- [x] T002 [P] Register `eluo` localFont with `variable: "--font-eluo-face"` and `display: "swap"` in `src/app/layout.tsx`, add `eluo.variable` to `<html>` className
- [x] T003 [P] Add `--font-eluo: var(--font-eluo-face), sans-serif` token inside `@theme inline` block in `src/app/globals.css`

**Checkpoint**: `font-eluo` Tailwind 유틸리티 클래스 사용 가능 상태 → US1·US2 병렬 진행 가능

---

## Phase 3: User Story 1 - 브랜드 폰트 타이틀 (Priority: P1) 🎯 MVP

**Goal**: `<h1>` "ELUO AI SKILL HUB" 텍스트가 eluofacevf 커스텀 폰트로 렌더링됨

**Independent Test**: 랜딩 페이지 h1 요소의 computed `font-family`에 `ELUOFACEVF` 포함 여부를 Playwright로 확인

### Implementation — User Story 1

- [x] T004 [US1] Apply `font-eluo` Tailwind class to `<h1>` element in `src/features/root-page/LandingPage.tsx`

### Tests — User Story 1

- [x] T005 [US1] Create E2E test file with h1 font-family assertion (`toContain` ELUOFACEVF) and page load check in `src/__tests__/e2e/landing-page.spec.ts`

**Checkpoint**: `npm run dev` → 브라우저 DevTools Computed에서 `font-family: ELUOFACEVF` 확인 가능 (MVP 배포 가능)

---

## Phase 4: User Story 2 - 인터랙티브 글로브 (Priority: P2)

**Goal**: 히어로 섹션 우측에 자동 회전하는 3D 지구본이 표시되고, 드래그로 조작 가능

**Independent Test**: 랜딩 페이지에서 `<canvas>` 요소가 보이고, 마우스 드래그 후 글로브 방향이 변경됨을 Playwright로 확인

### Implementation — User Story 2

- [x] T006 [US2] Define and export `GlobeConnection`, `GlobeMarker`, `GlobeProps` interfaces and 3D math helper functions (`latLngToXYZ`, `rotateX`, `rotateY`, `project`) in `src/shared/ui/interactive-globe.tsx`
- [x] T007 [US2] Define and export `DEFAULT_GLOBE_MARKERS` (10개 도시) and `DEFAULT_GLOBE_CONNECTIONS` (9개 연결) constants in `src/shared/ui/interactive-globe.tsx`
- [x] T008 [US2] Implement `InteractiveGlobe` component skeleton: Canvas ref, rotation refs, drag ref, animation ref, time ref, Fibonacci sphere dot generation (`useEffect`, 1200점) in `src/shared/ui/interactive-globe.tsx`
- [x] T009 [US2] Implement `draw` callback: Canvas DPR setup, clear, outer glow gradient, globe outline circle, Fibonacci dot rendering with depth-based alpha in `src/shared/ui/interactive-globe.tsx`
- [x] T010 [US2] Add arc connections rendering (quadratic bezier) and traveling dot animation (parameterized t) to `draw` callback in `src/shared/ui/interactive-globe.tsx`
- [x] T011 [US2] Add city marker rendering (pulse ring + core dot + label) and `requestAnimationFrame` loop with auto-rotation to `draw` callback in `src/shared/ui/interactive-globe.tsx`
- [x] T012 [US2] Add pointer drag event handlers (`onPointerDown`, `onPointerMove`, `onPointerUp`) with `setPointerCapture` and clamp X-rotation to `[-1, 1]` in `src/shared/ui/interactive-globe.tsx`
- [x] T013 [US2] Refactor `LandingPage` hero section to 2-column flex layout (`flex-col md:flex-row`), add `next/dynamic` import for `InteractiveGlobe` with `{ ssr: false }`, render `<InteractiveGlobe size={460} />` in right column in `src/features/root-page/LandingPage.tsx`

### Tests — User Story 2

- [x] T014 [P] [US2] Write unit tests for `InteractiveGlobe`: mock `HTMLCanvasElement.prototype.getContext`, assert `<canvas>` renders, assert `size` prop sets `style.width/height`, assert pointer event handlers attached in `src/shared/ui/__tests__/interactive-globe.test.tsx`
- [x] T015 [P] [US2] Add `<canvas>` element visibility and bounding-box size assertions to E2E test in `src/__tests__/e2e/landing-page.spec.ts`

**Checkpoint**: 브라우저에서 글로브 자동 회전 + 드래그 조작 + 도시 마커 + 아크 애니메이션 확인 가능

---

## Phase 5: User Story 3 - 기존 콘텐츠 접근 (Priority: P3)

**Goal**: 새 2단 레이아웃에서도 서비스 소개 텍스트, 기능 카드 섹션, 시작하기 CTA 버튼이 정상 표시됨

**Independent Test**: "시작하기" 버튼 클릭 → `/login` 이동, 기능 카드 3개 표시, 모바일 뷰포트에서 수직 레이아웃 확인

### Implementation — User Story 3

- [x] T016 [US3] Audit `LandingPage.tsx` after T013 changes: verify features section (`bg-brand-light`) grid and footer (`bg-[#00007F]`) are intact, adjust padding/spacing if layout shift occurred in `src/features/root-page/LandingPage.tsx`

### Tests — User Story 3

- [x] T017 [US3] Add assertions to E2E test: "시작하기" button visible and navigates to `/login`, all 3 feature cards present, mobile viewport (375px) shows vertical hero layout in `src/__tests__/e2e/landing-page.spec.ts`

**Checkpoint**: 전체 유저 스토리 3개 모두 독립 검증 가능 — 최종 검수 가능 상태

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 타입 안전성 검증 및 전체 테스트 통과 확인

- [x] T018 [P] Run TypeScript type check — zero `any` violations required: `npx tsc --noEmit`
- [x] T019 Run Jest unit tests for InteractiveGlobe: `npm test src/shared/ui/__tests__/interactive-globe.test.tsx`
- [x] T020 Run full Playwright E2E suite for landing page: `npx playwright test src/__tests__/e2e/landing-page.spec.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 즉시 시작 가능
- **Foundational (Phase 2)**: Phase 1 완료 후 — T002·T003은 서로 다른 파일이므로 병렬 가능
- **US1 (Phase 3)**: Phase 2 완료 후 시작 — T004·T005는 서로 다른 파일이므로 병렬 가능
- **US2 (Phase 4)**: Phase 2 완료 후 시작 — T006→T012는 동일 파일(순차), T013은 T012 완료 후, T014·T015는 T013 완료 후 병렬
- **US3 (Phase 5)**: Phase 4 (T013) 완료 후 시작 — T016·T017 병렬 가능
- **Polish (Phase 6)**: Phase 5 완료 후 — T018 병렬, T019→T020 순차

### User Story Dependencies

- **US1 (P1)**: Phase 2 완료 후 시작 — 다른 US 의존성 없음
- **US2 (P2)**: Phase 2 완료 후 시작 — US1과 병렬 가능 (다른 파일)
- **US3 (P3)**: US2(T013) 완료 후 시작 — 2단 레이아웃이 있어야 기존 콘텐츠 검증 가능

### Within Each User Story

- T006 → T007 → T008 → T009 → T010 → T011 → T012 → T013: 동일 파일, 순차 실행
- T014 ‖ T015: 서로 다른 파일, 병렬 실행 가능 (T013 완료 후)

---

## Parallel Execution Examples

### Phase 2 (Foundational)

```
동시 시작 가능:
  T002: layout.tsx — eluo localFont 등록
  T003: globals.css — --font-eluo 토큰 추가
```

### Phase 3 + Phase 4 (US1 · US2 병렬)

```
Phase 2 완료 후:
  개발자 A: T004 → T005 (US1 완료)
  개발자 B: T006 → T007 → T008 → T009 → T010 → T011 → T012 → T013 (US2 진행)
```

### Phase 4 Tests (T014 · T015)

```
T013 완료 후 동시 시작:
  T014: interactive-globe.test.tsx (unit test)
  T015: landing-page.spec.ts (E2E 추가)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup 완료 (T001)
2. Phase 2: Foundational 완료 (T002, T003)
3. Phase 3: US1 완료 (T004, T005)
4. **STOP and VALIDATE**: 브라우저에서 h1 폰트 확인, E2E 통과
5. 배포/데모 가능 — 브랜드 폰트만 적용된 상태

### Incremental Delivery

1. T001~T003 → 폰트 인프라 준비
2. T004~T005 (US1) → 폰트 적용 MVP 배포 가능
3. T006~T015 (US2) → 글로브 추가 배포 가능
4. T016~T017 (US3) → 기존 콘텐츠 검증 완료
5. T018~T020 (Polish) → PR 머지 준비

---

## Notes

- [P] 태스크 = 다른 파일, 의존성 없음 — 병렬 실행 가능
- [Story] 레이블 = 유저 스토리 추적을 위한 태그
- T006~T012는 모두 `interactive-globe.tsx` 파일 — 순차 실행 필수
- T002·T003은 서로 다른 파일(layout.tsx, globals.css) — 병렬 실행 가능
- 각 Phase의 Checkpoint에서 독립 검증 후 다음 Phase 진행
- 헌법 원칙 I 준수: `any` 타입 사용 금지 — T018에서 최종 검증
