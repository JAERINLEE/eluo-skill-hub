# Tasks: 탭/브라우저 종료 시 자동 로그아웃

**Input**: Design documents from `/specs/024-fix-session-persistence/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: 테스트 태스크는 스펙에서 명시적으로 요청되지 않았으므로 생략합니다.

**Organization**: 이 기능은 단일 유저 스토리(P1)로 구성되어 있으며, 태스크가 적어 간결하게 구성합니다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 세션 쿠키 전환 및 로그아웃 API 엔드포인트 생성

- [x] T001 세션 쿠키로 전환: `src/shared/infrastructure/supabase/server.ts`의 `setAll` 콜백에서 쿠키 옵션의 `maxAge`/`expires`를 제거하여 세션 쿠키로 변경
- [x] T002 [P] sendBeacon용 로그아웃 Route Handler 생성: `src/app/api/auth/signout/route.ts`에 POST 핸들러 구현. Supabase 서버 클라이언트로 `auth.signOut()` 호출 후 `{ success: true }` 응답 반환

**Checkpoint**: 세션 쿠키 전환 완료, 로그아웃 API 엔드포인트 사용 가능

---

## Phase 2: User Story 1 - 탭 종료 시 자동 로그아웃 (Priority: P1) 🎯 MVP

**Goal**: 사용자가 탭을 닫으면 `beforeunload` 이벤트에서 `navigator.sendBeacon`으로 서버 세션을 무효화하여 자동 로그아웃 처리

**Independent Test**: 로그인 후 탭을 닫고 새 탭에서 사이트 접속 시 로그인 페이지로 리다이렉트되는지 확인

### Implementation for User Story 1

- [x] T003 [US1] SessionCleanupProvider 클라이언트 컴포넌트 생성: `src/features/auth/SessionCleanupProvider.tsx`. `beforeunload` 이벤트 리스너를 등록하여 `navigator.sendBeacon('/api/auth/signout')` 호출. Next.js 내부 네비게이션(SPA 라우팅)과 페이지 새로고침 시에는 로그아웃하지 않도록 내부 네비게이션 플래그 처리
- [x] T004 [US1] SessionCleanupProvider를 포탈 레이아웃에 삽입: `src/app/(portal)/layout.tsx`에서 인증된 사용자일 때만 SessionCleanupProvider를 렌더링
- [x] T005 [US1] SessionCleanupProvider를 어드민 레이아웃에 삽입: `src/app/admin/layout.tsx`에서 인증된 사용자일 때만 SessionCleanupProvider를 렌더링

**Checkpoint**: 탭 종료 시 자동 로그아웃이 동작하며, 내부 네비게이션 시에는 로그아웃되지 않음

---

## Phase 3: Polish & Cross-Cutting Concerns

**Purpose**: 엣지 케이스 처리 및 검증

- [x] T006 기존 명시적 로그아웃 동작 검증: `src/features/dashboard/ProfileDropdown.tsx`와 `src/features/admin/LogoutButton.tsx`의 기존 로그아웃 버튼이 정상 동작하는지 확인
- [x] T007 quickstart.md 시나리오 검증: 탭 닫기, 브라우저 종료, 다중 탭, 명시적 로그아웃 4가지 시나리오 수동 테스트

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **User Story 1 (Phase 2)**: Depends on T001 (세션 쿠키 전환) and T002 (Route Handler) completion
- **Polish (Phase 3)**: Depends on Phase 2 completion

### Within User Story 1

- T003 depends on T001, T002 (Route Handler가 존재해야 sendBeacon 타겟 있음)
- T004, T005 depend on T003 (Provider 컴포넌트가 먼저 생성되어야 함)
- T004, T005 can run in parallel (different layout files)

### Parallel Opportunities

- T001과 T002는 서로 독립적이므로 병렬 실행 가능
- T004와 T005는 서로 다른 레이아웃 파일이므로 병렬 실행 가능

---

## Parallel Example: Phase 1

```bash
# 병렬 실행 가능:
Task T001: "세션 쿠키 전환 in src/shared/infrastructure/supabase/server.ts"
Task T002: "Route Handler 생성 in src/app/api/auth/signout/route.ts"
```

## Parallel Example: User Story 1 (레이아웃 삽입)

```bash
# T003 완료 후 병렬 실행 가능:
Task T004: "포탈 레이아웃에 Provider 삽입 in src/app/(portal)/layout.tsx"
Task T005: "어드민 레이아웃에 Provider 삽입 in src/app/admin/layout.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001, T002 병렬)
2. Complete Phase 2: User Story 1 (T003 → T004, T005 병렬)
3. **STOP and VALIDATE**: 탭 닫기 → 재접속 → 로그인 페이지 확인
4. Complete Phase 3: Polish (T006, T007)

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- `beforeunload`에서 `sendBeacon`은 비동기이므로 탭 닫기를 차단하지 않음
- SPA 내부 네비게이션 감지가 핵심 — Next.js App Router의 클라이언트 네비게이션 시 `beforeunload`가 발생하지 않으므로 기본적으로 안전하나, full page navigation(새로고침 등) 시 플래그 처리 필요
- Commit after each task or logical group
