# Tasks: 로그인 페이지 디자인 리뉴얼

**Input**: Design documents from `/specs/006-signin-page-design/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 신규 의존성 설치 및 공용 CSS 유틸리티 추가

- [x] T001 Install framer-motion dependency via `npm install framer-motion`
- [x] T002 [P] Add glass-card utility class to `src/app/globals.css` — 글래스모피즘 스타일 정의: `background: rgba(255,255,255,0.7)`, `backdrop-filter: blur(12px)`, `border: 1px solid rgba(255,255,255,0.3)` (R-002 결정 반영)

---

## Phase 2: User Story 1 - 로그인 페이지 시각적 리뉴얼 (Priority: P1) 🎯 MVP

**Goal**: signin.html 레퍼런스 기반으로 로그인 페이지의 헤더, 로그인 카드, 폼 필드를 브랜드 디자인으로 리뉴얼한다. 기존 인증 로직은 변경하지 않는다.

**Independent Test**: `/signin` 접속 시 글래스모피즘 카드, 헤더(로고+타이틀), 비밀번호 토글, 브랜드 컬러가 적용된 레이아웃이 렌더링되는지 확인한다.

### Implementation for User Story 1

- [x] T003 [US1] Redesign SigninForm component in `src/features/auth/SigninForm.tsx` — 다음 변경사항을 적용한다: (1) 기존 Card 컴포넌트를 glass-card 스타일 div로 교체 (max-w-[440px], rounded-2xl, shadow-xl, p-8 md:p-12), (2) 카드 상단에 브랜드 아이콘 추가 (w-16 h-16 bg-brand-yellow rounded-2xl 내부에 로봇 이모지), (3) "로그인" 타이틀(text-2xl font-bold text-brand-navy)과 "ELUO AI Skill Hub에 접속하세요" 서브텍스트 추가, (4) 이메일 placeholder를 "example@eluocnc.com"으로 변경, (5) 비밀번호 필드에 showPassword useState + lucide-react Eye/EyeOff 토글 버튼 추가 (R-003 결정 반영), (6) "비밀번호 찾기" 링크 추가 (비밀번호 라벨 우측), (7) 로그인 버튼을 brand-navy 배경으로 스타일링, (8) 카드 하단에 border-t 구분선 + "계정이 없으신가요?" + 회원가입 링크 추가. 기존 useActionState/validate/handleFormAction 로직은 변경하지 않는다. `signin.html` 69~116행 참조.
- [x] T004 [US1] Add header and restructure page layout in `src/app/signin/page.tsx` — 다음 변경사항을 적용한다: (1) 기존 단순 main 래퍼를 header + main 구조로 변경, (2) header: `bg-white/50 backdrop-blur-md px-6 py-3 lg:px-40 border-b border-white/20`, 좌측에 eluo-logo.svg(`/eluo-logo.svg` Next.js Image 또는 img)와 "ELUO AI SKILL HUB" 타이틀(font-eluo, text-lg font-bold), 우측에 "로그인" 버튼(bg-brand-navy text-white rounded-[8px]), (3) main: flex-1 flex items-center justify-center, 배경에 brand-light 색상 + radial-gradient(brand-yellow 15%, brand-navy 10%) 적용 (R-004, R-006 결정 반영). `signin.html` 53~68행 참조.

**Checkpoint**: 로그인 페이지 접속 시 헤더(로고+타이틀)와 글래스모피즘 카드 폼이 표시되며, 기존 이메일/비밀번호 인증이 정상 동작한다.

---

## Phase 3: User Story 2 - 배경 애니메이션 효과 (Priority: P2)

**Goal**: BackgroundBeamsWithCollision 컴포넌트를 생성하고 로그인 페이지 배경에 통합하여 빛줄기 하강 + 충돌 파티클 효과를 표시한다.

**Independent Test**: `/signin` 접속 시 배경에 빛줄기 애니메이션이 반복 재생되고, 하단 경계에 도달하면 파티클 폭발 효과가 나타나며, 폼 조작을 방해하지 않는지 확인한다.

### Implementation for User Story 2

- [x] T005 [P] [US2] Create BackgroundBeamsWithCollision component in `src/shared/ui/background-beams-with-collision.tsx` — 사용자 제공 코드를 기반으로 생성하되 TypeScript strict 모드 조정을 적용한다 (R-005 결정 반영): (1) React.RefObject 타입을 React 19 호환(`HTMLDivElement | null`)으로 수정, (2) CollisionMechanism의 미사용 `ref` 파라미터를 `_ref`로 명명, (3) useEffect 의존성 배열에 `parentRef` 추가, (4) Explosion 컴포넌트의 `Math.random()` duration을 고정값 배열로 대체하여 hydration mismatch 방지, (5) `"use client"` 지시어 유지, (6) `cn` 유틸리티를 `@/lib/utils`에서 import. framer-motion의 `motion`, `AnimatePresence`를 사용한다.
- [x] T006 [US2] Integrate BackgroundBeamsWithCollision into signin page in `src/app/signin/page.tsx` — main 영역 전체를 BackgroundBeamsWithCollision으로 래핑한다. className prop으로 기본 배경을 오버라이드: `h-screen bg-brand-light` + 브랜드 그라디언트. SigninForm 카드가 z-index로 배경보다 위에 위치하도록 `relative z-10` 적용 (R-006 결정 반영).

**Checkpoint**: 로그인 페이지 배경에 빛줄기가 위→아래로 이동하며, 하단 충돌 시 파티클 효과가 나타난다. 폼 입력/클릭이 정상 동작한다.

---

## Phase 4: User Story 3 - 반응형 디자인 (Priority: P2)

**Goal**: 모바일(375px)~데스크톱(1920px) 뷰포트에서 헤더, 로그인 카드, 배경 애니메이션이 적절히 표시되도록 반응형 스타일을 적용한다.

**Independent Test**: 브라우저 DevTools에서 375px, 768px, 1280px, 1920px 뷰포트로 전환하며 레이아웃 깨짐이 없는지 확인한다.

### Implementation for User Story 3

- [x] T007 [P] [US3] Apply responsive breakpoints to header in `src/app/signin/page.tsx` — 모바일(375px): 헤더 패딩 `px-4 py-3`, 로고와 타이틀 간격 축소, 로그인 버튼 텍스트 크기 축소. 데스크톱(1280px+): `lg:px-40` 패딩 유지. 중간 해상도: 자연스러운 전환.
- [x] T008 [P] [US3] Apply responsive breakpoints to SigninForm card in `src/features/auth/SigninForm.tsx` — 모바일: 카드가 화면 너비에 맞게 확장 (w-full), 패딩 `p-6`. 태블릿/데스크톱: max-w-[440px], 패딩 `md:p-12`. 입력 필드 높이(h-12)와 버튼 높이(h-12) 일관 유지.

**Checkpoint**: 모바일~데스크톱 뷰포트에서 레이아웃 깨짐 없이 정상 표시된다.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: 타입 검증, 시각 비교, 기능 확인

- [x] T009 Run TypeScript type check via `tsc --noEmit` and fix any type errors across all modified files
- [x] T010 Visual comparison — `/signin` 페이지를 `signin.html` 레퍼런스와 나란히 비교하여 레이아웃/색상/타이포그래피/간격이 90% 이상 일치하는지 확인. 불일치 항목을 수정한다.
- [x] T011 Verify existing signin authentication flow — 이메일/비밀번호 입력 → 로그인 버튼 클릭 → 클라이언트 검증 → 서버 인증 → 대시보드 리다이렉트 흐름이 기존과 동일하게 동작하는지 확인한다.
- [x] T012 [P] Update SigninForm tests in `src/features/auth/__tests__/SigninForm.test.tsx` — 리뉴얼된 UI 구조에 맞게 기존 테스트의 셀렉터/텍스트를 업데이트한다: (1) "로그인" 타이틀 확인, (2) 이메일/비밀번호 입력 필드 존재 확인, (3) 비밀번호 표시/숨기기 토글 동작 테스트 추가, (4) 로그인 버튼 동작 유지 확인, (5) "계정이 없으신가요?" + 회원가입 링크 존재 확인.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — 즉시 시작 가능
- **US1 (Phase 2)**: Setup 완료 후 시작 — glass-card 유틸리티 필요
- **US2 (Phase 3)**: Setup 완료 후 시작 — framer-motion 의존성 필요. US1과 병렬 가능하나, page.tsx를 공유하므로 순차 실행 권장
- **US3 (Phase 4)**: US1, US2 완료 후 시작 — 반응형은 최종 레이아웃 기반으로 적용
- **Polish (Phase 5)**: US1~US3 완료 후 시작

### User Story Dependencies

- **User Story 1 (P1)**: Setup → T003, T004 순차 실행 (T003: SigninForm, T004: page.tsx)
- **User Story 2 (P2)**: Setup → T005 독립 실행 가능 → T006은 T004 완료 후 (page.tsx 수정)
- **User Story 3 (P2)**: US1+US2 → T007, T008 병렬 가능 (서로 다른 파일)

### Parallel Opportunities

- T001, T002: 병렬 가능 (npm install vs CSS 파일 수정)
- T005: US1 작업과 병렬 가능 (BackgroundBeamsWithCollision은 독립 컴포넌트)
- T007, T008: 병렬 가능 (page.tsx vs SigninForm.tsx, 서로 다른 파일)
- T009, T010, T011, T012: T009 선행 후 나머지 병렬 가능

---

## Parallel Example: User Story 1 + 2 동시 진행

```text
# US2의 T005는 US1과 병렬 진행 가능:
Task T003: [US1] SigninForm 리디자인 in src/features/auth/SigninForm.tsx
Task T005: [US2] BackgroundBeamsWithCollision 생성 in src/shared/ui/background-beams-with-collision.tsx

