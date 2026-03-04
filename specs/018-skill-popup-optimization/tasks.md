# Tasks: 스킬 팝업 렌더링 최적화

**Input**: Design documents from `/specs/018-skill-popup-optimization/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md

**Tests**: 테스트는 별도 요청 시 추가. 이 태스크 목록에는 구현 태스크만 포함.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: 이 피처는 기존 코드 최적화이므로 별도의 프로젝트 초기화가 필요 없음. 새 의존성 추가 없음, DB 스키마 변경 없음.

(설정 태스크 없음 — 즉시 Phase 3으로 진행)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 유저 스토리에 공통으로 필요한 기반 작업 없음. 각 스토리가 독립적인 파일/메서드를 수정하므로 바로 유저 스토리 구현 시작 가능.

(기반 태스크 없음 — 즉시 Phase 3으로 진행)

---

## Phase 3: User Story 1 - 스킬 팝업 즉시 응답 (Priority: P1) 🎯 MVP

**Goal**: `getSkillDetailPopup` 메서드의 순차적 DB 쿼리를 병렬화하여 스킬 상세 정보 로딩 시간을 40% 이상 단축한다.

**Independent Test**: 스킬 카드 클릭 → 팝업에 제목, 설명, 카테고리, 작성자, 평점이 표시되기까지의 시간을 측정하여 개선 전후 비교.

### Implementation for User Story 1

- [x] T001 [US1] `getSkillDetailPopup` 메서드에서 author profile, templates, feedback stats 3개 쿼리를 `Promise.all`로 병렬화 in `src/skill-detail/infrastructure/supabase-skill-detail-repository.ts`
  - 현재: skill 조회 → author 조회 → templates 조회 → stats 조회 (4단계 sequential)
  - 변경: skill 조회 → `Promise.all([author, templates, stats])` (2단계로 축소)
  - skill 조회는 author_id를 얻기 위해 선행 필수
  - 각 병렬 쿼리의 에러가 전체를 실패시키지 않도록 개별 에러 핸들링 유지

- [x] T002 [US1] `SkillDetailModal`에 `AbortController` 기반 요청 취소 로직 추가 in `src/features/skill-detail/SkillDetailModal.tsx`
  - `useEffect` cleanup에서 `AbortController.abort()` 호출
  - 컴포넌트 언마운트 또는 skillId 변경 시 진행 중 요청 취소
  - abort된 요청의 응답으로 상태가 업데이트되지 않도록 cancelled 체크 추가
  - `loadData` 함수에서 `aborted` 시 상태 업데이트 스킵

**Checkpoint**: 스킬 팝업 열기 시 스킬 정보가 이전보다 빠르게 표시됨. 빠른 열기/닫기 시 오류 없음.

---

## Phase 4: User Story 2 - 마크다운 콘텐츠 빠른 렌더링 (Priority: P2)

**Goal**: 마크다운 렌더링 플러그인을 조건부로 적용하여 불필요한 처리 오버헤드를 제거하고 렌더링 속도를 개선한다.

**Independent Test**: 코드 블록이 없는 마크다운 콘텐츠의 팝업을 열었을 때 렌더링 시간이 단축되는지 확인. 코드 블록이 있는 경우 하이라이팅이 정상 적용되는지 확인.

### Implementation for User Story 2

- [x] T003 [US2] `rehypeHighlight` 플러그인을 코드 블록 존재 여부에 따라 조건부 적용하도록 변경 in `src/features/skill-detail/NotionStyleMarkdown.tsx`
  - `useMemo`로 마크다운 본문에 코드 블록(` ``` `)이 포함되어 있는지 정규식 검사
  - 코드 블록 존재 시에만 `rehypeHighlight`를 `rehypePlugins` 배열에 포함
  - `rehypePlugins` 배열을 `useMemo`로 메모이제이션하여 불필요한 재생성 방지
  - 기존 `rehypeSanitize`와 커스텀 스키마는 항상 적용

