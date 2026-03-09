# Tasks: 스킬 버전 관리 및 태그 기능

**Input**: Design documents from `/specs/025-skill-version-tags/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (DB 마이그레이션)

**Purpose**: 새 테이블 및 컬럼 생성, RLS 정책 적용

- [x] T001 skills 테이블에 version 컬럼 추가 (text, NOT NULL, DEFAULT '1.0.0', max 20자) — Supabase MCP migration
- [x] T002 tags 테이블 생성 (id uuid PK, name text UNIQUE NOT NULL max 30자, created_at timestamptz) — Supabase MCP migration
- [x] T003 skill_tags 테이블 생성 (id uuid PK, skill_id FK→skills ON DELETE CASCADE, tag_id FK→tags ON DELETE CASCADE, created_at, UNIQUE(skill_id, tag_id)) — Supabase MCP migration
- [x] T004 skill_version_history 테이블 생성 (id uuid PK, skill_id FK→skills ON DELETE CASCADE, version text NOT NULL max 20자, changed_at timestamptz DEFAULT now(), note text nullable) — Supabase MCP migration
- [x] T005 [P] tags 테이블 RLS 정책 설정 (SELECT: authenticated, INSERT/DELETE: admin role) — Supabase MCP migration
- [x] T006 [P] skill_tags 테이블 RLS 정책 설정 (SELECT: authenticated, INSERT/DELETE: admin role) — Supabase MCP migration
- [x] T007 [P] skill_version_history 테이블 RLS 정책 설정 (SELECT: authenticated, INSERT: admin role) — Supabase MCP migration
- [x] T008 [P] skill_tags.skill_id, skill_tags.tag_id, skill_version_history.skill_id, skill_version_history.changed_at 인덱스 생성 — Supabase MCP migration

**Checkpoint**: DB 스키마 준비 완료, 기존 스킬에 version '1.0.0' 자동 적용

---

## Phase 2: Foundational (도메인 타입 확장)

**Purpose**: 모든 User Story에서 사용하는 공통 타입 정의

**⚠️ CRITICAL**: User Story 구현 전 반드시 완료

- [x] T009 [P] admin 도메인 타입에 version, tags 필드 추가 — src/admin/domain/types.ts: CreateSkillInput에 version(string), tags(string[]) 추가, UpdateSkillInput에 version(string), tags(string[]) 추가, SkillDetail에 version(string), tags(string[]) 추가, SkillRow에 version(string), tags(string[]) 추가
- [x] T010 [P] dashboard 도메인 타입에 tags, version 필드 추가 — src/dashboard/domain/types.ts: DashboardSkillCard에 version(string), tags(string[]) 추가
- [x] T011 [P] skill-detail 도메인 타입에 version, tags 필드 추가 — src/skill-detail/domain/types.ts: SkillDetailPopup에 version(string), tags(string[]) 추가
- [x] T012 [P] 공유 태그 칩 UI 컴포넌트 생성 — src/shared/ui/tag-chip.tsx: '#태그명' 형태로 표시하는 재사용 가능한 칩 컴포넌트 (클릭 가능 여부를 prop으로 제어)

**Checkpoint**: 공통 타입 및 UI 컴포넌트 준비 완료

---

## Phase 3: User Story 1 - 스킬에 버전 번호 지정 (Priority: P1) 🎯 MVP

**Goal**: 관리자가 스킬 추가/수정 시 버전 번호를 입력하고, 사용자가 상세에서 확인할 수 있다

**Independent Test**: 스킬 추가 폼에서 버전 입력 → 저장 → 상세에서 버전 표시 확인

### Implementation for User Story 1

- [x] T013 [US1] admin repository에 version 처리 추가 — src/admin/infrastructure/supabase-admin-repository.ts: getSkills select에 version 추가 및 매핑, getSkillById select에 version 추가 및 매핑, createSkill insert에 version 포함, updateSkill update에 version 포함
- [x] T014 [US1] admin server actions에 version FormData 파싱 추가 — src/app/admin/skills/actions.ts: createSkill/updateSkill에서 formData.get('version') 파싱, use case execute에 전달
- [x] T015 [US1] SkillAddForm에 버전 입력 필드 추가 — src/features/admin/SkillAddForm.tsx: FormState에 version 필드 추가 (기본값 '1.0.0'), 우측 사이드바에 버전 입력란 추가, buildInput/handleSubmit에 version 포함, isDirtyState 함수에 version 비교 추가
- [x] T016 [US1] DraftSaveDialog에 version FormData 추가 — src/features/admin/DraftSaveDialog.tsx: formData.append('version', pendingInput.version) 추가
- [x] T017 [P] [US1] skill-detail repository에 version 조회 추가 — src/skill-detail/infrastructure/supabase-skill-detail-repository.ts: getSkillDetailPopup select에 version 추가 및 매핑
- [x] T018 [P] [US1] dashboard repository에 version 조회 추가 — src/dashboard/infrastructure/supabase-dashboard-repository.ts: getPublishedSkills select에 version 추가 및 매핑
- [x] T019 [P] [US1] bookmark repository에 version 조회 추가 — src/bookmark/infrastructure/supabase-bookmark-repository.ts: getBookmarkedSkills select에 version 추가, JoinedSkill에 version 필드 추가, 매핑에 version 포함
- [x] T020 [US1] SkillDetailHeader에 버전 표시 추가 — src/features/skill-detail/SkillDetailHeader.tsx: 제목 아래에 버전 번호 표시 (예: "v1.0.0")

**Checkpoint**: 버전 번호 입력/저장/표시 전체 플로우 동작 확인

---

## Phase 4: User Story 2 - 스킬에 태그 추가 및 관리 (Priority: P1)

**Goal**: 관리자가 스킬 추가/수정 시 태그를 입력하고, 카드 및 상세에서 태그가 표시된다

**Independent Test**: 스킬 추가 폼에서 태그 입력 → 저장 → 카드/상세에서 태그 표시 확인

### Implementation for User Story 2

- [x] T021 [US2] TagInput 컴포넌트 생성 — src/features/admin/TagInput.tsx: Enter/쉼표로 태그 추가, 칩 형태 표시, X 버튼 삭제, '#' 자동 제거, 중복 방지(대소문자 무시), 최대 10개 제한, 최대 30자 제한, 빈 문자열 무시
- [x] T022 [US2] admin repository에 태그 CRUD 추가 — src/admin/infrastructure/supabase-admin-repository.ts: createSkill에서 tags 배열 → tags 테이블 UPSERT + skill_tags INSERT, updateSkill에서 기존 skill_tags 삭제 → 새 태그 UPSERT + skill_tags INSERT, getSkills에서 skill_tags(tags(name)) 조인으로 태그 조회, getSkillById에서 태그 조회 추가
- [x] T023 [US2] admin server actions에 tags FormData 파싱 추가 — src/app/admin/skills/actions.ts: createSkill/updateSkill에서 formData.get('tags') JSON 파싱, use case execute에 전달
- [x] T024 [US2] SkillAddForm에 TagInput 통합 — src/features/admin/SkillAddForm.tsx: FormState에 tags(string[]) 추가, 폼 좌측 패널에 TagInput 배치, buildInput/handleSubmit에 tags 포함, isDirtyState에 tags 비교 추가, 수정 모드 시 initialData.tags 로드
- [x] T025 [US2] DraftSaveDialog에 tags FormData 추가 — src/features/admin/DraftSaveDialog.tsx: formData.append('tags', JSON.stringify(pendingInput.tags)) 추가
- [x] T026 [P] [US2] skill-detail repository에 태그 조회 추가 — src/skill-detail/infrastructure/supabase-skill-detail-repository.ts: getSkillDetailPopup에서 skill_tags(tags(name)) 조인, 결과를 string[]로 매핑
- [x] T027 [P] [US2] dashboard repository에 태그 조회 추가 — src/dashboard/infrastructure/supabase-dashboard-repository.ts: getPublishedSkills에서 skill_tags(tags(name)) 조인, 결과를 string[]로 매핑
- [x] T028 [P] [US2] bookmark repository에 태그 조회 추가 — src/bookmark/infrastructure/supabase-bookmark-repository.ts: getBookmarkedSkills에서 skill_tags(tags(name)) 조인, JoinedSkill에 tags 추가
- [x] T029 [US2] 대시보드 스킬 카드에 태그 표시 — src/features/dashboard/DashboardSkillCard.tsx: tag-chip 컴포넌트로 태그 목록 표시 (카드 하단, 카테고리 옆)
- [x] T030 [US2] 스킬 상세 팝업에 태그 표시 — src/features/skill-detail/SkillDetailHeader.tsx: tag-chip 컴포넌트로 태그 목록 표시
- [x] T031 [US2] 관리자 스킬 카드에 태그 표시 — src/features/admin/SkillCard.tsx: tag-chip 컴포넌트로 태그 목록 표시

**Checkpoint**: 태그 입력/저장/표시 전체 플로우 동작 확인

---

## Phase 5: User Story 3 - 버전 변경 이력 조회 (Priority: P2)

**Goal**: 관리자가 스킬 수정 폼에서 이전 버전 이력을 확인할 수 있다

**Independent Test**: 스킬을 여러 번 수정하며 버전 변경 → 수정 폼에서 이전 버전 목록 확인

### Implementation for User Story 3

- [x] T032 [US3] admin repository에 버전 이력 저장/조회 추가 — src/admin/infrastructure/supabase-admin-repository.ts: updateSkill에서 버전 변경 시 이전 버전을 skill_version_history에 INSERT, getSkillById 결과에 versionHistory(VersionHistoryEntry[]) 추가, skill_version_history 테이블에서 해당 스킬의 이력을 changed_at DESC로 조회
- [x] T033 [US3] admin 도메인 타입에 VersionHistoryEntry 인터페이스 추가 — src/admin/domain/types.ts: VersionHistoryEntry { version: string, changedAt: string, note: string | null }, SkillDetail에 versionHistory: VersionHistoryEntry[] 추가
- [x] T034 [US3] VersionHistoryList 컴포넌트 생성 — src/features/admin/VersionHistoryList.tsx: 버전 이력 목록 표시 (버전 번호, 변경 일시), 이력이 없으면 '아직 변경 이력이 없습니다' 표시, 콜랩서블(접기/펼치기) UI
- [x] T035 [US3] SkillAddForm 수정 모드에 VersionHistoryList 통합 — src/features/admin/SkillAddForm.tsx: 수정 모드일 때 우측 사이드바에 VersionHistoryList 표시, initialData.versionHistory 전달

**Checkpoint**: 버전 이력 저장 및 조회 동작 확인

---

## Phase 6: User Story 4 - 태그 기반 스킬 필터링 (Priority: P3)

**Goal**: 대시보드에서 태그 클릭 시 해당 태그를 가진 스킬만 필터링

**Independent Test**: 대시보드에서 태그 클릭 → 동일 태그 스킬만 표시 확인

### Implementation for User Story 4

- [x] T036 [US4] dashboard repository에 태그 필터 파라미터 추가 — src/dashboard/infrastructure/supabase-dashboard-repository.ts: getPublishedSkills에 tag 파라미터 추가, skill_tags 조인으로 해당 태그 가진 스킬만 필터링
- [x] T037 [US4] 대시보드 페이지에 tag 쿼리 파라미터 처리 추가 — src/app/(main)/dashboard/page.tsx (또는 해당 페이지): URL 쿼리 파라미터 ?tag=xxx 파싱, repository에 전달
- [x] T038 [US4] tag-chip 클릭 시 필터 적용 — src/features/dashboard/DashboardSkillCard.tsx: 태그 칩 클릭 시 ?tag=xxx 쿼리 파라미터로 대시보드 이동 (router.push 또는 Link)
- [x] T039 [US4] 대시보드에 현재 태그 필터 표시 및 해제 UI — src/features/dashboard/DashboardSkillList.tsx (또는 해당 컴포넌트): 활성 태그 필터 칩 표시, X 클릭 시 필터 해제

**Checkpoint**: 태그 클릭 → 필터 → 해제 전체 플로우 동작 확인

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 전체 기능 검증 및 정리

- [x] T040 TypeScript 타입 체크 실행 (npx tsc --noEmit) 및 오류 수정
- [x] T041 기존 스킬 데이터 마이그레이션 검증 — 기존 12개 스킬에 version '1.0.0' 정상 적용 확인
- [ ] T042 [P] 관리자 스킬 추가 → 수정 → 삭제 전체 플로우 수동 테스트
- [ ] T043 [P] 스킬 삭제 시 관련 skill_tags, skill_version_history CASCADE 삭제 확인

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — DB 마이그레이션 즉시 시작
- **Foundational (Phase 2)**: Phase 1 완료 후 — 도메인 타입 정의
- **US1 버전 (Phase 3)**: Phase 2 완료 후 시작
- **US2 태그 (Phase 4)**: Phase 2 완료 후 시작 — US1과 병렬 가능
- **US3 이력 (Phase 5)**: Phase 3(US1) 완료 후 — 버전 필드 필요
- **US4 필터 (Phase 6)**: Phase 4(US2) 완료 후 — 태그 데이터 필요
- **Polish (Phase 7)**: 모든 US 완료 후

### User Story Dependencies

- **US1 (버전)**: Foundational 완료 후 독립 시작 가능
- **US2 (태그)**: Foundational 완료 후 독립 시작 가능 — US1과 병렬 가능
- **US3 (이력)**: US1 완료 필요 (버전 필드 존재해야 이력 기록 가능)
- **US4 (필터)**: US2 완료 필요 (태그 데이터 존재해야 필터 가능)

### Parallel Opportunities

- T005, T006, T007, T008 (RLS 및 인덱스) 병렬 실행
- T009, T010, T011, T012 (도메인 타입 및 공유 UI) 병렬 실행
- T017, T018, T019 (읽기 전용 repository) 병렬 실행
- T026, T027, T028 (태그 읽기 전용 repository) 병렬 실행
- US1과 US2는 Foundational 완료 후 병렬 실행 가능

---

## Parallel Example: User Story 1 & 2

```bash
# Phase 2 완료 후 US1과 US2 병렬 시작:

