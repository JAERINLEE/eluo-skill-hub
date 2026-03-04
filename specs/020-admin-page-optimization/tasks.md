# Tasks: 어드민 페이지 최적화

**Input**: Design documents from `/specs/020-admin-page-optimization/`
**Prerequisites**: plan.md (required), spec.md (required for user stories)

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

## Phase 3: User Story 1 - 스킬 CRUD 작업 속도 개선 (Priority: P1) 🎯 MVP

**Goal**: 스킬 CRUD 서버 액션의 순차적 파일 처리(업로드/삭제)를 `Promise.all`로 병렬화하여 작업 완료 시간을 30% 이상 단축하고, 수정 팝업의 `verifyAdmin()` 중복 호출을 최적화한다.

**Independent Test**: 템플릿 파일 3개 이상을 포함한 스킬을 생성·수정·삭제하면서 작업 완료 시간을 측정. 수정 팝업이 정상적으로 열리는지 확인.

### Implementation for User Story 1

- [X] T001 [US1] `createSkill()` 내 마크다운 업로드 + 템플릿 파일들 업로드를 `Promise.all`로 병렬화 in `src/admin/infrastructure/supabase-admin-repository.ts`
  - 현재: 마크다운 업로드 → for 루프로 템플릿 파일 순차 업로드
  - 변경: 마크다운 업로드와 모든 템플릿 파일 업로드를 `Promise.all`로 동시 실행
  - 개별 실패 시 기존 에러 처리 패턴 유지

- [X] T002 [US1] `updateSkill()` 내 파일 삭제 병렬화 + 파일 업로드 병렬화 in `src/admin/infrastructure/supabase-admin-repository.ts`
  - 현재: 기존 마크다운 삭제 → 새 마크다운 업로드 → for 루프로 기존 템플릿 삭제 → for 루프로 새 템플릿 업로드
  - 변경: 삭제 작업들을 `Promise.all` → 업로드 작업들을 `Promise.all` (삭제 후 업로드 순서 유지)
  - 의존: T001과 같은 파일이므로 순차 실행

- [X] T003 [US1] `deleteSkill()` 내 피드백 삭제 + 파일 삭제를 `Promise.all`로 병렬화 in `src/admin/infrastructure/supabase-admin-repository.ts`
  - 현재: 피드백 삭제 → for 루프로 템플릿 파일 삭제 → 마크다운 삭제 → DB 레코드 삭제
  - 변경: 피드백 삭제 + 모든 템플릿 파일 삭제 + 마크다운 삭제를 `Promise.all` → DB 레코드 삭제
  - 의존: T002와 같은 파일이므로 순차 실행

- [X] T004 [US1] 수정 팝업 페이지에서 `verifyAdmin()` 1회 호출로 통합 in `src/app/admin/skills/@modal/(.)edit/[id]/page.tsx`
  - 현재: `getSkillById()`와 `getCategories()` 각각 내부에서 `verifyAdmin()` 호출
  - 변경: 페이지 서버 컴포넌트에서 `verifyAdmin()` 1회 호출 후, 인증된 상태에서 데이터 조회 로직만 실행
  - 서버 액션(`createSkill`, `updateSkill`, `deleteSkill`)의 독립 인증은 보안상 유지

**Checkpoint**: 스킬 생성·수정·삭제 시 파일 처리가 병렬로 실행되어 이전 대비 빠르게 완료됨. 수정 팝업 오픈 시 인증 쿼리 중복이 제거됨.

---

## Phase 4: User Story 2 - 데이터 변경 후 관리 화면 즉시 반영 (Priority: P2)

**Goal**: 스킬 생성·수정 서버 액션과 멤버 역할 변경 서버 액션에 누락된 `revalidatePath` 호출을 추가하여, 데이터 변경 후 관련 페이지에서 항상 최신 데이터가 표시되도록 한다.

**Independent Test**: 스킬 생성 후 스킬 목록으로 돌아가서 새 스킬이 표시되는지 확인. 멤버 역할 변경 후 목록에서 변경된 역할이 표시되는지 확인.

### Implementation for User Story 2

