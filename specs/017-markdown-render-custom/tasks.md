# Tasks: 상세설명 마크다운 렌더링 커스텀

**Input**: Design documents from `/specs/017-markdown-render-custom/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/component-api.md

**Tests**: parseFrontmatter 유틸리티 단위 테스트 포함 (plan.md에서 명시).

**Organization**: 4개 User Story (US1: 표 P1, US2: 코드블록 P1, US3: 메타데이터 P2, US4: 타이포그래피 P2) 기준으로 구성.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: 의존성 설치 및 기본 파일 구조 생성

- [X] T001 Install gray-matter dependency via `npm install gray-matter`
- [X] T002 [P] Create directory structure: `src/shared/utils/__tests__/` (if not exists)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: 모든 User Story가 의존하는 핵심 컴포넌트 및 유틸리티 생성

**⚠️ CRITICAL**: 모든 User Story 작업은 이 Phase 완료 후 진행 가능

- [X] T003 Create parseFrontmatter utility in `src/shared/utils/parse-frontmatter.ts` — gray-matter 기반 프론트매터 파싱. 반환 타입: `{ metadata: Record<string, unknown> | null; content: string }`. 파싱 실패 시 metadata를 null로, content를 원본 텍스트로 반환 (contracts/component-api.md 참조)
- [X] T004 Create parseFrontmatter unit test in `src/shared/utils/__tests__/parse-frontmatter.test.ts` — 정상 프론트매터, 프론트매터 없음, 잘못된 YAML, 빈 문자열 케이스 테스트
- [X] T005 Create NotionStyleMarkdown base component in `src/features/skill-detail/NotionStyleMarkdown.tsx` — react-markdown + remark-gfm + rehype-highlight + rehype-sanitize 구성. `.notion-markdown` 래퍼 클래스 적용. parseFrontmatter로 콘텐츠 분리. Props: `{ content: string }` (contracts/component-api.md 참조)
- [X] T006 Create notion-markdown.css base file in `src/features/skill-detail/notion-markdown.css` — `.notion-markdown` 스코프 루트 스타일 정의 (prose 기반 베이스라인)
- [X] T007 Integrate NotionStyleMarkdown into SkillDetailGuide in `src/features/skill-detail/SkillDetailGuide.tsx` — 기존 MarkdownPreview import를 NotionStyleMarkdown으로 교체 (contracts/component-api.md "SkillDetailGuide 변경" 참조)

**Checkpoint**: 기본 마크다운 렌더링이 스킬 상세 팝업에서 동작하며, 이후 User Story별 스타일 커스텀 진행 가능

---

## Phase 3: User Story 1 — 표(Table) 노션 스타일 렌더링 (Priority: P1) 🎯 MVP

**Goal**: GFM 표를 border-radius, 헤더 배경색, 셀 경계선이 적용된 노션 스타일로 렌더링

**Independent Test**: 마크다운에 GFM 표를 포함한 스킬을 열어 border-radius, 헤더 색상, 셀 경계선이 모두 적용된 상태로 렌더링되는지 확인

### Implementation for User Story 1

- [X] T008 [US1] Add custom table components (table, thead, th, td wrapper) to NotionStyleMarkdown in `src/features/skill-detail/NotionStyleMarkdown.tsx` — react-markdown `components` prop에 table/thead/th/td 커스텀 렌더러 추가. 래퍼 div에 overflow-hidden + rounded-xl 적용 (research.md R-004 참조)
- [X] T009 [US1] Add table styles to `src/features/skill-detail/notion-markdown.css` — `.notion-markdown table` 스코프: border-collapse: separate, border-spacing: 0, thead th 배경색(bg-slate-100), 모든 셀 border(border-slate-200), px-4 py-3 패딩, 가로 스크롤 지원 (research.md R-004 구현 세부사항 참조)

**Checkpoint**: 표가 포함된 스킬 상세 팝업에서 노션 스타일 표가 정상 렌더링됨

---

## Phase 4: User Story 2 — 코드블록 터미널 CLI 스타일 렌더링 (Priority: P1)

**Goal**: 코드블록을 어두운 배경 + 언어 헤더 바 + 구문 하이라이팅의 터미널 스타일로 렌더링

**Independent Test**: 마크다운에 코드블록(```typescript 등)을 포함한 스킬을 열어 다크 배경 터미널 스타일이 렌더링되는지 확인