# US1 (버전) 병렬 가능 태스크:
Task: T017 [P] skill-detail repository version 조회
Task: T018 [P] dashboard repository version 조회
Task: T019 [P] bookmark repository version 조회

# US2 (태그) 병렬 가능 태스크:
Task: T026 [P] skill-detail repository 태그 조회
Task: T027 [P] dashboard repository 태그 조회
Task: T028 [P] bookmark repository 태그 조회
```

---

## Implementation Strategy

### MVP First (User Story 1 + 2)

1. Phase 1: DB 마이그레이션 (T001-T008)
2. Phase 2: 도메인 타입 확장 (T009-T012)
3. Phase 3: 버전 번호 입력/저장/표시 (T013-T020)
4. Phase 4: 태그 입력/저장/표시 (T021-T031)
5. **STOP and VALIDATE**: 버전 + 태그 기본 기능 확인
6. Phase 5-6: 이력 조회 + 태그 필터링 추가

### Incremental Delivery

1. Setup + Foundational → DB 및 타입 준비
2. US1 (버전) → 버전 입출력 동작 → 배포 가능
3. US2 (태그) → 태그 입출력 동작 → 배포 가능
4. US3 (이력) → 버전 변경 추적 → 배포 가능
5. US4 (필터) → 태그 기반 탐색 → 배포 가능

---

## Notes

- [P] tasks = 서로 다른 파일, 의존성 없음
- US1(버전)과 US2(태그)는 병렬 구현 가능한 독립 기능
- US3(이력)은 US1, US4(필터)는 US2에 의존
- 태그 UPSERT: 이름 기준으로 기존 태그 재사용, 없으면 새로 생성
- 버전 이력: UPDATE 시에만 이전 버전 기록 (CREATE 시에는 이력 불필요)
