# Tasks: 어드민 스킬 추가 팝업 (Revised)

**Input**: Design documents from `/specs/011-admin-skill-add-modal/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md
**Revision**: Clarification 반영 — 다이얼로그 2종 분리, 모달 외부 클릭 무시, 임시저장 유효성 검사 건너뜀

**Tests**: Not explicitly requested — test tasks excluded.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Shadcn UI 컴포넌트 추가 및 토스트 프로바이더 설정

- [X] T001 [P] Shadcn CLI로 Switch 컴포넌트 추가 (`npx shadcn@latest add switch` → `src/shared/ui/switch.tsx`)
- [X] T002 [P] Shadcn CLI로 Textarea 컴포넌트 추가 (`npx shadcn@latest add textarea` → `src/shared/ui/textarea.tsx`)
- [X] T003 루트 레이아웃에 sonner Toaster 프로바이더 추가 in `src/app/layout.tsx`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: DB 마이그레이션, Storage 버킷 설정, 도메인 타입 및 공유 인프라 구축

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Supabase 마이그레이션 실행: skills 테이블에 `icon` 컬럼 추가 (TEXT, default '⚡'), status 값 마이그레이션 (active→published, inactive→drafted), status 기본값 'drafted'로 변경 (data-model.md Migration 1 참조)
- [X] T005 Supabase 마이그레이션 실행: `skill_templates` 테이블 생성 + RLS 정책 (admin_full_access, authenticated_read) 적용 (data-model.md Migration 2 참조)
- [X] T006 Supabase Storage 버킷 생성: `skill-descriptions` (1MB, text/markdown) 및 `skill-templates` (100KB, application/zip + text/markdown) (data-model.md Migration 3 참조)
- [X] T007 [P] 도메인 타입 업데이트 in `src/admin/domain/types.ts`
- [X] T008 [P] Supabase Storage 유틸리티 함수 생성 in `src/shared/infrastructure/supabase/storage.ts`
- [X] T009 기존 코드 status 값 업데이트 in `src/features/admin/SkillCard.tsx`
- [X] T010 [P] 기존 코드 status 값 업데이트 in `src/features/admin/SkillStatusFilter.tsx`
- [X] T011 기존 코드 status 값 업데이트 in `src/admin/infrastructure/supabase-admin-repository.ts`
- [X] T012 기존 코드 status 값 업데이트 in `src/admin/application/get-skills-use-case.ts`

**Checkpoint**: Foundation ready

---

## Phase 3: User Story 1 - 스킬 추가 모달 열기 및 기본 정보 입력 (Priority: P1) 🎯 MVP

**Goal**: 관리자가 '새 스킬 추가하기' 버튼을 클릭하면 모달이 열리고, 기본 정보를 입력하여 저장할 수 있다

**Independent Test**: '새 스킬 추가하기' 클릭 → 모달 표시 → 필수 필드 입력 → 저장 → 토스트 + 목록 갱신

### Implementation for User Story 1

- [X] T013 [P] [US1] 스킬 추가 모달 래퍼 컴포넌트 생성 in `src/features/admin/SkillAddModal.tsx`
- [X] T014 [P] [US1] 스킬 생성 유스케이스 생성 in `src/admin/application/create-skill-use-case.ts`
- [X] T015 [P] [US1] `AdminRepository`에 `createSkill` 메서드 구현 in `src/admin/infrastructure/supabase-admin-repository.ts`
- [X] T016 [P] [US1] `AdminRepository`에 `getCategories` 메서드 구현 in `src/admin/infrastructure/supabase-admin-repository.ts`
- [X] T017 [US1] 서버 액션 생성 (createSkill, getCategories) in `src/app/admin/skills/actions.ts`
- [X] T018 [US1] 스킬 추가 폼 컴포넌트 생성 in `src/features/admin/SkillAddForm.tsx`
- [X] T019 [US1] Intercepting Route 레이아웃 생성 in `src/app/admin/skills/layout.tsx`
- [X] T020 [P] [US1] Parallel Route 파일 생성 (@modal/default.tsx, @modal/[...catchAll]/page.tsx) in `src/app/admin/skills/@modal/`
- [X] T021 [US1] 인터셉트 모달 페이지 생성 in `src/app/admin/skills/@modal/(.)new/page.tsx`
- [X] T022 [US1] 스킬 목록 페이지에 '새 스킬 추가하기' Link 추가 in `src/app/admin/skills/page.tsx`

**Checkpoint**: MVP 완료 — 모달을 통한 스킬 기본 정보 입력 및 저장 가능

---

## Phase 4: User Story 2 - 파일 업로드 (Priority: P2)

**Goal**: 설명 마크다운 파일과 다운로드용 템플릿 파일을 업로드할 수 있다

**Independent Test**: .md 설명 파일 + 템플릿 파일 여러 개 첨부 → 저장 → Storage + skill_templates 테이블 확인

### Implementation for User Story 2

- [X] T023 [P] [US2] 템플릿 파일 업로드 컴포넌트 생성 in `src/features/admin/TemplateFileUpload.tsx`
- [X] T024 [US2] SkillAddForm에 파일 업로드 영역 통합 in `src/features/admin/SkillAddForm.tsx`
- [X] T025 [US2] `AdminRepository.createSkill`에 파일 업로드 로직 추가 in `src/admin/infrastructure/supabase-admin-repository.ts`
- [X] T026 [US2] 서버 액션 `createSkill`에 파일 처리 로직 추가 in `src/app/admin/skills/actions.ts`

**Checkpoint**: 파일 업로드 포함 스킬 생성 완료

---

## Phase 5: User Story 3 - 모달 닫기 보호 및 임시저장 (Priority: P2) ⚡ REVISED

**Goal**: (1) 모달 외부 클릭 무시, (2) 임시저장 버튼 → 전용 다이얼로그로 초안 저장, (3) X 버튼 → 전용 다이얼로그로 데이터 손실 경고

**Independent Test**:
- 모달 외부 클릭 → 아무 반응 없음 (모달 유지)
- 임시저장 버튼 클릭 → "입력한 내용을 초안으로 저장합니다" 다이얼로그 → 취소(다이얼로그만 닫힘) / 임시저장(drafted 저장 후 모달 닫힘)
- X 버튼 클릭(입력 있음) → "저장하지 않으면 입력한 내용이 사라집니다" 다이얼로그 → 취소(모달 유지) / 닫기(내용 버리고 닫힘)
- X 버튼 클릭(입력 없음) → 즉시 닫힘

### Implementation for User Story 3

- [X] T027 [US3] DraftSaveDialog 수정: 임시저장 버튼 전용 다이얼로그로 변경 in `src/features/admin/DraftSaveDialog.tsx`
  - 제목을 "임시저장" 으로 변경
  - 설명을 "입력한 내용을 초안으로 저장합니다"로 변경 (이것만 표시)
  - 버튼: '취소' (onClose → 다이얼로그만 닫힘, 모달 유지) / '임시저장' (drafted 저장 → 모달 닫힘)
  - 임시저장 시 필수 필드 유효성 검사 건너뜀 (빈 필드 허용)
  - props 정리: `pendingInput: CreateSkillInput | null`, `onClose: () => void` (다이얼로그만 닫기), `onSaved?: () => void` (저장 성공 후 콜백)

- [X] T028 [P] [US3] CloseConfirmDialog 신규 생성: X 버튼 전용 다이얼로그 in `src/features/admin/CloseConfirmDialog.tsx`
  - AlertDialog 기반 (src/shared/ui/alert-dialog.tsx 사용)
  - 제목: "닫기 확인" 또는 적절한 제목
  - 설명: "저장하지 않으면 입력한 내용이 사라집니다"
  - 버튼: '취소' (onClose → 다이얼로그만 닫힘, 모달 유지) / '닫기' (onDiscard → 내용 버리고 모달 닫힘)
  - props: `open: boolean`, `onClose: () => void`, `onDiscard: () => void`

- [X] T029 [US3] SkillAddModal 외부 클릭 무시 적용 in `src/features/admin/SkillAddModal.tsx`
  - overlay onClick 핸들러 제거 (또는 클릭 이벤트 무시 처리)
  - ESC 키 동작: isDirty 체크 → X 버튼과 동일 동작
  - FR-007: 입력 상태와 무관하게 항상 무시

- [X] T030 [US3] SkillAddModal에 2종 다이얼로그 통합 in `src/features/admin/SkillAddModal.tsx`
  - 상태 추가: `showDraftDialog: boolean`, `showCloseDialog: boolean`, `pendingDraftInput: CreateSkillInput | null`
  - X 버튼/ESC 클릭 흐름:
    - isDirty === false → 즉시 router.back()
    - isDirty === true → setShowCloseDialog(true) → CloseConfirmDialog 표시
    - CloseConfirmDialog '취소' → setShowCloseDialog(false) (모달 유지)
    - CloseConfirmDialog '닫기' → router.back() (내용 버림)
  - 임시저장 버튼 클릭 흐름:
    - SkillAddForm의 onRequestDraftSave 콜백 → setPendingDraftInput(input) + setShowDraftDialog(true)
    - DraftSaveDialog '취소' → setShowDraftDialog(false) + setPendingDraftInput(null) (모달 유지)
    - DraftSaveDialog '임시저장' → drafted 저장 → router.back() + router.refresh()

- [X] T031 [US3] SkillAddForm 임시저장 버튼 동작 확인 in `src/features/admin/SkillAddForm.tsx`
  - '임시저장' 버튼이 onRequestDraftSave 콜백을 호출하는지 확인
  - 콜백 호출 시 현재 FormState + 파일을 CreateSkillInput으로 변환 (유효성 검사 없이)
  - 저장 버튼과 임시저장 버튼의 레이아웃/위치 확인

**Checkpoint**: 모달 닫기 보호 + 임시저장 완전 동작. 외부 클릭 무시, X 버튼 경고, 임시저장 초안 저장 확인.

---

## Phase 6: User Story 4 - URL 직접 접근 시 전체 페이지 표시 (Priority: P3)

**Goal**: `/admin/skills/new` URL 직접 접근 시 전체 페이지로 폼 표시

**Independent Test**: 주소창에 직접 입력 → 전체 페이지 폼 표시, 새로고침 시에도 동일

### Implementation for User Story 4

- [X] T032 [US4] 전체 페이지 스킬 추가 폼 생성 in `src/app/admin/skills/new/page.tsx`

**Checkpoint**: 직접 URL 접근 시 전체 페이지 폼 정상 동작

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 전체 기능 통합 검증 및 마무리

- [X] T033 전체 플로우 통합 검증: 모달 외부 클릭 무시 → X 버튼 닫기 다이얼로그 → 임시저장 다이얼로그 → 저장 → 목록 갱신 확인
- [X] T034 엣지 케이스 검증: 빈 폼 상태에서 X 버튼 즉시 닫힘, 임시저장 시 빈 필드 허용, 네트워크 오류 시 폼 데이터 유지
- [X] T035 [P] TypeScript strict 검사 통과 확인 — `tsc --noEmit` 에러 없음, `any` 타입 미사용

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1-4, 6**: Already completed ✅
- **Phase 5 (US3)**: Depends on Phase 3 (SkillAddModal, SkillAddForm 기존 구현) — **현재 진행 대상**
- **Phase 7 (Polish)**: Depends on Phase 5 completion

### Phase 5 Internal Dependencies

- T027 (DraftSaveDialog 수정) + T028 (CloseConfirmDialog 생성): **병렬 가능** (별도 파일)
- T029 (외부 클릭 무시): T027/T028과 독립적, 병렬 가능
- T030 (2종 다이얼로그 통합): T027 + T028 완료 후 진행
- T031 (임시저장 버튼 확인): T030 완료 후 진행

### Parallel Opportunities

- **T027 + T028**: 별도 파일에서 독립적으로 다이얼로그 구현
- **T029**: SkillAddModal의 overlay 수정만 하므로 T027/T028과 병렬 가능 (다른 함수 영역)
- **T033 + T035**: Phase 7에서 독립 검증

---

## Parallel Example: Phase 5 (User Story 3)

```bash
# 병렬 실행 (별도 파일):
Task T027: "DraftSaveDialog 수정" in src/features/admin/DraftSaveDialog.tsx
Task T028: "CloseConfirmDialog 신규 생성" in src/features/admin/CloseConfirmDialog.tsx

