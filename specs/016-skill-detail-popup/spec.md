# Feature Specification: 대시보드 스킬 상세 팝업

**Feature Branch**: `016-skill-detail-popup`
**Created**: 2026-03-04
**Status**: Draft
**Input**: 대시보드 스킬 팝업 구현 — 스킬 선택 시 상세 정보(마크다운 가이드, 피드백, 리뷰 댓글, 템플릿 다운로드) 팝업 표시

---

## UI 레이아웃 참조

디자인 기준: `stitch-html/skill-detail-modal.html`

### 모달 전체 구조

- **오버레이**: `glass-overlay` — primary-blue(#00007F) 10% opacity + blur(12px) 배경
- **모달 컨테이너**: `modal-gradient` — 흰색 그라디언트, `notion-shadow`, `rounded-2xl`, `max-w-6xl`, `max-h-[92vh]`
- **2단 레이아웃** (데스크톱 기준):
  - 좌측 패널 (`flex-1`, 스크롤 가능): 스킬 상세 정보 섹션들
  - 우측 사이드바 (`w-96`, 반투명): 템플릿 다운로드 버튼 + 스킬 메타 정보

### 좌측 패널 섹션 구성

1. **헤더**: 이모지 아이콘(text-8xl), 제목(text-4xl font-bold), 작성자 · 평균평점 · 카테고리 배지(accent-yellow)
2. **상세 설명**: 스킬 간략 설명 텍스트
3. **사용 방법**: 마크다운 가이드 렌더링 영역 (numbered list, code block, table 등 포함)
4. **피드백 및 리뷰**:
   - 입력 폼: 별점 선택 버튼(1~5) + textarea + "피드백 제출" 버튼(accent-yellow)
   - 리뷰 목록: 아바타 + 이름 + 별점 + 텍스트 + 시간 + 댓글 영역

### 우측 사이드바 구성

- **"실행하기" 섹션**: "템플릿 다운로드" 버튼 (primary-blue 배경, 흰색 텍스트, `download` 아이콘)
- **"스킬 상세 정보" 카드**: 최근 업데이트일, 파일 크기, 카테고리

### 컬러 시스템

| 토큰 | 값 | 용도 |
|------|-----|------|
| `--deep-blue` / `primary` | `#00007F` | 제목, 아이콘, 강조 버튼 |
| `--yellow` / `accent` | `#FEFE01` | CTA 버튼(피드백 제출), 배지 |
| `--light-gray` | `#F0F0F0` | 사이드바 배경, 아이콘 배경 |

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - 스킬 상세 팝업 열기 (Priority: P1)

대시보드에서 스킬 카드를 클릭하면 `skill-detail-modal.html` 디자인 기준의 2단 모달 팝업이 열린다.
좌측에는 스킬 상세 정보, 우측 사이드바에는 템플릿 다운로드 버튼과 메타 정보가 표시된다.

**Why this priority**: 팝업 자체가 이 기능의 핵심 진입점이다. 나머지 모든 기능은 팝업이 열려야 접근 가능하다.

**Independent Test**: 스킬 카드 클릭 시 모달이 열리고 이모지 아이콘·제목·작성자·평점 메타 정보가 헤더에 표시되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 사용자가 대시보드에 있을 때, **When** 스킬 카드를 클릭하면, **Then** glass-overlay 위에 2단 구조 모달이 열린다.
2. **Given** 팝업이 열려 있을 때, **When** 오버레이 클릭 또는 우측 상단 닫기(×) 버튼을 클릭하면, **Then** 팝업이 닫히고 대시보드로 돌아간다.
3. **Given** 팝업이 열릴 때, **When** 헤더가 렌더링되면, **Then** 스킬 이모지(text-8xl), 제목(text-4xl), 작성자·평균평점·카테고리 배지가 표시된다.

---

### User Story 2 - 마크다운 상세 가이드 조회 (Priority: P2)

팝업 좌측 패널 "사용 방법" 섹션에 해당 스킬의 마크다운 가이드가 렌더링된다.
heading, code block, list, table 등 표준 마크다운 요소가 모두 지원된다.

**Why this priority**: 스킬 사용 가이드는 핵심 콘텐츠이며 팝업 오픈 직후 바로 보여야 한다.

**Independent Test**: 팝업 내 "사용 방법" 섹션에서 마크다운 콘텐츠가 포맷팅된 HTML로 표시되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 팝업이 열릴 때, **When** "사용 방법" 섹션이 로드되면, **Then** 스킬에 저장된 마크다운 가이드가 형식에 맞게 렌더링된다.
2. **Given** 스킬에 마크다운 가이드가 없을 때, **When** 팝업을 열면, **Then** "아직 상세 가이드가 등록되지 않았습니다." 안내 문구가 표시된다.

---

### User Story 3 - 피드백(평점 + 텍스트) 제출 (Priority: P3)

팝업 좌측 "피드백 및 리뷰" 섹션의 입력 폼에서 1~5점 별점과 텍스트를 입력하고 accent-yellow 버튼으로 제출하면 DB에 저장된다.

**Why this priority**: 스킬에 대한 사용자 의견 수집 핵심 인터랙션이다.

**Independent Test**: 별점 선택 + 텍스트 입력 후 "피드백 제출" 클릭 시 `skill_feedback_logs` 테이블에 레코드가 생성되고 목록이 갱신되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 로그인 사용자가 피드백 폼에서 별점 선택 + 텍스트 입력 후, **When** "피드백 제출" 버튼을 누르면, **Then** `skill_feedback_logs` 테이블에 저장되고 리뷰 목록에 즉시 반영된다.
2. **Given** 별점 미선택 상태에서, **When** "피드백 제출" 버튼을 클릭하면, **Then** 별점 선택을 요구하는 검증 메시지가 표시되고 제출이 차단된다.
3. **Given** 피드백 제출 성공 후, **When** 목록이 갱신되면, **Then** 새 리뷰가 리뷰 목록 상단에 아바타·이름·별점·텍스트·시간 형식으로 표시된다.

---

### User Story 4 - 리뷰에 댓글 달기 (Priority: P4)

피드백 및 리뷰 섹션의 각 리뷰 항목 아래에 댓글 입력란이 제공된다.
댓글 제출 시 신규 `feedback_replies` 테이블에 저장되고 해당 리뷰 아래 표시된다.

**Why this priority**: 피드백이 먼저 존재해야 댓글을 달 수 있으므로 P4로 설정한다.

**Independent Test**: 리뷰 항목 아래 댓글 입력 후 제출 시 `feedback_replies` 테이블에 저장되고 화면에 표시되는지 확인한다.

**Acceptance Scenarios**:

1. **Given** 리뷰 목록에 리뷰가 있을 때, **When** 댓글 입력란에 내용을 입력하고 등록하면, **Then** 해당 리뷰 아래에 댓글이 표시되고 `feedback_replies` 테이블에 저장된다.
2. **Given** 빈 댓글을 제출할 때, **When** 등록 버튼을 클릭하면, **Then** 내용 입력 요구 메시지가 표시된다.

---

### User Story 5 - 템플릿 다운로드 (Priority: P5)

우측 사이드바의 primary-blue 배경 "템플릿 다운로드" 버튼으로 스킬 템플릿 파일을 다운로드한다.
`viewer` 역할 사용자가 해당 버튼을 클릭하면 다운로드 대신 권한 안내 메시지가 표시된다.

**Why this priority**: 보조 기능이며 역할 기반 접근 제어가 필요하다.

**Acceptance Scenarios**:

1. **Given** viewer가 아닌 사용자가 팝업을 열었을 때, **When** "템플릿 다운로드" 버튼을 클릭하면, **Then** 해당 스킬의 템플릿 파일이 즉시 다운로드된다.
2. **Given** `viewer` 역할 사용자가 팝업을 열었을 때, **When** "템플릿 다운로드" 버튼을 클릭하면, **Then** "템플릿 다운로드는 뷰어 역할에서 사용할 수 없습니다. 관리자에게 권한 변경을 요청하세요." 안내 메시지가 표시된다.
3. **Given** 스킬에 등록된 템플릿 파일이 없을 때, **When** 팝업을 열면, **Then** 우측 사이드바의 다운로드 버튼이 비활성화 상태로 표시된다.

---

### Edge Cases

- 마크다운 콘텐츠가 매우 긴 경우 좌측 패널 내 스크롤(`scrollbar-hide`)로 처리한다.
- 피드백 0건인 스킬은 "아직 피드백이 없습니다. 첫 번째 피드백을 남겨보세요." 안내를 표시한다.
- 모바일 화면에서는 2단 레이아웃이 단일 컬럼으로 전환되고 우측 사이드바가 하단으로 이동한다(`md:flex-row` → 세로 스택).
- `viewer` 역할 사용자도 피드백 제출 및 댓글 기능은 가능하며, 템플릿 다운로드만 제한된다.
- 팝업 내 스크롤 시 오버레이 뒤 배경 스크롤이 방지된다.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: 대시보드에서 스킬 카드를 클릭하면 `skill-detail-modal.html` 기준의 2단 모달이 열려야 한다.
- **FR-002**: 모달 헤더에 스킬 이모지(아이콘), 제목, 작성자, 평균 평점, 카테고리 배지가 표시되어야 한다.
- **FR-003**: 좌측 패널 "사용 방법" 섹션에 스킬의 마크다운 가이드가 렌더링되어야 한다.
- **FR-004**: 마크다운 가이드가 없는 스킬에는 "아직 상세 가이드가 등록되지 않았습니다." 안내 문구가 표시되어야 한다.
- **FR-005**: 피드백 폼에서 1~5점 별점(인터랙티브 star 버튼)과 텍스트를 입력하고 제출할 수 있어야 한다.
- **FR-006**: 피드백 제출 시 `skill_feedback_logs`(user_id, skill_id, rating, comment)에 저장되어야 한다.
- **FR-007**: 피드백 제출 후 리뷰 목록이 즉시 갱신되어 새 리뷰(아바타·이름·별점·텍스트·시간)가 표시되어야 한다.
- **FR-008**: 별점 미선택 상태에서 제출 시 검증 오류 메시지가 표시되어야 한다.
- **FR-009**: 각 리뷰 항목 아래에 댓글 입력란이 제공되어야 한다.
- **FR-010**: 댓글 제출 시 `feedback_replies`(id, feedback_id, user_id, content, created_at)에 저장되어야 한다.
- **FR-011**: 제출된 댓글은 해당 리뷰 아래에 즉시 표시되어야 한다.
- **FR-012**: 우측 사이드바의 "템플릿 다운로드" 버튼은 viewer가 아닌 역할 사용자에게 파일 다운로드를 실행해야 한다.
- **FR-013**: `viewer` 역할 사용자가 "템플릿 다운로드" 버튼을 클릭하면 권한 안내 메시지가 표시되어야 한다.
- **FR-014**: 스킬에 템플릿이 없는 경우 다운로드 버튼이 비활성화 상태로 표시되어야 한다.
- **FR-015**: 우측 사이드바 "스킬 상세 정보" 카드에 최근 업데이트일, 파일 크기, 카테고리가 표시되어야 한다.
- **FR-016**: 모달 외부 클릭 또는 우측 상단 닫기(×) 버튼으로 팝업을 닫을 수 있어야 한다.

### Key Entities

- **SkillFeedbackLog**: 스킬 피드백 (skill_id, user_id, rating 1–5, comment, created_at). 테이블: `skill_feedback_logs` (기존).
- **FeedbackReply**: 피드백 댓글 (feedback_id FK → skill_feedback_logs, user_id, content, created_at). 테이블: `feedback_replies` (신규 생성 필요).
- **SkillTemplate**: 다운로드 파일 (skill_id, file_name, file_path, file_size, file_type). 테이블: `skill_templates` (기존).
- **Profile/Role**: 사용자 역할. `viewer` 역할은 템플릿 다운로드 불가. 테이블: `profiles`, `roles` (기존).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 스킬 카드 클릭 후 모달이 500ms 이내에 표시된다.
- **SC-002**: 피드백 제출 후 2초 이내에 리뷰 목록에 새 리뷰가 반영된다.
- **SC-003**: `viewer` 역할 사용자의 템플릿 다운로드 시도 100%가 차단되고 안내 메시지가 표시된다.
- **SC-004**: 마크다운 가이드의 heading, code block, list, table 요소가 모두 올바르게 렌더링된다.
- **SC-005**: 댓글 제출 후 새로고침 없이 즉시 해당 리뷰 아래에 댓글이 표시된다.

---

## Assumptions

- `skill_feedback_logs` 테이블은 이미 존재하며, 사용자는 동일 스킬에 복수 피드백 제출이 가능하다(중복 제한 없음).
- 댓글 기능을 위해 `feedback_replies` 테이블이 신규 생성된다 (id, feedback_id FK, user_id, content, created_at).
- 피드백 텍스트(comment)는 선택 입력이며, 평점(rating)만 필수다.
- 마크다운 콘텐츠는 `skills.markdown_content` 컬럼에서 직접 로드한다.
- 템플릿 파일은 `skill_templates.file_path`에서 다운로드 URL을 생성한다.
- viewer 역할 사용자도 피드백(리뷰) 제출 및 댓글 기능은 사용 가능하며, 템플릿 다운로드만 제한된다.
- 사용자 언급의 `db_feedback_logs`는 실제 테이블명 `skill_feedback_logs`를 의미한다.
