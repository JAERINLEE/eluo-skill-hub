# Tasks: 회원가입 페이지 디자인 리뉴얼

**Input**: Design documents from `/specs/007-signup-page/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 기존 프로젝트 위에서 동작하므로 프로젝트 초기화 불필요.

*No tasks — project already initialized.*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 인증된 사용자 리다이렉트 미들웨어 위치 확보 및 리다이렉트 대상 페이지 생성.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T001 Move `proxy.ts` from project root to `src/proxy.ts` to follow Next.js 16.x `src/` layout convention (R-010)
- [x] T002 [P] Create placeholder dashboard page in `src/app/dashboard/page.tsx` as redirect target for authenticated users
- [x] T003 [P] Add authenticated-user redirect logic to `src/proxy.ts`: redirect `/signin` → `/dashboard` and `/signup` → `/dashboard` when session exists (FR-012, FR-013)

**Checkpoint**: 인증 리다이렉트 동작 확인됨. User Story 구현 시작 가능.

---

## Phase 3: User Story 1 - 신규 사용자 회원가입 완료 (Priority: P1) 🎯 MVP

**Goal**: 유효한 이름·이메일·비밀번호 입력 → 계정 생성 → OTP 인증 카드 표시. 이미 가입된 이메일은 별도 글래스카드 뷰("이미 가입된 이메일" 안내 + 로그인 이동 버튼)로 분기.

**Independent Test**: `/signup` 방문 → 유효한 정보 입력 후 제출 → OTP 인증 카드 표시. 이미 가입된 이메일로 제출 → "이미 가입된 이메일입니다" 카드 표시 → "로그인으로 이동" 버튼 클릭 → `/signin`.

### 이전 이터레이션 (완료)

- [x] T004 [US1] Add `name: string` field to `SignupCredentials` interface in `src/auth/domain/types.ts`
- [x] T005 [P] [US1] Update `signUp()` in `src/auth/infrastructure/supabase-auth-repository.ts` to pass `credentials.name` as `options.data.display_name` to Supabase `auth.signUp()`, implement `identities`-based duplicate email detection returning `success: "pending"` (미인증) or `success: false, error: "이미 가입된 이메일입니다"` (인증완료)
- [x] T006 [P] [US1] Update `SignupUseCase.execute()` in `src/auth/application/signup-use-case.ts` to pass `name` from credentials to repository `signUp()` call
- [x] T007 [US1] Update `signup()` server action in `src/app/signup/actions.ts` to extract and validate `name` from FormData, pass to `SignupUseCase.execute()`
- [x] T008 [US1] Redesign `src/features/auth/SignupForm.tsx`: apply `glass-card` class with `max-w-[480px] rounded-3xl shadow-2xl p-8 md:p-10`, add card header (brand-yellow icon box, "회원가입" title, subtitle), add `name` input field, add `confirmPassword` field with `grid grid-cols-1 md:grid-cols-2 gap-4` layout, add client-side `password !== confirmPassword` validation, style submit button with `h-14 bg-[#00007F]` classes

### 이번 이터레이션 — 중복 이메일 분기 처리

- [x] T009 [US1] Add `"duplicate"` literal to `SignupActionState.step` union type in `src/auth/domain/types.ts`: change `step: "form" | "verify"` to `step: "form" | "verify" | "duplicate"` (data-model.md, R-007)
- [x] T010 [US1] Update `signup()` server action in `src/app/signup/actions.ts`: add `if (result.error === "이미 가입된 이메일입니다")` branch that returns `{ error: result.error, step: "duplicate", email: "" }` before the existing generic error return (plan.md 변경 2)
- [x] T011 [US1] Add duplicate email card view to `src/features/auth/SignupForm.tsx`: add `if (state.step === "duplicate")` branch (early return) rendering a glass-card with 👤 icon, "이미 가입된 이메일입니다" title, "입력하신 이메일은 이미 가입된 계정입니다. 로그인 페이지에서 로그인해 주세요." message, `<Link href="/signin">` "로그인으로 이동" button with `bg-[#00007F]` style, and "다른 이메일로 가입하기" link that resets form via `key` prop increment (R-008, R-009)
- [x] T012 [US1] Remove `isDuplicateEmailError` inline error display logic from `src/features/auth/SignupForm.tsx` — replaced by the separate card view added in T011 (plan.md 변경 4)

**Checkpoint**: 인증 완료 중복 이메일 → "이미 가입된 이메일" 카드 표시. 미인증 중복 이메일 → 기존 OTP 카드 표시. 신규 이메일 → OTP 카드 표시.

---

## Phase 4: User Story 2 - 페이지 레이아웃 및 시각적 일관성 (Priority: P2)

**Goal**: `/signup` 페이지가 `/signin`과 동일한 헤더·배경을 공유하며, 글래스카드 폼(max-width 480px)이 정확히 렌더링된다.

**Independent Test**: `/signup` 방문 시 헤더(로고 + "ELUO AI SKILL HUB" + 로그인 버튼), BackgroundBeamsWithCollision 배경, 글래스카드 폼이 모두 표시된다.

### Implementation for User Story 2 (이전 이터레이션 완료)

- [x] T013 [US2] Update `src/app/signup/page.tsx`: import and apply `BackgroundBeamsWithCollision`, add header with `/eluo-logo.svg` logo and "ELUO AI SKILL HUB" title wrapped in `<Link href="/">`, add "로그인" button linking to `/signin`, compose with `SignupForm`, apply `min-h-screen flex flex-col` layout matching `src/app/signin/page.tsx` (FR-001, FR-002, FR-007)
- [x] T014 [P] [US2] Update `src/app/signin/page.tsx`: wrap header logo `<Image>` and title `<h2>` inside `<Link href="/">` for home navigation, preserve existing header styling (FR-001a, R-003)

**Checkpoint**: `/signup`과 `/signin` 페이지가 동일한 헤더·배경을 공유하고 헤더 로고/타이틀 클릭 시 `/`로 이동한다.

---

## Phase 5: User Story 3 - 로그인 페이지 이동 링크 (Priority: P3)

**Goal**: 폼 하단 "이미 계정이 있으신가요? 로그인" 링크를 통해 `/signin`으로 이동할 수 있다.

**Independent Test**: 폼 하단 "로그인" 링크 클릭 → `/signin` 페이지로 이동.

### Implementation for User Story 3 (이전 이터레이션 완료)

- [x] T015 [US3] Style login navigation link in `src/features/auth/SignupForm.tsx`: `mt-5 pt-8 border-t border-white/40 text-center` divider, "이미 계정이 있으신가요?" text with `text-sm text-slate-600`, "로그인" link with `text-slate-800 font-bold hover:text-[#00007F] underline` navigating to `/signin` via `<Link>` (FR-009)

**Checkpoint**: 폼 하단 네비게이션 링크가 `/signin`으로 정상 이동한다.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 테스트 업데이트, 타입 체크, 전체 검증

- [x] T016 [P] Update `src/features/auth/__tests__/SignupForm.test.tsx`: add test for `step === "duplicate"` rendering ("이미 가입된 이메일입니다" title, "로그인으로 이동" button, "다른 이메일로 가입하기" link), add test for "다른 이메일로 가입하기" click resetting to form view (spec.md US1 acceptance scenario 3, R-008)
- [x] T017 Run `npx tsc --noEmit` to confirm zero type errors across all modified files (`types.ts`, `actions.ts`, `SignupForm.tsx`)
- [ ] T018 Manually verify 6 quickstart.md scenarios: (1) 신규 이메일 가입 → OTP 카드, (2) 인증 완료 중복 이메일 → "이미 가입된 이메일" 카드 → 로그인 이동, (3) 중복 이메일 카드에서 복귀 → 빈 폼 초기화, (4) 미인증 중복 이메일 → OTP 카드, (5) 로그인 후 `/signup` 접근 → `/dashboard` 리다이렉트, (6) 로그인 후 `/signin` 접근 → `/dashboard` 리다이렉트

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Skipped — project already initialized
- **Foundational (Phase 2)**: 완료 — T001→T003 순차, T002+T003 병렬 가능
- **User Story 1 (Phase 3)**: 이전 이터레이션(T004-T008) 완료 → 이번 이터레이션(T009-T012) 순차
  - T009 → T010 → T011 → T012 (모두 순차, types.ts/actions.ts/SignupForm.tsx 파일 변경)
- **User Story 2 (Phase 4)**: 완료 (이전 이터레이션)
- **User Story 3 (Phase 5)**: 완료 (이전 이터레이션)
- **Polish (Phase 6)**: T016(병렬) + T017 → T018 (순차)

### User Story Dependencies

- **User Story 1 (P1)**: Foundational 완료 후 독립 시작 가능 — **현재 이터레이션 미완료 작업 있음**
- **User Story 2 (P2)**: US1 완료 필요 (SignupForm이 page.tsx에 조합됨) — **완료**
- **User Story 3 (P3)**: US1 완료 필요 (SignupForm 내 동일 파일) — **완료**

### Within This Iteration (T009-T012)

- T009 (types.ts) → T010 (actions.ts) → T011 (SignupForm.tsx) → T012 (SignupForm.tsx)
- types.ts 변경이 actions.ts와 SignupForm.tsx 모두에 타입 영향을 주므로 반드시 T009 선행

### Parallel Opportunities

- T016 (테스트) + T017 (타입 체크): 다른 도구, 병렬 실행 가능
- T002 + T003 (Phase 2): 다른 파일, 병렬 실행 가능

---

## Parallel Example: Phase 6 (Polish)

```text
# Parallel (independent tools):
Task T016: "Update SignupForm.test.tsx with duplicate email card tests"
Task T017: "Run tsc --noEmit type check"

# Then sequential:
Task T018: "Manual verification of 6 quickstart.md scenarios"
```

---

## Implementation Strategy

### 현재 이터레이션 MVP (이번에 완료해야 할 작업)

1. Complete T009: `types.ts`에 `"duplicate"` 추가 — 타입 시스템 확장
2. Complete T010: `actions.ts` 분기 로직 — 서버에서 중복 이메일 신호 전달
3. Complete T011: `SignupForm.tsx` 중복 이메일 카드 뷰 — 사용자에게 명확한 피드백
4. Complete T012: `SignupForm.tsx` 인라인 에러 제거 — 중복 없는 UX
5. **STOP and VALIDATE**: 인증 완료 중복 이메일로 가입 시 카드 뷰 표시 확인
6. Complete Phase 6: 테스트 + 타입 체크 + 수동 검증

### Incremental Delivery

1. T009-T010 → 타입·서버 로직 완성 (UI는 아직 반응 없음)
2. T011 → 중복 이메일 카드 뷰 렌더링 확인 → **기능 MVP 완료!**
3. T012 → 인라인 에러 제거 (중복 UI 정리)
4. Phase 6 → 테스트 + 타입 체크 → 배포 준비 완료

---

## Notes

- T009-T012 모두 `SignupActionState.step` 타입 확장에 의존 → T009 반드시 선행
- T011 + T012는 동일 파일(`SignupForm.tsx`) → 순차 실행 (T011 후 T012)
- "다른 이메일로 가입하기" 폼 초기화는 `key` prop 리마운트 전략 사용 (R-009)
- OTP 인증 단계 카드에도 동일 글래스카드 스타일 적용됨 (FR-011, 기존 구현)
- `proxy.ts` 위치: `src/proxy.ts` (Next.js 16.x `src/` 구조 컨벤션, R-010)
- `eluocnc.com` 도메인 제한 및 비밀번호 8자 이상은 기존 검증 로직 유지
