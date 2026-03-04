# Tasks: 대시보드 프론트엔드 — 북마크 & 내 에이전트

**Input**: Design documents from `/specs/015-dashboard-frontend/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: 테스트 태스크는 명시적 요청이 없으므로 생략한다.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

**Note**: US1~US5 (대시보드 레이아웃, 검색, 페이지네이션, 프로필, 사이드바)는 이미 구현 완료. 이 태스크 목록은 **US6 (북마크 + 내 에이전트)** 구현에 집중한다.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US6)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Database & Route Group Restructuring)

**Purpose**: `bookmarks` 테이블 생성 및 Route Group `(portal)` 도입으로 `/dashboard`와 `/myagent` 공유 레이아웃 구성

- [x] T001 Create `bookmarks` table in Supabase with columns: `id` (uuid PK), `user_id` (uuid FK → auth.users ON DELETE CASCADE), `skill_id` (uuid FK → skills ON DELETE CASCADE), `created_at` (timestamptz DEFAULT now()). Add UNIQUE constraint on `(user_id, skill_id)`. Enable RLS with 3 policies: SELECT (`auth.uid() = user_id`), INSERT (`auth.uid() = user_id`), DELETE (`auth.uid() = user_id`). Use Supabase MCP `apply_migration`
- [x] T002 Restructure routes to Route Group `(portal)`: Move `src/app/dashboard/layout.tsx` to `src/app/(portal)/layout.tsx`, move `src/app/dashboard/page.tsx` to `src/app/(portal)/dashboard/page.tsx`, move `src/app/dashboard/actions.ts` to `src/app/(portal)/dashboard/actions.ts`, move `src/app/dashboard/error.tsx` to `src/app/(portal)/dashboard/error.tsx`, move `src/app/dashboard/loading.tsx` to `src/app/(portal)/dashboard/loading.tsx`. Verify `/dashboard` URL still works after restructuring

---

## Phase 2: Foundational (Bookmark Bounded Context)

**Purpose**: `src/bookmark/` 바운디드 컨텍스트 domain/application/infrastructure 레이어 생성

**⚠️ CRITICAL**: US6 태스크는 이 페이즈 완료 후 시작 가능

- [x] T003 Create bookmark domain types and `BookmarkRepository` interface in `src/bookmark/domain/types.ts`. Interface methods: `getBookmarkedSkillIds(userId: string): Promise<string[]>`, `getBookmarkedSkills(userId: string): Promise<DashboardSkillCard[]>`, `addBookmark(userId: string, skillId: string): Promise<void>`, `removeBookmark(userId: string, skillId: string): Promise<void>`, `isBookmarked(userId: string, skillId: string): Promise<boolean>`. Import `DashboardSkillCard` from `@/dashboard/domain/types`
- [x] T004 Implement `SupabaseBookmarkRepository` in `src/bookmark/infrastructure/supabase-bookmark-repository.ts`. `getBookmarkedSkillIds`: SELECT skill_id FROM bookmarks WHERE user_id. `getBookmarkedSkills`: JOIN bookmarks + skills + categories WHERE user_id AND status='published', ORDER BY bookmarks.created_at DESC, map to `DashboardSkillCard`. `addBookmark`: INSERT INTO bookmarks. `removeBookmark`: DELETE FROM bookmarks WHERE user_id AND skill_id. `isBookmarked`: SELECT count FROM bookmarks WHERE user_id AND skill_id
- [x] T005 [P] Create `ToggleBookmarkUseCase` in `src/bookmark/application/toggle-bookmark-use-case.ts`. Constructor accepts `BookmarkRepository`. `execute(userId, skillId)`: check `isBookmarked` → if true: `removeBookmark`, return `{ bookmarked: false }` → if false: `addBookmark`, return `{ bookmarked: true }`
- [x] T006 [P] Create `GetUserBookmarksUseCase` in `src/bookmark/application/get-user-bookmarks-use-case.ts`. Constructor accepts `BookmarkRepository`. `execute(userId)`: delegates to `repository.getBookmarkedSkills(userId)`. Also add `getBookmarkedSkillIds(userId)` method delegating to `repository.getBookmarkedSkillIds(userId)`

**Checkpoint**: Bookmark 바운디드 컨텍스트 완성 — US6 구현 가능

---

## Phase 3: User Story 6 - 스킬 북마크 및 내 에이전트 (Priority: P2)

**Goal**: 스킬 카드에 북마크 토글 버튼을 추가하고, `/myagent` 페이지에서 북마크된 스킬을 그리드로 표시

**Independent Test**: 스킬 카드의 북마크 버튼 클릭 시 DB에 저장/삭제되고, `/myagent`에서 북마크된 스킬만 표시되는지 확인

### Implementation for User Story 6

- [x] T007 [P] [US6] Add `toggleBookmark` server action in `src/app/(portal)/dashboard/actions.ts`. Pattern: `'use server'`, `supabase.auth.getUser()` → if no user throw error, instantiate `SupabaseBookmarkRepository` → `ToggleBookmarkUseCase` → `execute(user.id, skillId)`. Call `revalidatePath('/dashboard')` and `revalidatePath('/myagent')`. Return `{ bookmarked: boolean }`
- [x] T008 [P] [US6] Create `BookmarkButton` client component in `src/features/bookmark/BookmarkButton.tsx`. Props: `skillId: string`, `isBookmarked: boolean`. Use `useOptimistic` for instant UI feedback. On click: call `toggleBookmark` server action. Render `Bookmark` icon (lucide-react) when not bookmarked, `BookmarkCheck` icon when bookmarked. Style: positioned at top-right of card, transparent background, hover effect. Use `useTransition` for pending state
- [x] T009 [US6] Update `DashboardSkillCard` in `src/features/dashboard/DashboardSkillCard.tsx`. Add `isBookmarked?: boolean` prop. Import and render `BookmarkButton` at top-right corner of card (absolute positioned). Pass `skill.id` and `isBookmarked` to BookmarkButton. Card must have `relative` positioning for absolute child
- [x] T010 [US6] Update `DashboardSkillGrid` in `src/features/dashboard/DashboardSkillGrid.tsx`. Add `bookmarkedSkillIds?: string[]` prop. Pass `isBookmarked={bookmarkedSkillIds?.includes(skill.id)}` to each `DashboardSkillCard`
- [x] T011 [US6] Update dashboard `page.tsx` in `src/app/(portal)/dashboard/page.tsx`. Import `SupabaseBookmarkRepository` and `GetUserBookmarksUseCase`. Fetch authenticated user from supabase (via `createClient`). Call `getBookmarkedSkillIds(user.id)` to get bookmark IDs. Pass `bookmarkedSkillIds` to `DashboardSkillGrid`
- [x] T012 [P] [US6] Create myagent page in `src/app/(portal)/myagent/page.tsx`. Server Component: get authenticated user via `createClient` + `supabase.auth.getUser()`. Instantiate `SupabaseBookmarkRepository` → `GetUserBookmarksUseCase` → `execute(user.id)`. Render header "내 에이전트", subtitle "북마크한 스킬 목록입니다". Render 3-column grid with `DashboardSkillCard` (all cards with `isBookmarked={true}`). Empty state: "북마크한 스킬이 없습니다" message with icon
- [x] T013 [P] [US6] Create myagent `error.tsx` and `loading.tsx` in `src/app/(portal)/myagent/`. `error.tsx`: same pattern as dashboard error (retry button + error message). `loading.tsx`: skeleton with grid placeholders (similar to dashboard loading but without search bar)
- [x] T014 [US6] Update `DashboardSidebar` in `src/features/dashboard/DashboardSidebar.tsx`. Change "내 에이전트" button click handler: replace `onTabChange('my-agents')` with `router.push('/myagent')`. Keep `onTabChange('my-agents')` call as well for immediate active state update
- [x] T015 [US6] Update `DashboardLayoutClient` in `src/features/dashboard/DashboardLayoutClient.tsx`. Add `usePathname()` from `next/navigation`. Derive activeTab: if pathname is `/myagent` → `'my-agents'`, else use existing logic (categoryId → category tab, default → dashboard). Remove `showMyAgents` useState. Remove `ComingSoonContent` import and rendering. Always render `{children}` (no conditional)

**Checkpoint**: 북마크 기능 완성 — 대시보드에서 북마크 토글, `/myagent`에서 북마크된 스킬 그리드 표시

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Edge cases, error handling, visual refinement

- [x] T016 [P] Verify bookmark optimistic UI rollback on network error — BookmarkButton should revert to previous state if `toggleBookmark` server action fails in `src/features/bookmark/BookmarkButton.tsx`
- [x] T017 Build verification — run `npx next build` to ensure all route restructuring and new components compile without errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 (bookmarks table + route group) — BLOCKS US6
- **US6 (Phase 3)**: Depends on Phase 2 completion
- **Polish (Phase 4)**: Depends on US6 completion

### Within US6

- T007, T008 can run in parallel (different files)
- T009 depends on T008 (BookmarkButton must exist)
- T010 depends on T009 (card must accept bookmarkedSkillIds)
- T011 depends on T010 (grid must accept bookmarkedSkillIds)
- T012, T013 can run in parallel with T009-T011 (different route)
- T014, T015 can run in parallel with T012-T013 (different files)

### Parallel Opportunities

- T005, T006 (use cases) can run in parallel
- T007, T008 (server action, bookmark button) can run in parallel
- T012, T013 (myagent page, myagent error/loading) can run in parallel
- T014, T015 (sidebar update, layout client update) can run in parallel

---

## Parallel Example: Phase 2 (Foundational)

```
# After T004 (repository) completes:
Task T005: "ToggleBookmarkUseCase" in application/
Task T006: "GetUserBookmarksUseCase" in application/
→ Both can run in parallel (different files, no dependencies)
```

## Parallel Example: Phase 3 (US6)

```
# After Phase 2 completes:
Task T007: "toggleBookmark server action" in app/(portal)/dashboard/actions.ts
Task T008: "BookmarkButton" in features/bookmark/
→ Both can run in parallel (different files)

