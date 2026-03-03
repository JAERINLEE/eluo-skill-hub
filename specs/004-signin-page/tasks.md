# Tasks: 로그인 페이지 및 로그인 기능

**Input**: Design documents from `/specs/004-signin-page/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/server-actions.md

**Tests**: Not explicitly requested in spec. Constitution III requires tests at PR review time — add test tasks separately if needed.

**Organization**: Tasks grouped by user story (US1–US4) for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story (US1, US2, US3, US4)
- Exact file paths included

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Shadcn UI 설정 및 컴포넌트 설치

- [x] T001 Create Shadcn UI configuration file at `components.json` (project root) with aliases pointing to `@/shared/ui`, css to `src/app/globals.css`, style `new-york`
- [x] T002 Install Shadcn UI components (button, input, label, card) via `npx shadcn@latest add button input label card --yes` — components will be placed in `src/shared/ui/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Auth 도메인 타입, 미들웨어, 네비게이션 업데이트 — 모든 User Story 구현 전 완료 필수

**CRITICAL**: Phase 3+ 진행 전 반드시 완료

- [x] T003 [P] Create auth domain types (SigninCredentials, SigninResult, AuthRepository interface, SigninActionState) at `src/auth/domain/types.ts`
- [x] T004 [P] Create Supabase auth middleware for session cookie refresh and authenticated user redirect (/signin → /dashboard) at `middleware.ts` (project root) — follow R-003 pattern from research.md
- [x] T005 [P] Update "시작하기" button href from `/login` to `/signin` in `src/features/root-page/LandingPage.tsx`

**Checkpoint**: Auth 도메인 타입 정의 완료, 미들웨어 세션 갱신 동작, 랜딩 페이지 → /signin 네비게이션 동작

---

## Phase 3: User Story 1 — 로그인 페이지 진입 (Priority: P1) 🎯 MVP

**Goal**: 사용자가 /signin에 접근하면 이메일/패스워드 입력 필드와 로그인 버튼이 포함된 로그인 폼이 표시된다

**Independent Test**: 브라우저에서 `/signin` 접속 시 이메일 입력, 패스워드 입력(마스킹), 로그인 버튼이 렌더링되는지 확인

### Implementation for User Story 1

- [x] T006 [US1] Create SigninForm Client Component with email input (type="email", name="email"), password input (type="password", name="password"), and submit button using Shadcn Card/Input/Label/Button at `src/features/auth/SigninForm.tsx` — "use client" directive, initial skeleton without Server Action wiring
- [x] T007 [US1] Create signin page route (Server Component) that renders SigninForm centered on screen at `src/app/signin/page.tsx`

**Checkpoint**: `/signin` 페이지 접속 시 로그인 폼이 올바르게 렌더링됨. 랜딩 페이지에서 "시작하기" 클릭 시 /signin으로 이동.

---

## Phase 4: User Story 2 — 이메일/패스워드 로그인 (Priority: P1)

**Goal**: 등록된 사용자가 올바른 자격 증명을 입력하면 인증이 완료되고 /dashboard로 리다이렉트된다

**Independent Test**: 등록된 테스트 계정으로 이메일/패스워드 입력 후 로그인 버튼 클릭 → /dashboard 리다이렉트 확인

### Implementation for User Story 2

- [x] T008 [P] [US2] Implement SupabaseAuthRepository (AuthRepository interface 구현, signInWithPassword 호출) at `src/auth/infrastructure/supabase-auth-repository.ts` — createClient from `@/shared/infrastructure/supabase/server` 사용
- [x] T009 [P] [US2] Implement SigninUseCase (AuthRepository를 주입받아 signIn 오케스트레이션) at `src/auth/application/signin-use-case.ts`
- [x] T010 [US2] Create signin Server Action (`"use server"`, useActionState 시그니처: prevState + formData, SigninUseCase 사용, 성공 시 redirect("/dashboard"), 실패 시 SigninActionState 반환) at `src/app/signin/actions.ts` — follow R-001 and contracts/server-actions.md
- [x] T011 [US2] Wire Server Action to SigninForm via `useActionState`, add loading state (isPending) with button disable during submission at `src/features/auth/SigninForm.tsx`

**Checkpoint**: 올바른 자격 증명으로 로그인 시 /dashboard 리다이렉트, 로딩 상태 표시, 세션 쿠키 설정 완료

---

## Phase 5: User Story 3 — 로그인 실패 처리 (Priority: P2)

**Goal**: 잘못된 자격 증명 입력 시 보안을 고려한 통합 오류 메시지("이메일 또는 비밀번호가 올바르지 않습니다")가 표시된다

**Independent Test**: 존재하지 않는 이메일 또는 잘못된 패스워드로 로그인 시도 → 동일한 오류 메시지 표시 확인

### Implementation for User Story 3

- [x] T012 [US3] Add error message display area (state.error가 비어있지 않을 때 destructive 스타일로 표시) and error clearing on input change (onChange 핸들러에서 에러 상태 초기화) to SigninForm at `src/features/auth/SigninForm.tsx`