# T027 + T028 완료 후:
Task T029: "SkillAddModal 외부 클릭 무시"
Task T030: "SkillAddModal 2종 다이얼로그 통합"

# T030 완료 후:
Task T031: "임시저장 버튼 동작 확인"
```

---

## Implementation Strategy

### Current Focus: Phase 5 (US3 수정)

1. T027 + T028 병렬: DraftSaveDialog 수정 + CloseConfirmDialog 신규 생성
2. T029: 모달 외부 클릭 무시 적용
3. T030: SkillAddModal에 2종 다이얼로그 통합
4. T031: 임시저장 버튼 연결 확인
5. **VALIDATE**: 3가지 시나리오 동작 검증
6. Phase 7: 통합 검증 + TypeScript 검사

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- 임시저장은 유효성 검사를 건너뜀 (빈 필드 허용, FR-008-2)
- 모달 외부 클릭은 항상 무시 (FR-007)
- DraftSaveDialog: 임시저장 버튼 전용 ("입력한 내용을 초안으로 저장합니다")
- CloseConfirmDialog: X 버튼 전용 ("저장하지 않으면 입력한 내용이 사라집니다")
- X 버튼 다이얼로그는 입력 내용 있을 때만 표시 (FR-009-3)
- 커밋은 각 태스크 또는 논리적 그룹 완료 후 수행