### Implementation for User Story 2

- [X] T010 [US2] Add custom pre/code components to NotionStyleMarkdown in `src/features/skill-detail/NotionStyleMarkdown.tsx` — children의 className에서 `language-xxx` 파싱하여 언어명 추출. 코드블록 래퍼 div(rounded-xl overflow-hidden) + 헤더 바(bg-[#2d2d2d] 언어명 표시) + pre(bg-[#1e1e1e] overflow-x-auto) 구조 렌더링. 언어 미지정 시 헤더 바 미표시. 인라인 코드는 별도 스타일 (research.md R-005 참조)
- [X] T011 [US2] Add code block dark theme and inline code styles to `src/features/skill-detail/notion-markdown.css` — `.notion-markdown` 스코프 내 highlight.js github-dark 테마 적용 (admin github.css와 충돌 방지). 인라인 코드(code:not(pre code)) 배경색 + 구분 스타일. 코드블록 가로 스크롤 (research.md R-002 CSS 스코핑 전략 참조)

**Checkpoint**: 코드블록이 터미널 스타일로, 인라인 코드가 별도 스타일로 정상 렌더링됨

---

## Phase 5: User Story 3 — 메타데이터 영역 스타일링 (Priority: P2)

**Goal**: YAML 프론트매터가 존재하면 key-value 정보 카드로 표시, 없으면 미표시

**Independent Test**: YAML 프론트매터 포함/미포함 콘텐츠에서 메타데이터 카드 표시/미표시 확인

### Implementation for User Story 3

- [X] T012 [US3] Create FrontmatterCard component in `src/features/skill-detail/FrontmatterCard.tsx` — Props: `{ metadata: Record<string, unknown> }`. 빈 객체 시 미렌더링. key-value 그리드 레이아웃. 배열 값은 태그/뱃지 형태. 연한 배경 + 테두리 + border-radius. 긴 값은 ellipsis 처리 (contracts/component-api.md FrontmatterCard 참조)
- [X] T013 [US3] Integrate FrontmatterCard into NotionStyleMarkdown in `src/features/skill-detail/NotionStyleMarkdown.tsx` — parseFrontmatter 결과의 metadata가 null이 아니고 빈 객체가 아닐 때 FrontmatterCard 렌더링. 본문 콘텐츠와 시각적으로 구분되는 위치(상단)에 배치

**Checkpoint**: 프론트매터 있는 콘텐츠에서 정보 카드 표시, 없는 콘텐츠에서는 미표시 확인

---

## Phase 6: User Story 4 — 노션 스타일 기본 타이포그래피 (Priority: P2)

**Goal**: 제목, 목록, 인용문, 구분선, 링크 등 기본 마크다운 요소에 노션 스타일 적용

**Independent Test**: 다양한 마크다운 요소(h1-h3, ul/ol, blockquote, hr, 링크)가 노션과 유사한 스타일로 렌더링되는지 확인

### Implementation for User Story 4

- [X] T014 [US4] Add heading styles (h1-h3) to `src/features/skill-detail/notion-markdown.css` — h1: text-3xl font-bold mt-8 mb-4, h2: text-2xl font-bold mt-6 mb-3, h3: text-xl font-semibold mt-5 mb-2 (research.md R-006 타이포그래피 참고값 참조)
- [X] T015 [US4] Add list, blockquote, hr, link styles to `src/features/skill-detail/notion-markdown.css` — blockquote: border-l-3 + bg-slate-50 + 이탤릭 해제, ul/ol: 좌측 패딩 + 명확한 마커, hr: border-slate-200, a: 적절한 링크 스타일 (research.md R-006 참조)

**Checkpoint**: 모든 기본 마크다운 요소가 노션 스타일 타이포그래피로 렌더링됨

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: 엣지 케이스 처리, 기존 admin 영향 없음 확인, 최종 검증

- [X] T016 Handle edge cases in NotionStyleMarkdown in `src/features/skill-detail/NotionStyleMarkdown.tsx` — 빈 content/null 처리, 단일 컬럼 표 border-radius 유지, 언어 미지정 코드블록 기본 표시, 잘못된 프론트매터 시 원본 표시, 중첩 표 스타일 깨짐 방지 (spec.md Edge Cases 참조)
- [X] T017 Verify admin MarkdownPreview is unaffected — `src/features/admin/MarkdownPreview.tsx` 및 스킬 등록/수정 화면에서 기존 마크다운 미리보기 스타일이 변경되지 않았는지 확인 (FR-012)
- [X] T018 Run quickstart.md validation — quickstart.md의 테스트 시나리오 마크다운 샘플로 전체 기능 검증 (표 + 코드블록 + 프론트매터 + 타이포그래피 통합 확인)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **US1 (Phase 3)**: Depends on Foundational (Phase 2) — 독립 실행 가능
- **US2 (Phase 4)**: Depends on Foundational (Phase 2) — 독립 실행 가능, US1과 병렬 가능
- **US3 (Phase 5)**: Depends on Foundational (Phase 2) — 독립 실행 가능
- **US4 (Phase 6)**: Depends on Foundational (Phase 2) — 독립 실행 가능
- **Polish (Phase 7)**: Depends on all user stories completion

### User Story Dependencies

- **US1 (P1, 표)**: Foundational 완료 후 즉시 시작 가능. 다른 Story와 독립적
- **US2 (P1, 코드블록)**: Foundational 완료 후 즉시 시작 가능. US1과 병렬 가능 (NotionStyleMarkdown.tsx 공유하나 다른 components 영역)
- **US3 (P2, 메타데이터)**: Foundational 완료 후 시작 가능. T003의 parseFrontmatter 필요 (이미 Foundational에 포함)
- **US4 (P2, 타이포그래피)**: Foundational 완료 후 즉시 시작 가능. CSS 파일만 수정하므로 다른 Story와 병렬 가능

### Within Each User Story

- 커스텀 컴포넌트(TSX) → CSS 스타일 순서로 진행
- 단, 같은 파일을 수정하는 경우 순차 실행

### Parallel Opportunities

- T001, T002: Setup 내 병렬 가능
- T003, T004: 유틸리티 + 테스트 순차 (테스트는 구현 후)
- T005, T006: 컴포넌트 + CSS 병렬 가능
- US1(T008-T009)과 US2(T010-T011): 다른 컴포넌트 영역이므로 병렬 가능하나 NotionStyleMarkdown.tsx 공유 → 순차 권장
- US3(T012-T013)과 US4(T014-T015): 완전 독립 파일이므로 병렬 가능

---

## Parallel Example: US1 + US4 (동시 진행 가능)

```bash
# Developer A: US1 — 표 스타일
Task T008: Add custom table components to NotionStyleMarkdown.tsx
Task T009: Add table styles to notion-markdown.css

# Developer B: US4 — 타이포그래피 (CSS만 수정)
Task T014: Add heading styles to notion-markdown.css
Task T015: Add list, blockquote, hr, link styles to notion-markdown.css
```

⚠️ 단, notion-markdown.css를 동시 수정하므로 머지 시 충돌 주의

---

## Implementation Strategy

### MVP First (US1 + US2 Only — P1 스토리)

1. Complete Phase 1: Setup (의존성 설치)
2. Complete Phase 2: Foundational (기본 컴포넌트 + 유틸리티 + 통합)
3. Complete Phase 3: US1 표 스타일
4. Complete Phase 4: US2 코드블록 스타일
5. **STOP and VALIDATE**: 표 + 코드블록이 노션 스타일로 정상 렌더링되는지 확인
6. Deploy/demo if ready

### Incremental Delivery

1. Setup + Foundational → 기본 마크다운 렌더링 동작
2. + US1 (표) → 노션 스타일 표 렌더링 ✓
3. + US2 (코드블록) → 터미널 스타일 코드블록 ✓ (MVP 완성!)
4. + US3 (메타데이터) → 프론트매터 정보 카드 ✓
5. + US4 (타이포그래피) → 전체 노션 스타일 완성 ✓
6. Polish → 엣지 케이스 + 검증

---

## Notes

- 이 기능은 순수 프론트엔드 변경이며 DB 스키마 변경 없음
- 기존 admin MarkdownPreview에 절대 영향 없어야 함 (FR-012)
- `.notion-markdown` CSS 스코프로 스타일 격리 보장
- highlight.js github-dark 테마는 `.notion-markdown` 스코프 안에서만 적용
- gray-matter는 프론트매터 파싱 전용 의존성 (번들 크기 최소)
- 라이트 모드만 지원 (다크모드는 범위 밖)