**Checkpoint**: 코드 블록 없는 마크다운이 더 빠르게 렌더링됨. 코드 블록 있는 마크다운의 하이라이팅 정상 동작.

---

## Phase 5: User Story 3 - 피드백 목록 효율적 로딩 (Priority: P3)

**Goal**: 피드백 조회에 페이지네이션을 적용하고 쿼리를 최적화하여, 피드백 수에 관계없이 일관된 로딩 속도를 보장한다.

**Independent Test**: 피드백이 50건 이상인 스킬과 5건 미만인 스킬의 팝업 로딩 시간 차이가 200ms 이내인지 확인. "더 보기" 버튼으로 추가 피드백 로딩 가능한지 확인.

### Implementation for User Story 3

- [x] T004 [P] [US3] `PaginatedFeedbacks` 타입 추가 in `src/skill-detail/domain/types.ts`
  - `feedbacks: readonly FeedbackWithReplies[]`, `totalCount: number`, `hasMore: boolean` 필드
  - 기존 `GetFeedbacksResult` 성공 타입의 반환값을 `PaginatedFeedbacks`로 변경

- [x] T005 [P] [US3] `ISkillDetailRepository` 인터페이스의 `getFeedbacksWithReplies` 시그니처에 `limit`, `offset` 선택적 파라미터 추가 in `src/skill-detail/application/ports.ts`
  - `getFeedbacksWithReplies(skillId: string, limit?: number, offset?: number): Promise<PaginatedFeedbacks>`
  - 기본값은 구현체에서 처리 (limit: 20, offset: 0)

- [x] T006 [US3] `getFeedbacksWithReplies` 메서드 최적화 in `src/skill-detail/infrastructure/supabase-skill-detail-repository.ts`
  - `.limit(limit)` 및 `.range(offset, offset + limit - 1)` 적용
  - `{ count: 'exact', head: true }` 옵션으로 전체 수 조회를 피드백 조회와 병렬 실행
  - feedbacks 조회 후 replies와 feedback-author profiles를 `Promise.all`로 병렬화
  - reply author의 user_id를 profileMap에 추가 병합
  - `PaginatedFeedbacks` 형태로 반환 (feedbacks, totalCount, hasMore)
  - 의존: T004, T005 완료 후

- [x] T007 [US3] `GetFeedbacksUseCase`에 `limit`, `offset` 파라미터 전달 및 `PaginatedFeedbacks` 반환 in `src/skill-detail/application/get-feedbacks-use-case.ts`
  - execute 메서드 시그니처에 `limit?`, `offset?` 추가
  - repository 호출 시 파라미터 전달
  - 결과 타입을 `PaginatedFeedbacks`로 업데이트
  - 의존: T006 완료 후

- [x] T008 [US3] `getSkillFeedbacksAction` 서버 액션에 `offset` 파라미터 추가 in `src/app/(portal)/dashboard/actions.ts`
  - 함수 시그니처에 `offset?: number` 추가
  - use case 호출 시 `limit: 20, offset` 전달
  - 의존: T007 완료 후

- [x] T009 [US3] `SkillDetailModal`에 피드백 "더 보기" 기능 구현 in `src/features/skill-detail/SkillDetailModal.tsx`
  - `feedbackOffset`, `hasMoreFeedbacks`, `loadingMoreFeedbacks` 상태 추가
  - "더 보기" 버튼 클릭 시 offset 증가 후 추가 피드백 서버 액션 호출
  - 새로 가져온 feedbacks를 기존 목록에 append
  - `totalCount` 표시 및 `hasMore`에 따른 버튼 표시/숨김
  - 의존: T008 완료 후

**Checkpoint**: 피드백이 많은 스킬도 빠르게 로딩됨. "더 보기"로 추가 피드백 정상 표시.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 전체 회귀 검증 및 최종 확인

