# Tasks: 스킬 추가 팝업 디자인 리뉴얼

**Input**: Design documents from `/specs/012-skill-add-popup-design/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, quickstart.md

**Tests**: Not explicitly requested in feature specification. Tests are not included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 신규 의존성 설치 및 Tailwind Typography 플러그인 설정

- [x] T001 Install react-markdown@10.1.0, remark-gfm@4.0.1, rehype-sanitize@6.0.0, rehype-highlight@7.0.2 via `npm install`
- [x] T002 Install @tailwindcss/typography as devDependency via `npm install -D @tailwindcss/typography`
- [x] T003 Add `@plugin "@tailwindcss/typography"` to `src/app/globals.css`

**Checkpoint**: 의존성 설치 완료, `npm run dev` 정상 빌드 확인

---

## Phase 2: User Story 1 - 마크다운 설명 파일 업로드 및 미리보기 (Priority: P1) 🎯 MVP

**Goal**: 관리자가 .md 파일을 업로드하면 모달 내에서 서식이 적용된 미리보기를 즉시 확인할 수 있다.

**Independent Test**: 기존 모달에서 상세 설명 영역에 .md 파일을 업로드하고, 미리보기가 렌더링되는지 확인

### Implementation for User Story 1

- [x] T004 [P] [US1] Create MarkdownPreview component in `src/features/admin/MarkdownPreview.tsx` — react-markdown + remarkGfm + rehypeSanitize (with hljs-*/language-* class whitelist schema) + rehypeHighlight, wrapped in `<article className="prose max-w-none">`, import `highlight.js/styles/github.css`, accept `content: string` prop, `'use client'` directive
- [x] T005 [P] [US1] Create MarkdownFileUpload component in `src/features/admin/MarkdownFileUpload.tsx` — file input accepting `.md` only, FileReader API to read file as UTF-8 text, validate file type (.md only) and size (max 1MB), handle empty file (0 bytes) with warning message, loading state during file read, file remove/replace functionality, render MarkdownPreview when content is available, show upload prompt when no file selected
- [x] T006 [US1] Integrate MarkdownFileUpload into `src/features/admin/SkillAddForm.tsx` — replace or augment the existing markdown file section in the description area with MarkdownFileUpload, pass `markdownFile` state and `onFileChange` handler, ensure the File object is still passed to `buildInput()` for form submission, update dirty state tracking to account for markdown content changes
- [x] T007 [US1] Handle edge cases in `src/features/admin/MarkdownFileUpload.tsx` — non-.md file rejection with error message (FR-006), 1MB+ file rejection with size limit message (FR-007), empty .md file upload with "빈 파일" warning (FR-011), XSS sanitization verified via rehype-sanitize config (FR-004)

**Checkpoint**: .md 파일 업로드 시 미리보기가 모달 내에 렌더링됨. 파일 교체/제거 동작. 기존 저장/임시저장 흐름 정상 동작.

---

## Phase 3: User Story 2 - 리뉴얼된 2패널 레이아웃 (Priority: P2)

**Goal**: 스킬 추가 모달이 좌측 콘텐츠 + 우측 사이드바의 2패널 레이아웃으로 표시되며, 모바일에서는 단일 컬럼으로 전환된다.

**Independent Test**: 모달을 열어 데스크톱에서 2패널 분할, 모바일 너비에서 단일 컬럼 확인

### Implementation for User Story 2

- [x] T008 [US2] Refactor modal overlay styles in `src/features/admin/SkillAddModal.tsx` — apply glass-overlay backdrop (`bg-[rgba(0,0,127,0.1)] backdrop-blur-[12px]`), modal-gradient container (`bg-gradient-to-br from-white to-[#f9f9f9]`), rounded-3xl with notion-shadow, max-w-5xl max-h-[92vh], close button styled as circular white/hover button per stitch-html reference
- [x] T009 [US2] Refactor `src/features/admin/SkillAddForm.tsx` to 2-panel layout — outer container `flex flex-col md:flex-row`, left panel (`flex-1 overflow-y-auto p-10 md:p-14 scrollbar-hide`) containing icon picker + title input + MarkdownFileUpload (상세 설명), right panel (`w-full md:w-96 bg-[#F0F0F0]/50 border-t md:border-t-0 md:border-l border-slate-200/50 p-10`) containing category select + template file upload + publish toggle + save/cancel buttons + security guide box
- [x] T010 [US2] Update input styling in `src/features/admin/SkillAddForm.tsx` — title input with bottom border style (`text-3xl font-bold border-b-2 border-slate-100 focus:border-[#00007F]`), icon picker as 128px rounded-3xl dashed border area, section labels with uppercase tracking-wider style (`text-[11px] font-extrabold uppercase tracking-[0.2em] text-slate-400`), save button with deep-blue background and shadow per stitch-html reference
- [x] T011 [US2] Ensure responsive behavior — verify `flex-col` default (mobile) stacks panels vertically, `md:flex-row` (desktop 768px+) splits into side-by-side panels, right sidebar border switches from `border-t` to `md:border-l`, scrollbar-hide class on left panel for clean overflow

**Checkpoint**: 2패널 레이아웃이 데스크톱/모바일에서 올바르게 표시됨. 모든 기존 폼 기능(아이콘, 제목, 카테고리, 템플릿, 저장, 임시저장, 닫기 확인) 정상 동작.

---

## Phase 4: User Story 3 - 마크다운 미리보기 다양한 서식 지원 (Priority: P3)

**Goal**: 미리보기에서 제목, 목록, 코드 블록, 테이블, 링크 등 다양한 마크다운 서식이 충실하게 렌더링된다.

**Independent Test**: 다양한 서식이 포함된 .md 파일을 업로드하여 각 요소가 시각적으로 구분되어 표시되는지 확인

### Implementation for User Story 3

- [x] T012 [US3] Add custom react-markdown components map in `src/features/admin/MarkdownPreview.tsx` — typed with `Components` from react-markdown (no `any`), custom `table` wrapper with `overflow-x-auto` and border styling, custom `a` with `target="_blank" rel="noopener noreferrer"`, custom `code` distinguishing inline vs block (check `className` for language- prefix), custom `pre` with rounded background
- [x] T013 [US3] Add scrollable preview container in `src/features/admin/MarkdownFileUpload.tsx` — wrap MarkdownPreview in a scrollable div with `max-h-[400px] overflow-y-auto` (or appropriate height within the modal's left panel), add subtle border and padding to distinguish preview area from upload controls
- [x] T014 [US3] Verify GFM features rendering — ensure remark-gfm enables: tables with proper row/column alignment, strikethrough (`~~text~~`), task lists (checkboxes), footnotes; verify highlight.js theme renders code blocks with syntax coloring for common languages (javascript, typescript, python, bash)

**Checkpoint**: 마크다운 서식 5종 이상(제목, 목록, 코드 블록, 테이블, 링크)이 올바르게 렌더링됨. 긴 콘텐츠에서 스크롤 정상 동작.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: 기존 기능 회귀 검증 및 최종 정리

- [x] T015 Verify all existing features work end-to-end — open modal, select emoji icon, enter title, enter description, select category, upload template files, toggle publish, save skill, draft save, close confirmation with dirty state, ESC key behavior
- [x] T016 Run quickstart.md validation steps — follow `specs/012-skill-add-popup-design/quickstart.md` section 5 to verify all 6 checkpoints pass

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **User Story 1 (Phase 2)**: Depends on Setup (Phase 1) completion
- **User Story 2 (Phase 3)**: Depends on User Story 1 (Phase 2) completion — both modify `SkillAddForm.tsx`
- **User Story 3 (Phase 4)**: Depends on User Story 1 (Phase 2) completion — enhances MarkdownPreview created in US1
- **Polish (Phase 5)**: Depends on all user stories being complete

### Within Each User Story

- T004 and T005 can run in parallel (different files)
- T006 depends on T004, T005 (integrates both components)
- T007 depends on T005 (edge cases in same component)
- T008 and T009 are sequential (modal then form)
- T010, T011 depend on T009 (styling within refactored layout)
- T012, T013 can run in parallel (different files)
- T014 depends on T012 (verification after component enhancement)

### Parallel Opportunities

```bash
# Phase 1: All setup tasks are sequential (npm install order)
T001 → T002 → T003

# Phase 2 (US1): T004 and T005 in parallel, then T006 and T007
Parallel: T004, T005
Sequential: T006 (after T004 + T005)
Sequential: T007 (after T005)

# Phase 3 (US2): Sequential due to same-file modifications
T008 → T009 → T010 → T011

# Phase 4 (US3): T012 and T013 in parallel
Parallel: T012, T013
Sequential: T014 (after T012)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001~T003)
2. Complete Phase 2: User Story 1 — 마크다운 미리보기 (T004~T007)
3. **STOP and VALIDATE**: .md 파일 업로드 → 미리보기 렌더링 확인
4. Deploy/demo if ready — 핵심 신규 기능 완성

### Incremental Delivery

1. Setup → 의존성 준비 완료
2. Add US1 → 마크다운 미리보기 동작 (MVP!)
3. Add US2 → 2패널 레이아웃 리뉴얼 적용
4. Add US3 → 서식 렌더링 완성도 향상
5. Polish → 회귀 검증 및 최종 확인

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- 데이터 모델/서버 액션/유즈케이스 변경 없음 — 모든 작업이 UI 계층(`src/features/admin/`)에서 수행됨
- `stitch-html/admin-add-skill.html` 참조 시 Tailwind 클래스명과 CSS 변수를 프로젝트 디자인 시스템에 맞게 조정
- `any` 타입 사용 금지 — react-markdown `Components` 타입과 `ExtraProps` 활용하여 커스텀 컴포넌트 타이핑
- Commit after each phase or logical group