- [X] T005 [P] [US2] `createSkill`, `updateSkill` 서버 액션에 `revalidatePath('/admin/skills')` + `revalidatePath('/admin')` 추가 in `src/app/admin/skills/actions.ts`
  - 현재: `deleteSkill`만 `revalidatePath('/admin/skills')` 호출 — `createSkill`과 `updateSkill`은 미호출
  - 변경: `createSkill` 성공 후 `revalidatePath('/admin/skills')` + `revalidatePath('/admin')` 추가
  - 변경: `updateSkill` 성공 후 `revalidatePath('/admin/skills')` + `revalidatePath('/admin')` 추가
  - `deleteSkill`에도 `revalidatePath('/admin')` 추가 (기존 `/admin/skills`만 있음)

- [X] T006 [P] [US2] `updateMemberRole` 서버 액션에 `revalidatePath('/admin/members')` + `revalidatePath('/admin')` 추가 in `src/app/admin/members/actions.ts`
  - 현재: 역할 변경 후 `revalidatePath` 미호출
  - 변경: 성공적 역할 변경 후 `revalidatePath('/admin/members')` + `revalidatePath('/admin')` 호출

**Checkpoint**: 스킬 생성·수정·삭제 및 멤버 역할 변경 후 관련 관리 페이지에서 최신 데이터가 즉시 반영됨.

---

## Phase 5: User Story 3 - 어드민 마크다운 프리뷰 노션 스타일 통일 (Priority: P3)

**Goal**: `NotionStyleMarkdown` 컴포넌트를 `src/shared/components/`로 이동하여 어드민과 대시보드 모듈 모두에서 공유하고, 어드민 마크다운 프리뷰를 대시보드와 동일한 노션 스타일로 통일한다.

**Independent Test**: 어드민 스킬 생성/수정 폼에서 마크다운 파일을 업로드한 뒤 프리뷰가 대시보드 스킬 팝업과 동일한 스타일(코드 블록 다크 테마, 노션 테이블, 인라인 코드 레드 텍스트, frontmatter 카드)로 렌더링되는지 시각적 비교.

### Implementation for User Story 3

- [X] T007 [US3] `NotionStyleMarkdown.tsx`와 `notion-markdown.css`를 `src/shared/components/`로 이동 in `src/features/skill-detail/NotionStyleMarkdown.tsx` → `src/shared/components/NotionStyleMarkdown.tsx`, `src/features/skill-detail/notion-markdown.css` → `src/shared/components/notion-markdown.css`
  - `src/shared/components/` 디렉토리가 없으면 생성
  - 파일 이동 후 원본 삭제

- [X] T008 [P] [US3] `SkillDetailGuide.tsx`의 import 경로를 `src/shared/components/NotionStyleMarkdown`으로 변경 in `src/features/skill-detail/SkillDetailGuide.tsx`
  - 현재: `./NotionStyleMarkdown` 또는 상대 경로로 import
  - 변경: `@/shared/components/NotionStyleMarkdown`으로 변경
  - CSS import도 `@/shared/components/notion-markdown.css`로 변경
  - 의존: T007 완료 후

- [X] T009 [P] [US3] `MarkdownPreview.tsx`의 내부 구현을 `NotionStyleMarkdown` 컴포넌트로 교체 in `src/features/admin/MarkdownPreview.tsx`
  - 현재: `react-markdown` + GitHub light 테마의 간단한 `prose` 래퍼
  - 변경: `@/shared/components/NotionStyleMarkdown`을 import하여 사용
  - `notion-markdown.css`도 import
  - MarkdownPreview의 외부 인터페이스(props)는 유지하고 내부 렌더링만 교체
  - 의존: T007 완료 후

**Checkpoint**: 어드민 마크다운 프리뷰가 대시보드 스킬 팝업과 시각적으로 동일한 노션 스타일로 렌더링됨.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: 전체 회귀 검증 및 최종 확인