- [x] T010 전체 스킬 팝업 기능 회귀 검증 — 스킬 정보 표시, 마크다운 렌더링 (frontmatter, 코드 블록, GFM 테이블), 피드백 표시/작성, 답글 작성, 템플릿 다운로드가 최적화 전과 동일하게 동작하는지 확인
- [x] T011 TypeScript 타입 체크 — `tsc --noEmit` 실행하여 타입 에러 없음 확인
- [x] T012 빠른 열기/닫기 반복 테스트 — 팝업을 빠르게 5회 이상 열고 닫으며 콘솔 에러, 메모리 누수, 중복 요청 없음 확인

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 해당 없음
- **Phase 2 (Foundational)**: 해당 없음
- **Phase 3 (US1)**: 즉시 시작 가능
- **Phase 4 (US2)**: 즉시 시작 가능 — US1과 독립적 (다른 파일)
- **Phase 5 (US3)**: 즉시 시작 가능 — US1/US2와 독립적 (T006만 같은 파일이지만 다른 메서드)
- **Phase 6 (Polish)**: US1 + US2 + US3 모두 완료 후

### User Story Dependencies

- **US1 (P1)**: 독립 — `getSkillDetailPopup` 메서드 + `SkillDetailModal` 수정
- **US2 (P2)**: 독립 — `NotionStyleMarkdown.tsx` 단독 수정
- **US3 (P3)**: 독립 — 4개 레이어(domain → application → infrastructure → UI) 순차 진행

### Within Each User Story

- **US1**: T001 (repository 병렬화) → T002 (modal AbortController) — T001이 먼저지만 T002는 독립 구현 가능
- **US2**: T003 단일 태스크
- **US3**: T004, T005 (병렬, 타입/인터페이스) → T006 (repository 구현) → T007 (use case) → T008 (server action) → T009 (UI)

### Parallel Opportunities

- **US1의 T001과 T002**: 서로 다른 파일이므로 병렬 가능 (단, T002가 T001의 새 응답 패턴에 맞춰야 하므로 순차 추천)
- **US3의 T004과 T005**: 서로 다른 파일(types.ts vs ports.ts)이므로 병렬 가능
- **US1, US2, US3 전체**: 각 스토리가 서로 다른 관심사를 다루므로 병렬 구현 가능

---

## Parallel Example: All User Stories

```bash
# US1과 US2는 완전히 다른 파일을 수정하므로 동시 진행 가능:
Task: T001 [US1] repository 쿼리 병렬화 (supabase-skill-detail-repository.ts의 getSkillDetailPopup)
Task: T003 [US2] 마크다운 조건부 플러그인 (NotionStyleMarkdown.tsx)

# US3의 타입과 인터페이스는 동시 작성 가능:
Task: T004 [US3] PaginatedFeedbacks 타입 (types.ts)
Task: T005 [US3] 인터페이스 시그니처 (ports.ts)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001: `getSkillDetailPopup` 쿼리 병렬화
2. T002: AbortController 추가
3. **검증**: 팝업 로딩 시간 40% 단축 확인
4. 이 시점에서 가장 큰 성능 개선이 이미 달성됨

### Incremental Delivery

1. US1 완료 → 쿼리 병렬화로 핵심 병목 해소 (MVP)
2. US2 완료 → 마크다운 렌더링 추가 최적화
3. US3 완료 → 피드백 페이지네이션으로 확장성 확보
4. Polish → 회귀 검증 + 타입 체크

---

## Notes

- 모든 변경은 기존 파일 내부 수정만 수행 (새 파일 생성 없음, T004의 타입 추가는 기존 types.ts에)
- `any` 타입 사용 금지 (헌법 원칙 I)
- Clean Architecture 레이어 경계 유지 (헌법 원칙 II)
- US3에서 `supabase-skill-detail-repository.ts`의 `getFeedbacksWithReplies` 수정 시 US1의 `getSkillDetailPopup` 변경과 파일이 겹치므로, 동시 작업 시 메서드 단위로 분리하여 충돌 최소화
