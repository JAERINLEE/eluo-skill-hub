# Tasks: 어드민 피드백 관리 페이지

**Input**: Design documents from `/specs/028-admin-feedback-management/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: 기존 코드 파악 및 타입 기반 인프라 준비

- [x] T001 `FeedbackRow`에 `isSecret`, `replyCount` 필드 추가 및 `FeedbackReplyRow`, `CreateFeedbackReplyInput`, `CreateFeedbackReplyResult` 타입 정의 in `src/admin/domain/types.ts`
- [x] T002 `AdminRepository` 인터페이스에 `getFeedbackReplies`, `createFeedbackReply` 메서드 시그니처 추가 in `src/admin/domain/types.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 User Story에서 사용하는 인프라 레이어 구현

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 `getFeedbacks` 쿼리 확장: `is_secret` 필드 추가, `feedback_replies` count 서브쿼리 조인, `deleted_at IS NULL` 필터링 in `src/admin/infrastructure/supabase-admin-repository.ts`
- [x] T004 [P] `getFeedbackReplies(feedbackId)` 메서드 구현: 댓글 목록 조회 (최신순, profiles 조인) in `src/admin/infrastructure/supabase-admin-repository.ts`
- [x] T005 [P] `createFeedbackReply(userId, input)` 메서드 구현: 댓글 삽입 in `src/admin/infrastructure/supabase-admin-repository.ts`
- [x] T006 [P] `GetFeedbackRepliesUseCase` 생성 in `src/admin/application/get-feedback-replies-use-case.ts`
- [x] T007 [P] `CreateFeedbackReplyUseCase` 생성 in `src/admin/application/create-feedback-reply-use-case.ts`
- [x] T008 댓글 조회/작성 Server Actions 생성 (`getRepliesAction`, `createReplyAction`) in `src/app/admin/feedbacks/actions.ts`

**Checkpoint**: Repository, UseCase, Server Action 레이어 완성 — UI 작업 시작 가능

---

## Phase 3: User Story 1 - 피드백 목록 테이블뷰 조회 (Priority: P1) 🎯 MVP

**Goal**: 관리자가 모든 스킬의 피드백을 테이블 형태로 조회. 비밀글 뱃지, 댓글 수, 페이지네이션 포함.

**Independent Test**: `/admin/feedbacks` 접근 → 테이블에 피드백 목록 렌더링, 비밀글 뱃지 표시, 댓글 수 표시, 페이지네이션 동작 확인

### Implementation for User Story 1

- [x] T009 [US1] `FeedbacksTable` 테이블 헤더에 비밀글, 댓글 수 컬럼 추가 및 각 행에 `isSecret` 뱃지, `replyCount` 표시 in `src/features/admin/FeedbacksTable.tsx`
- [x] T010 [US1] 빈 상태 메시지를 "등록된 피드백이 없습니다"로 변경 in `src/features/admin/FeedbacksTable.tsx`
- [x] T011 [US1] `page.tsx`에서 확장된 `FeedbackRow` 데이터 전달 확인 in `src/app/admin/feedbacks/page.tsx`

**Checkpoint**: 피드백 목록 테이블뷰 MVP 완성 — 비밀글 뱃지, 댓글 수, 페이지네이션 동작

---

## Phase 4: User Story 2 - 아코디언으로 댓글 조회 (Priority: P1)

**Goal**: 피드백 행 클릭 시 아코디언이 펼쳐지며 해당 피드백의 댓글 목록(최신순) 표시

**Independent Test**: 피드백 행 클릭 → 아코디언 펼침 → 댓글 목록 표시 (또는 "댓글이 없습니다") → 다시 클릭 → 아코디언 접힘

### Implementation for User Story 2

- [x] T012 [P] [US2] `FeedbackReplies` 컴포넌트 생성: 댓글 목록 렌더링 (작성자, 내용, 작성일), 빈 상태 메시지 in `src/features/admin/FeedbackReplies.tsx`
- [x] T013 [US2] `FeedbacksTable`을 클라이언트 컴포넌트로 전환하고 아코디언 토글 상태 관리 추가, 행 클릭 시 Server Action으로 댓글 조회 후 `FeedbackReplies` 렌더링 in `src/features/admin/FeedbacksTable.tsx`

**Checkpoint**: 아코디언 댓글 조회 완성 — 행 클릭으로 댓글 확인 가능

---

## Phase 5: User Story 3 - 관리자 댓글 작성 (Priority: P1)

**Goal**: 아코디언 내 댓글 작성 폼을 통해 관리자가 댓글을 등록하고 즉시 목록에 반영

**Independent Test**: 아코디언 열기 → 댓글 입력 → 등록 → 목록에 반영 확인 / 빈 내용 등록 시 유효성 메시지 / 에러 시 입력 내용 유지

### Implementation for User Story 3