# After T008 completes:
Task T009 → T010 → T011: Sequential (each extends the previous component)

# Independent of T009-T011:
Task T012: "myagent page" in app/(portal)/myagent/
Task T013: "myagent error/loading" in app/(portal)/myagent/
→ Both can run in parallel with T009-T011

# After main components exist:
Task T014: "Sidebar update" in features/dashboard/
Task T015: "LayoutClient update" in features/dashboard/
→ Both can run in parallel
```

---

## Implementation Strategy

### Sequential Execution

1. Complete Phase 1: Setup (T001-T002) — DB table + route restructuring
2. Complete Phase 2: Foundational (T003-T006) — bookmark domain layer
3. Complete Phase 3: US6 (T007-T015) — bookmark UI + myagent page
4. Complete Phase 4: Polish (T016-T017) — verification

### Incremental Delivery

1. Setup + Foundational → Bookmark 인프라 준비
2. T007-T011 → 대시보드에서 북마크 토글 가능
3. T012-T015 → `/myagent` 페이지 + 사이드바 연동
4. Polish → 에지 케이스 + 빌드 검증

---

## Notes

- [P] tasks = different files, no dependencies
- [US6] = User Story 6 (스킬 북마크 및 내 에이전트)
- US1-US5 tasks (T001-T024 in previous session) are all completed
- Route Group `(portal)` restructuring in T002 is the most critical task — must be done carefully to avoid breaking existing `/dashboard` functionality
- `BookmarkButton` uses `useOptimistic` for instant feedback — rollback is automatic on server action failure
- Commit after each task or logical group
- Design reference: `stitch-html/dashboard.html` (colors, layout, card styles)