# 이후 순차:
Task T004: [US1] page.tsx 헤더/레이아웃 추가
Task T006: [US2] page.tsx에 BackgroundBeamsWithCollision 통합
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup (T001, T002)
2. Phase 2: US1 (T003, T004)
3. **STOP and VALIDATE**: 헤더 + 글래스모피즘 카드 + 브랜드 스타일 확인, 인증 동작 확인
4. 배포 가능한 상태

### Incremental Delivery

1. Setup → 의존성 준비 완료
2. US1 완료 → 기본 디자인 리뉴얼 (MVP)
3. US2 완료 → 배경 애니메이션 추가
4. US3 완료 → 반응형 최적화
5. Polish → 타입 검증, 시각 비교, 테스트 업데이트

---

## Notes

- [P] tasks = 서로 다른 파일, 의존성 없음
- [Story] label은 spec.md의 User Story에 매핑
- `src/app/signin/page.tsx`는 US1(T004), US2(T006), US3(T007)에서 순차 수정 → 병렬 불가
- `src/features/auth/SigninForm.tsx`는 US1(T003), US3(T008)에서 순차 수정 → 병렬 불가
- `/public/eluo-logo.svg`는 사용자가 수동 배치 예정 — T004에서 경로만 참조
- `signin.html` 파일을 디자인 레퍼런스로 참조하되, 코드를 직접 복사하지 않고 React/Tailwind로 재구현
