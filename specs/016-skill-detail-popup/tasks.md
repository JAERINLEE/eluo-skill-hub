# Tasks: 대시보드 스킬 상세 팝업

**Input**: Design documents from `/specs/016-skill-detail-popup/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/server-actions.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup

**Purpose**: DB 마이그레이션 — 모든 스토리의 전제 조건

- [X] T001 Supabase MCP로 `feedback_replies` 테이블 생성 (id uuid PK, feedback_id FK → skill_feedback_logs ON DELETE CASCADE, user_id FK → auth.users ON DELETE CASCADE, content text NOT NULL CHECK(char_length>0), created_at timestamptz DEFAULT now()) + RLS 활성화 + SELECT(authenticated USING true) + INSERT(authenticated WITH CHECK auth.uid()=user_id) 정책 적용

---

## Phase 2: Foundational (Domain + Application + Infrastructure + Server Actions)

**Purpose**: skill-detail bounded context 전체 백엔드 레이어. 모든 User Story UI가 이 레이어에 의존.

**CRITICAL**: 이 Phase 완료 전까지 UI 컴포넌트 작업 불가

- [X] T002 `src/skill-detail/domain/types.ts` 생성 — SkillDetailPopup, SkillTemplateInfo, FeedbackWithReplies, FeedbackReply, SubmitFeedbackInput, SubmitReplyInput, GetSkillDetailResult, GetFeedbacksResult, SubmitFeedbackResult, SubmitReplyResult, GetTemplateDownloadResult 타입 정의 (data-model.md 참조)
- [X] T003 `src/skill-detail/application/ports.ts` 생성 — ISkillDetailRepository 인터페이스 정의 (getSkillDetailPopup, getFeedbacksWithReplies, submitFeedback, submitReply, getTemplateSignedUrl, getUserRole 메서드)
- [X] T004 [P] `src/skill-detail/application/get-skill-detail-use-case.ts` 구현 — skillId로 SkillDetailPopup 조회, null 시 에러 반환
- [X] T005 [P] `src/skill-detail/application/get-feedbacks-use-case.ts` 구현 — skillId로 FeedbackWithReplies[] 조회 (최신순 정렬)
- [X] T006 [P] `src/skill-detail/application/submit-feedback-use-case.ts` 구현 — rating 1-5 범위 유효성 검증 후 저장, 범위 초과 시 에러 반환
- [X] T007 [P] `src/skill-detail/application/submit-reply-use-case.ts` 구현 — content 빈 문자열 검증 후 저장
- [X] T008 [P] `src/skill-detail/application/get-template-download-url-use-case.ts` 구현 — getUserRole로 viewer 확인 → isViewerBlocked 에러 반환 또는 signed URL 생성
- [X] T009 [P] `src/skill-detail/infrastructure/supabase-skill-detail-repository.ts` 구현 — ISkillDetailRepository 전체 구현 (getSkillDetailPopup: skills+profiles(author) join+skill_templates+AVG(rating) 집계, getFeedbacksWithReplies: skill_feedback_logs+profiles+feedback_replies+profiles(reply user) join, submitFeedback: INSERT skill_feedback_logs, submitReply: INSERT feedback_replies, getTemplateSignedUrl: Supabase Storage createSignedUrl(60s), getUserRole: profiles→roles join)
- [X] T010 `src/app/(portal)/dashboard/actions.ts`에 5개 Server Action 추가 — getSkillDetailAction, getSkillFeedbacksAction, submitFeedbackAction, submitFeedbackReplyAction, getTemplateDownloadUrlAction (contracts/server-actions.md 참조, 모두 'use server' + Supabase server client 세션 검증)

**Checkpoint**: 백엔드 레이어 완료 — UI 구현 시작 가능

---

## Phase 3: User Story 1 — 스킬 상세 팝업 열기 (Priority: P1) MVP

**Goal**: 대시보드에서 스킬 카드를 클릭하면 2단 모달 팝업이 열리고, 스킬 헤더(이모지·제목·작성자·평점·카테고리) + 우측 사이드바(메타 정보 카드)가 표시된다.

**Independent Test**: 스킬 카드 클릭 → 모달 오픈 → 헤더에 스킬 정보 표시 → 닫기 버튼/오버레이 클릭으로 닫기

### Implementation

- [X] T011 [P] [US1] `src/features/skill-detail/SkillDetailHeader.tsx` 생성 — 이모지 아이콘(text-8xl), 제목(text-4xl font-bold), 작성자(verified_user 아이콘), 평균 평점(star fill-1 + 리뷰 수), 카테고리 배지(accent-yellow rounded-full) 표시. props: SkillDetailPopup 타입. stitch-html/skill-detail-modal.html 헤더 영역 디자인 참조
- [X] T012 [US1] `src/features/skill-detail/SkillDetailModal.tsx` 생성 — glass-overlay(rgba(0,0,127,0.1) backdrop-blur-12px) + modal-gradient(max-w-6xl max-h-[92vh] rounded-2xl notion-shadow) 2단 레이아웃. 좌측 패널(flex-1 overflow-y-auto scrollbar-hide p-14): SkillDetailHeader + 상세 설명(body-text) + placeholder 섹션들. 우측 사이드바(w-96 bg-neutral-light/50): "스킬 상세 정보" 카드(업데이트일·파일크기·카테고리). 닫기 버튼(absolute top-6 right-6 rounded-full). props: skillId, onClose, isViewer. 오픈 시 getSkillDetailAction + getSkillFeedbacksAction 호출하여 데이터 로드. 로딩 상태 표시
- [X] T013 [US1] `src/features/dashboard/DashboardSkillCard.tsx` 수정 — onClick?: () => void prop 추가, 카드 최외곽 div에 onClick 바인딩 (cursor-pointer는 이미 존재), BookmarkButton 클릭 시 이벤트 전파 중단(e.stopPropagation)
- [X] T014 [US1] `src/features/dashboard/DashboardSkillGrid.tsx` 수정 — 'use client' 지시어 추가, useState<string | null>(null)로 selectedSkillId 관리, DashboardSkillCard에 onClick={() => setSelectedSkillId(skill.id)} 전달, selectedSkillId가 있으면 next/dynamic으로 lazy import한 SkillDetailModal 렌더링(skillId, onClose, isViewer props 전달). isViewer prop을 상위 page.tsx로부터 받아 전달

**Checkpoint**: 스킬 카드 클릭 → 2단 모달 오픈 → 스킬 헤더 + 사이드바 메타 정보 표시 → 닫기 동작 확인

---

## Phase 4: User Story 2 — 마크다운 상세 가이드 조회 (Priority: P2)

**Goal**: 팝업 좌측 패널 "사용 방법" 섹션에 스킬의 마크다운 가이드가 heading, code block, list, table 등 모든 요소가 렌더링되어 표시된다.

**Independent Test**: 마크다운 콘텐츠가 있는 스킬 팝업 오픈 → 가이드 렌더링 확인 / 마크다운 없는 스킬 → "아직 상세 가이드가 등록되지 않았습니다." 안내 표시

### Implementation

- [X] T015 [US2] `src/features/skill-detail/SkillDetailGuide.tsx` 생성 — markdownContent가 있으면 기존 MarkdownPreview 패턴(react-markdown + remark-gfm + rehype-sanitize + rehype-highlight) 적용하여 렌더링. markdownContent가 null/빈 문자열이면 "아직 상세 가이드가 등록되지 않았습니다." 안내 메시지 표시. 섹션 제목: "사용 방법" (lightbulb 아이콘 + text-xl font-bold). stitch-html/skill-detail-modal.html "사용 방법" 섹션 디자인 참조
- [X] T016 [US2] `src/features/skill-detail/SkillDetailModal.tsx` 수정 — 좌측 패널의 상세 설명 아래에 SkillDetailGuide 컴포넌트 배치, markdownContent props 전달

**Checkpoint**: 마크다운 포함 스킬 팝업 → 코드블록·테이블·리스트 모두 렌더링 / 마크다운 없는 스킬 → 빈 상태 안내

---

## Phase 5: User Story 3 — 피드백(평점 + 텍스트) 제출 (Priority: P3)

**Goal**: 팝업 "피드백 및 리뷰" 섹션에서 1-5점 별점 + 텍스트 입력 후 제출하면 DB에 저장되고 리뷰 목록이 즉시 갱신된다.

**Independent Test**: 별점 선택 + 텍스트 입력 → "피드백 제출" 클릭 → DB 저장 확인 + 목록 상단에 새 리뷰 표시 / 별점 미선택 시 검증 메시지

### Implementation

- [X] T017 [P] [US3] `src/features/skill-detail/StarRating.tsx` 생성 — Lucide Star 아이콘 5개, hoveredStar/selectedStar useState 관리. 미선택 시 text-slate-300, 선택 시 text-[#00007F] fill-current. hover 시 hover:scale-125 transition-transform. props: value, onChange, disabled. stitch-html/skill-detail-modal.html 별점 UI 참조
- [X] T018 [US3] `src/features/skill-detail/FeedbackForm.tsx` 생성 — StarRating + textarea(min-h-[120px] rounded-xl focus:ring-4 focus:ring-[#00007F]/5) + "피드백 제출" 버튼(accent-yellow rounded-full + send 아이콘). 별점 미선택 시 제출 차단 + toast 경고 메시지. 제출 시 submitFeedbackAction 호출 + 성공 시 onSubmit 콜백으로 새 피드백 전달 + 폼 초기화. 로딩 중 버튼 비활성화. stitch-html/skill-detail-modal.html 피드백 폼 디자인 참조
- [X] T019 [P] [US3] `src/features/skill-detail/FeedbackItem.tsx` 생성 — 아바타(size-12 rounded-full ring-2 ring-white) + 이름(font-bold) + 시간(text-xs text-slate-400) + 별점(Star fill-1 text-[16px]) + 코멘트(text-base opacity-80). props: FeedbackWithReplies 타입. 댓글 영역은 Phase 6(US4)에서 추가. stitch-html/skill-detail-modal.html 리뷰 아이템 디자인 참조
- [X] T020 [US3] `src/features/skill-detail/FeedbackList.tsx` 생성 — FeedbackItem 배열 렌더링 (space-y-8). 피드백 0건 시 "아직 피드백이 없습니다. 첫 번째 피드백을 남겨보세요." 안내 표시. props: feedbacks: FeedbackWithReplies[]
- [X] T021 [US3] `src/features/skill-detail/FeedbackSection.tsx` 생성 — 섹션 제목 "피드백 및 리뷰"(rate_review 아이콘) + FeedbackForm(bg-white/60 backdrop-blur-sm rounded-2xl p-8) + FeedbackList. 피드백 제출 성공 시 feedbacks 상태 배열 앞에 추가하여 즉시 갱신. stitch-html/skill-detail-modal.html "피드백 및 리뷰" 전체 섹션 디자인 참조
- [X] T022 [US3] `src/features/skill-detail/SkillDetailModal.tsx` 수정 — 좌측 패널 SkillDetailGuide 아래에 FeedbackSection 배치, feedbacks 데이터 + skillId 전달

**Checkpoint**: 별점+텍스트 피드백 제출 → 목록 즉시 갱신 / 별점 미선택 → 경고 / 0건 → 빈 상태 안내

---

## Phase 6: User Story 4 — 리뷰에 댓글 달기 (Priority: P4)

**Goal**: 각 리뷰 항목 아래에 댓글 입력란이 제공되고, 댓글 제출 시 feedback_replies 테이블에 저장되며 즉시 표시된다.

**Independent Test**: 리뷰 아래 댓글 입력 → 등록 → DB 저장 + 리뷰 아래 댓글 즉시 표시 / 빈 댓글 → 검증 메시지

### Implementation

- [X] T023 [US4] `src/features/skill-detail/FeedbackItem.tsx` 수정 — replies 배열 렌더링 (ml-14 space-y-4, 각 댓글: userName + content + createdAt). 댓글 입력 폼 추가 (작은 textarea + "댓글 등록" 버튼). 빈 내용 제출 시 검증 메시지. submitFeedbackReplyAction 호출 → 성공 시 로컬 replies 상태에 추가하여 즉시 표시
- [X] T024 [US4] `src/features/skill-detail/FeedbackSection.tsx` 수정 — 댓글 등록 성공 시 해당 feedback의 replies 배열 업데이트하여 전체 feedbacks 상태 갱신

**Checkpoint**: 댓글 입력 → 즉시 리뷰 아래 표시 / 빈 댓글 → 경고

---

## Phase 7: User Story 5 — 템플릿 다운로드 (Priority: P5)

**Goal**: 우측 사이드바 "템플릿 다운로드" 버튼으로 파일 다운로드. viewer 역할은 클라이언트에서 즉시 차단(서버 호출 없음) + 안내 메시지. 템플릿 없으면 버튼 비활성화.

**Independent Test**: non-viewer 다운로드 클릭 → 파일 다운로드 / viewer 클릭 → 안내 메시지(서버 호출 없음) / 템플릿 없음 → 버튼 비활성화

### Implementation

- [X] T025 [US5] `src/app/(portal)/dashboard/page.tsx` 수정 — Supabase server client로 현재 사용자 profiles→roles 조인하여 isViewer(roles.name==='viewer') 계산, DashboardSkillGrid에 isViewer prop 전달
- [X] T026 [US5] `src/features/skill-detail/TemplateDownloadButton.tsx` 생성 — primary-blue 배경 download 아이콘 버튼. props: templates: SkillTemplateInfo[], isViewer: boolean. 템플릿 없으면 disabled 스타일(opacity-50 cursor-not-allowed). isViewer가 true이면 클릭 시 서버 호출 없이 toast로 "템플릿 다운로드는 뷰어 역할에서 사용할 수 없습니다. 관리자에게 권한 변경을 요청하세요." 안내. non-viewer 클릭 시 getTemplateDownloadUrlAction 호출 → signedUrl로 다운로드 트리거(a 태그 + download 속성). stitch-html/skill-detail-modal.html "실행하기" 섹션 디자인 참조
- [X] T027 [US5] `src/features/skill-detail/SkillDetailModal.tsx` 수정 — 우측 사이드바 "실행하기" 섹션에 TemplateDownloadButton 배치, templates 데이터 + isViewer prop 전달

**Checkpoint**: non-viewer 다운로드 성공 / viewer 즉시 차단(네트워크 호출 없음) / 템플릿 없음 → 비활성화

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: 엣지 케이스 처리 및 전체 UX 개선

- [X] T028 [P] `src/features/skill-detail/SkillDetailModal.tsx` 수정 — 모달 오픈 시 body overflow hidden 설정(배경 스크롤 방지), 닫힐 때 복원. ESC 키 누름 시 모달 닫기 이벤트 처리
- [X] T029 [P] `src/features/skill-detail/SkillDetailModal.tsx` 수정 — 모달 데이터 로딩 중 스켈레톤 UI 또는 스피너 표시. 데이터 로드 실패 시 에러 메시지 + 재시도 버튼
- [X] T030 모바일 반응형 검증 — SkillDetailModal의 md:flex-row가 모바일에서 세로 스택(flex-col)으로 전환되는지 확인, 우측 사이드바가 하단으로 이동하는지 확인, 필요시 패딩/간격 조정

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: 의존성 없음 — 즉시 시작 가능
- **Foundational (Phase 2)**: Phase 1(feedback_replies 테이블) 완료 후 시작
- **User Stories (Phase 3-7)**: Phase 2 완료 후 시작 가능
- **Polish (Phase 8)**: Phase 3-7 완료 후 시작

### User Story Dependencies

- **US1 (P1)**: Phase 2 완료 후 시작 — 다른 스토리에 의존하지 않음
- **US2 (P2)**: US1 완료 필요 (SkillDetailModal 존재해야 가이드 삽입 가능)
- **US3 (P3)**: US1 완료 필요 (SkillDetailModal에 FeedbackSection 삽입)
- **US4 (P4)**: US3 완료 필요 (FeedbackItem이 존재해야 댓글 추가 가능)
- **US5 (P5)**: US1 완료 필요 (SkillDetailModal 사이드바에 버튼 삽입)

### Within Each User Story

- 모델/타입 → 서비스/로직 → UI 컴포넌트 → 통합
- [P] 마크 태스크는 동일 Phase 내 병렬 실행 가능

### Parallel Opportunities

**Phase 2 내부**:
- T002 → T003 순차 (ports가 types를 임포트)
- T004-T009 모두 [P] (T002+T003 완료 후 병렬)
- T010은 T004-T009 완료 후

**Phase 3 이후**:
- US2, US3, US5는 US1 완료 후 동시 시작 가능 (서로 다른 컴포넌트 파일)
- US4는 US3 완료 후에만 가능

---

## Parallel Example: Phase 2 Foundational

```bash
# T002 → T003 순차 실행 후:

# 아래 6개 태스크 병렬 실행:
Task: "T004 [P] get-skill-detail-use-case.ts"
Task: "T005 [P] get-feedbacks-use-case.ts"
Task: "T006 [P] submit-feedback-use-case.ts"
Task: "T007 [P] submit-reply-use-case.ts"
Task: "T008 [P] get-template-download-url-use-case.ts"
Task: "T009 [P] supabase-skill-detail-repository.ts"

# 위 6개 완료 후:
Task: "T010 Server Actions"
```

## Parallel Example: US1 완료 후

```bash
# US1 완료 후 아래 3개 스토리 병렬 시작 가능:
Task: "T015 [US2] SkillDetailGuide.tsx"       # 마크다운 가이드
Task: "T017 [US3] StarRating.tsx"              # 피드백 별점
Task: "T025 [US5] page.tsx isViewer 추가"      # 템플릿 다운로드
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup (DB 마이그레이션)
2. Phase 2: Foundational (백엔드 전체)
3. Phase 3: User Story 1 (모달 오픈 + 헤더 + 사이드바)
4. **STOP and VALIDATE**: 스킬 카드 클릭 → 모달 오픈 → 정보 표시 → 닫기 확인
5. 배포/데모 가능

### Incremental Delivery

1. Setup + Foundational → 백엔드 완료
2. US1 → 모달 기본 동작 확인 → 배포 (MVP)
3. US2 → 마크다운 가이드 추가 → 배포
4. US3 → 피드백 제출 기능 → 배포
5. US4 → 댓글 기능 → 배포
6. US5 → 템플릿 다운로드 + 역할 제한 → 배포
7. Polish → 엣지 케이스 + 반응형 → 최종 배포

---

## Notes

- [P] 태스크 = 서로 다른 파일, 의존성 없음 → 병렬 실행 가능
- [US*] 라벨 = 해당 User Story 추적용
- stitch-html/skill-detail-modal.html 디자인을 기준으로 모든 UI 컴포넌트 구현
- 각 Checkpoint에서 독립 검증 후 다음 스토리 진행
- 커밋: 각 태스크 완료 시 또는 논리적 그룹 단위