- [X] T010 TypeScript 타입 체크 — `tsc --noEmit` 실행하여 타입 에러 없음 확인
- [X] T011 전체 기능 회귀 검증 — 스킬 생성·수정·삭제, 스킬 검색, 상태 필터, 카테고리 필터, 멤버 관리, 피드백 조회, 마크다운 프리뷰가 최적화 전과 동일하게 동작하는지 확인
- [X] T012 비관리자 접근 테스트 — 비관리자 사용자가 어드민 페이지에 접근할 때 적절히 차단되는지 확인

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: 해당 없음
- **Phase 2 (Foundational)**: 해당 없음
- **Phase 3 (US1)**: 즉시 시작 가능
- **Phase 4 (US2)**: 즉시 시작 가능 — US1과 독립적 (다른 파일/함수)
- **Phase 5 (US3)**: 즉시 시작 가능 — US1/US2와 독립적 (다른 파일)
- **Phase 6 (Polish)**: US1 + US2 + US3 모두 완료 후

### User Story Dependencies

- **US1 (P1)**: 독립 — `supabase-admin-repository.ts` + `@modal/(.)edit/[id]/page.tsx`
- **US2 (P2)**: 독립 — `skills/actions.ts` + `members/actions.ts`
- **US3 (P3)**: 독립 — `NotionStyleMarkdown.tsx` 이동 + `MarkdownPreview.tsx` 교체

### Within Each User Story

- **US1**: T001 → T002 → T003 (같은 파일 순차) → T004 (다른 파일, T001~T003 이후 추천)
- **US2**: T005 ∥ T006 (서로 다른 파일이므로 병렬 가능)
- **US3**: T007 (이동) → T008 ∥ T009 (서로 다른 파일이므로 병렬 가능)

### Parallel Opportunities

- **US1의 T001~T003과 US2의 T005~T006**: 서로 다른 파일이므로 병렬 가능
- **US3의 T007은 US1/US2와 독립**: 서로 다른 파일이므로 병렬 가능
- **T005와 T006**: 서로 다른 파일(`skills/actions.ts` vs `members/actions.ts`)이므로 병렬 가능
- **T008과 T009**: 서로 다른 파일(`SkillDetailGuide.tsx` vs `MarkdownPreview.tsx`)이므로 병렬 가능

---

## Parallel Example: US1과 US2

```bash
# US1과 US2는 서로 다른 파일을 수정하므로 동시 진행 가능:
Task: T001 [US1] createSkill() 파일 처리 병렬화 (supabase-admin-repository.ts)
Task: T005 [US2] createSkill/updateSkill에 revalidatePath 추가 (skills/actions.ts)
Task: T006 [US2] updateMemberRole에 revalidatePath 추가 (members/actions.ts)
```

## Parallel Example: US3 이동 후 import 변경

```bash
# T007 완료 후 T008과 T009는 병렬 가능:
Task: T008 [US3] SkillDetailGuide.tsx import 경로 변경
Task: T009 [US3] MarkdownPreview.tsx 내부 구현 교체
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. T001~T003: CRUD 파일 처리 병렬화
2. T004: verifyAdmin 최적화
3. **검증**: 스킬 CRUD 작업 시간 30% 이상 단축 확인
4. 이 시점에서 가장 큰 성능 개선이 이미 달성됨

### Incremental Delivery

1. US1 완료 → 파일 처리 병렬화 + verifyAdmin 최적화 (MVP)
2. US2 완료 → 데이터 정합성 보장 (revalidatePath 추가)
3. US3 완료 → 마크다운 프리뷰 노션 스타일 통일
4. Polish → 타입 체크 + 회귀 검증

---

## Notes

- 모든 변경은 기존 파일 수정 + `NotionStyleMarkdown` 이동만 수행 (새 파일 생성 없음)
- `any` 타입 사용 금지 (헌법 원칙 I)
- Clean Architecture 레이어 경계 유지 (헌법 원칙 II)
- Feature Module Isolation — `NotionStyleMarkdown`을 `src/shared/`로 이동하여 크로스 모듈 import 방지 (헌법 원칙 IV)
- 서버 액션의 독립 인증은 보안상 유지 (헌법 원칙 V)
- US1~US3 모두 서로 다른 파일을 수정하므로 전체적으로 높은 병렬성 확보