- [x] T014 [P] [US3] `FeedbackReplyForm` 컴포넌트 생성: 텍스트 입력, 등록 버튼, 유효성 검증(빈 내용 차단), 로딩/에러 상태 처리 in `src/features/admin/FeedbackReplyForm.tsx`
- [x] T015 [US3] `FeedbackReplies` 하단에 `FeedbackReplyForm` 통합, 댓글 작성 후 목록 갱신 로직 연결 in `src/features/admin/FeedbackReplies.tsx`

**Checkpoint**: 관리자 댓글 작성 완성 — 댓글 CRUD 전체 흐름 동작

---

## Phase 6: User Story 4 - 비밀글 피드백의 댓글 비밀 처리 (Priority: P2)

**Goal**: 비밀글 피드백에 달린 관리자 댓글이 대시보드에서 비밀 처리됨. 어드민에서는 모든 내용 표시.

**Independent Test**: 비밀글 피드백에 댓글 작성 → 대시보드에서 작성자 본인은 확인 가능 → 다른 사용자는 "비밀글입니다" 표시

### Implementation for User Story 4

- [x] T016 [US4] 대시보드 피드백 댓글 조회 시 부모 피드백의 `is_secret`이 true이고 현재 사용자가 작성자가 아닌 경우 댓글 내용을 마스킹 처리하는 로직 추가 in `src/skill-detail/infrastructure/supabase-skill-detail-repository.ts`
- [x] T017 [US4] 대시보드 스킬 상세에서 비밀글 피드백의 댓글 렌더링 시 마스킹 UI 적용 in `src/features/skill-detail/SkillDetailModal.tsx`

**Checkpoint**: 비밀글 연동 완성 — 어드민은 전체 확인, 대시보드는 권한별 마스킹

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 전체 기능 통합 검증 및 품질 개선

- [x] T018 타입 체크 통과 확인 (`npx tsc --noEmit`)
- [x] T019 [P] E2E 테스트 작성: 피드백 목록 조회, 아코디언 댓글 조회/작성, 비밀글 처리 in `src/__tests__/e2e/admin-feedback.spec.ts`
- [x] T020 quickstart.md 검증 시나리오 실행

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — 즉시 시작
- **Foundational (Phase 2)**: Phase 1 완료 후 시작 — 모든 User Story 블로킹
- **US1 (Phase 3)**: Phase 2 완료 후 시작
- **US2 (Phase 4)**: Phase 3 (US1) 완료 후 시작 (테이블 컴포넌트 확장 필요)
- **US3 (Phase 5)**: Phase 4 (US2) 완료 후 시작 (아코디언 내 폼 통합)
- **US4 (Phase 6)**: Phase 2 완료 후 시작 — US1~3과 독립적 (대시보드 쪽 변경)
- **Polish (Phase 7)**: Phase 3~6 모두 완료 후

### User Story Dependencies

- **US1 (P1)**: Foundational 이후 바로 시작 가능
- **US2 (P1)**: US1에 의존 (FeedbacksTable 확장)
- **US3 (P1)**: US2에 의존 (아코디언 내 폼 배치)
- **US4 (P2)**: Foundational 이후 독립적으로 시작 가능 (대시보드 쪽 별도 파일)

### Parallel Opportunities

- T004, T005 병렬 가능 (같은 파일이지만 독립 메서드)
- T006, T007 병렬 가능 (별도 파일)
- T012, T014 병렬 가능 (별도 파일, US2/US3 컴포넌트)
- US4 (Phase 6)는 US1~3과 병렬 진행 가능

---

## Parallel Example: Foundational Phase

```bash
# Repository 메서드 병렬 구현:
Task T004: "getFeedbackReplies 메서드 in supabase-admin-repository.ts"
Task T005: "createFeedbackReply 메서드 in supabase-admin-repository.ts"

# UseCase 병렬 생성:
Task T006: "GetFeedbackRepliesUseCase in get-feedback-replies-use-case.ts"
Task T007: "CreateFeedbackReplyUseCase in create-feedback-reply-use-case.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup (T001~T002)
2. Phase 2: Foundational (T003~T008)
3. Phase 3: US1 — 피드백 목록 테이블뷰 (T009~T011)
4. **STOP and VALIDATE**: 테이블뷰에 비밀글 뱃지, 댓글 수, 페이지네이션 동작 확인

### Incremental Delivery

1. Setup + Foundational → 인프라 준비 완료
2. US1 → 테이블뷰 MVP 배포
3. US2 → 아코디언 댓글 조회 추가
4. US3 → 댓글 작성 기능 추가
5. US4 → 비밀글 연동 (대시보드)
6. Polish → E2E 테스트, 타입 검증

---

## Notes

- DB 스키마 변경 없음 — 기존 `skill_feedback_logs`, `feedback_replies` 테이블 그대로 사용
- `FeedbacksTable`은 US2에서 클라이언트 컴포넌트로 전환 필요 (아코디언 상태 관리)
- 비밀글 처리(US4)는 대시보드 쪽 변경이므로 어드민 기능과 독립적으로 진행 가능
- Commit after each phase completion