**Checkpoint**: 잘못된 자격 증명 시 오류 메시지 표시, 입력 수정 시 오류 메시지 자동 사라짐

---

## Phase 6: User Story 4 — 입력값 유효성 검증 (Priority: P2)

**Goal**: 폼 제출 전 이메일 형식과 필수 필드 입력 여부를 클라이언트 측에서 검증한다

**Independent Test**: 빈 이메일/패스워드, 유효하지 않은 이메일 형식으로 폼 제출 시도 → 한글 검증 메시지 표시 확인

### Implementation for User Story 4

- [x] T013 [US4] Add client-side validation to SigninForm: email required ("이메일을 입력해 주세요"), email format ("올바른 이메일 형식을 입력해 주세요"), password required ("비밀번호를 입력해 주세요") — HTML5 required + pattern attributes or custom validation logic at `src/features/auth/SigninForm.tsx`

**Checkpoint**: 유효하지 않은 입력 시 서버 요청 없이 즉시 클라이언트 검증 메시지 표시

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 타입 검사, 전체 플로우 검증

- [x] T014 Run type check (`tsc --noEmit`) and verify zero `any` usage and zero type errors across all new files
- [x] T015 Validate complete flow per quickstart.md: 랜딩 페이지 → 시작하기 클릭 → /signin → 로그인 → /dashboard 리다이렉트 확인

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 즉시 시작 가능
- **Foundational (Phase 2)**: Setup 완료 후 시작 — **모든 User Story를 블로킹**
- **US1 (Phase 3)**: Foundational 완료 후 시작
- **US2 (Phase 4)**: US1 완료 후 시작 (SigninForm에 Server Action 연결)
- **US3 (Phase 5)**: US2 완료 후 시작 (에러 상태가 Server Action에서 반환됨)
- **US4 (Phase 6)**: US1 완료 후 시작 가능 (US2와 독립적, 클라이언트 측 검증만)
- **Polish (Phase 7)**: 모든 User Story 완료 후 시작

### User Story Dependencies

```
Phase 1 (Setup)
    ↓
Phase 2 (Foundational) — T003, T004, T005 [ALL PARALLEL]
    ↓
Phase 3 (US1) — T006 → T007
    ↓                     ↘
Phase 4 (US2) — T008∥T009 → T010 → T011    Phase 6 (US4) — T013 [PARALLEL with US2]
    ↓
Phase 5 (US3) — T012
    ↓
Phase 7 (Polish) — T014, T015
```

### Within Each User Story

- 모델/타입 → 서비스/유즈케이스 → 서버 액션 → UI 통합
- 스토리 완료 후 다음 우선순위 스토리로 진행

### Parallel Opportunities

- **Phase 2**: T003, T004, T005 모두 병렬 가능 (서로 다른 파일, 의존성 없음)
- **Phase 4**: T008 (Repository), T009 (UseCase) 병렬 가능 (둘 다 T003의 인터페이스만 의존)
- **Phase 4 & 6**: US4 (클라이언트 검증)는 US2와 병렬 진행 가능

---

## Parallel Example: Phase 2 (Foundational)

```bash
# 3개 태스크 동시 실행 가능:
Task T003: "Create auth domain types at src/auth/domain/types.ts"
Task T004: "Create middleware at middleware.ts"
Task T005: "Update LandingPage.tsx href"
```

## Parallel Example: Phase 4 (US2)

```bash
# Repository와 UseCase 동시 실행 가능:
Task T008: "Implement SupabaseAuthRepository at src/auth/infrastructure/supabase-auth-repository.ts"
Task T009: "Implement SigninUseCase at src/auth/application/signin-use-case.ts"

# 이후 순차 실행:
Task T010: "Create signin Server Action" (T008, T009 완료 후)
Task T011: "Wire to SigninForm" (T010 완료 후)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup (Shadcn 설정)
2. Phase 2: Foundational (도메인 타입 + 미들웨어 + 네비게이션)
3. Phase 3: US1 (로그인 페이지 렌더링)
4. **STOP and VALIDATE**: /signin 페이지에서 폼이 올바르게 표시되는지 확인

### Incremental Delivery

1. Setup + Foundational → 기반 완성
2. US1 → 로그인 페이지 UI 확인 (MVP)
3. US2 → 실제 로그인 동작 확인
4. US3 → 실패 시 오류 메시지 확인
5. US4 → 입력 검증 확인
6. Polish → 타입 체크 + 전체 플로우 검증

---

## Notes

- [P] tasks = 다른 파일, 의존성 없음
- [Story] label = 해당 User Story에 매핑
- T005 (LandingPage href 변경)는 이전 세션에서 이미 변경되었을 수 있음 — 확인 후 스킵 가능
- SigninForm.tsx는 US1→US2→US3→US4에서 점진적으로 기능이 추가됨
- 모든 새 파일은 `any` 타입 사용 금지 (Constitution I)
