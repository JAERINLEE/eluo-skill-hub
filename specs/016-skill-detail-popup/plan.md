# Implementation Plan: 대시보드 스킬 상세 팝업

**Branch**: `016-skill-detail-popup` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/016-skill-detail-popup/spec.md`

---

## Summary

대시보드 스킬 카드 클릭 시 `skill-detail-modal.html` 디자인 기준의 2단 모달 팝업을 구현한다.
팝업 좌측 패널에는 마크다운 가이드·피드백 섹션(리뷰 + 댓글)을, 우측 사이드바에는 템플릿 다운로드 버튼과 메타 정보를 표시한다.
신규 `skill-detail` bounded context를 clean architecture 3-layer로 구성하고, `feedback_replies` 테이블을 DB에 추가한다.
viewer 역할 사용자는 템플릿 다운로드가 서버 사이드에서 차단된다.

---

## Technical Context

**Language/Version**: TypeScript 5 (strict, `any` PROHIBITED)
**Primary Dependencies**: Next.js 16.1.6 (App Router), React 19.2.3, Tailwind CSS v4, Shadcn UI (Radix UI), `react-markdown` ^10.1.0, `lucide-react` ^0.576.0, `sonner` ^2.0.7
**New Dependencies**: 없음 (기존 설치 패키지로 모두 구현 가능)
**Storage**: Supabase PostgreSQL + Supabase Storage (템플릿 파일 signed URL)
**Testing**: Jest + React Testing Library (unit), Playwright (E2E)
**Target Platform**: Web (Vercel, Next.js SSR/Client)
**Performance Goals**: 모달 오픈 500ms 이내, 피드백 반영 2초 이내
**Constraints**: RLS 필수, `any` 금지, 역할 검증 서버 사이드 강제
**Scale/Scope**: 내부 플랫폼 (~수십 명 동시 사용자)

---

## Constitution Check

*GATE: Phase 0 전 통과 필수. Phase 1 설계 후 재검토.*

| 원칙 | 상태 | 근거 |
|------|------|------|
| **I. Type Safety** (any 금지) | ✅ PASS | 모든 타입 명시 (`any` 없음); 결과 타입은 discriminated union 사용 |
| **II. Clean Architecture** | ✅ PASS | `src/skill-detail/{domain,application,infrastructure}/` 3-layer 분리; admin domain 직접 임포트 없음 |
| **III. Test Coverage** | ✅ PASS | 각 use case 단위 테스트 + 주요 UI 컴포넌트 RTL 테스트 + Playwright E2E 포함 |
| **IV. Feature Module Isolation** | ✅ PASS | `src/skill-detail/` 독립 bounded context; admin infrastructure 임포트 금지 |
| **V. Security-First** | ✅ PASS | Server Action에서 세션+역할 검증; RLS 신규 테이블에 활성화; viewer 다운로드 차단 서버 사이드 강제 |

**Phase 1 재검토**: Constitution Check 모두 PASS — 복잡성 추적 항목 없음

---

## Project Structure

### Documentation (this feature)

```text
specs/016-skill-detail-popup/
├── plan.md              ← 이 파일
├── research.md          ← Phase 0 완료
├── data-model.md        ← Phase 1 완료
├── contracts/
│   └── server-actions.md ← Phase 1 완료
└── tasks.md             ← /speckit.tasks 명령으로 생성
```

### Source Code 변경 범위

```text
# 신규 파일

src/skill-detail/
├── domain/
│   └── types.ts                              # SkillDetailPopup, FeedbackWithReplies, FeedbackReply 등
├── application/
│   ├── ports.ts                              # ISkillDetailRepository 인터페이스
│   ├── get-skill-detail-use-case.ts
│   ├── get-feedbacks-use-case.ts
│   ├── submit-feedback-use-case.ts
│   ├── submit-reply-use-case.ts
│   └── get-template-download-url-use-case.ts
└── infrastructure/
    └── supabase-skill-detail-repository.ts   # Supabase 구현체

src/features/skill-detail/
├── SkillDetailModal.tsx                      # 2단 레이아웃 메인 모달
├── SkillDetailHeader.tsx                     # 이모지·제목·작성자·평점·카테고리
├── SkillDetailGuide.tsx                      # 마크다운 렌더링 섹션
├── FeedbackSection.tsx                       # 피드백 폼 + 리뷰 목록 통합
├── FeedbackForm.tsx                          # StarRating + textarea + 제출 버튼
├── StarRating.tsx                            # Lucide Star 아이콘 인터랙티브 별점
├── FeedbackList.tsx                          # FeedbackItem 목록
├── FeedbackItem.tsx                          # 단일 리뷰 + 댓글 목록 + 댓글 폼
└── TemplateDownloadButton.tsx                # 우측 사이드바 다운로드 버튼

# 기존 파일 수정

src/features/dashboard/
├── DashboardSkillGrid.tsx                    # 'use client' 추가, selectedSkillId state, SkillDetailModal 렌더링
└── DashboardSkillCard.tsx                    # onClick: () => void prop 추가

src/app/(portal)/dashboard/
└── actions.ts                               # 5개 Server Action 추가
                                              # (getSkillDetail, getFeedbacks, submitFeedback,
                                              #  submitReply, getTemplateDownloadUrl)

# DB 마이그레이션
supabase/migrations/
└── [timestamp]_create_feedback_replies.sql
```

**Structure Decision**: Next.js App Router 단일 프로젝트. 신규 `src/skill-detail/` bounded context가 clean architecture 3-layer를 준수하며 추가된다. UI는 `src/features/skill-detail/`에 격리된다.

---

## Implementation Phases

### Phase A: DB 마이그레이션

1. `feedback_replies` 테이블 생성 (Supabase MCP)
2. RLS 정책 적용 (SELECT: authenticated, INSERT: own rows)

### Phase B: skill-detail 도메인 레이어

1. `src/skill-detail/domain/types.ts` — 모든 타입 정의
2. `src/skill-detail/application/ports.ts` — Repository 인터페이스
3. Use cases 5개 구현

### Phase C: Infrastructure 레이어

1. `supabase-skill-detail-repository.ts` 구현
   - `getSkillDetailPopup`: skills + profiles(author) join + skill_templates + AVG(rating) 집계
   - `getFeedbacksWithReplies`: skill_feedback_logs + profiles + feedback_replies + profiles(reply user)
   - `submitFeedback`: INSERT skill_feedback_logs
   - `submitReply`: INSERT feedback_replies
   - `getTemplateSignedUrl`: Supabase Storage signed URL (60s)
   - `getUserRole`: profiles → roles join

### Phase D: Server Actions

`src/app/(portal)/dashboard/actions.ts`에 5개 Server Action 추가 (contracts/server-actions.md 참조)

### Phase E: UI 컴포넌트

구현 순서:
1. `StarRating.tsx` — 인터랙티브 별점 (hover/selected state)
2. `SkillDetailHeader.tsx` — 헤더 섹션
3. `SkillDetailGuide.tsx` — 마크다운 렌더링 (기존 MarkdownPreview 패턴 적용)
4. `FeedbackForm.tsx` — StarRating + textarea + 제출
5. `FeedbackItem.tsx` — 단일 리뷰 + 댓글 폼
6. `FeedbackList.tsx` — 리뷰 목록
7. `FeedbackSection.tsx` — 피드백 전체 섹션 통합
8. `TemplateDownloadButton.tsx` — 역할별 다운로드/차단 처리
9. `SkillDetailModal.tsx` — 2단 레이아웃 조립

### Phase F: 대시보드 카드 연결

1. `DashboardSkillCard.tsx` — `onClick` prop 추가
2. `DashboardSkillGrid.tsx` — `'use client'`, `selectedSkillId` state, `SkillDetailModal` 렌더링

### Phase G: 테스트

**Unit Tests** (Jest + RTL):
- `submit-feedback-use-case.test.ts` — 평점 유효성(1-5) 검증
- `submit-reply-use-case.test.ts` — 빈 내용 검증
- `get-template-download-url-use-case.test.ts` — viewer 차단 로직
- `StarRating.test.tsx` — hover/click/keyboard 상호작용
- `FeedbackForm.test.tsx` — 제출 유효성 검증
- `TemplateDownloadButton.test.tsx` — viewer/non-viewer 렌더링

**E2E Tests** (Playwright `src/__tests__/e2e/`):
- `skill-detail-modal.spec.ts`:
  - 스킬 카드 클릭 → 모달 오픈
  - 마크다운 가이드 렌더링 확인
  - 피드백 제출 흐름
  - 댓글 등록 흐름
  - 템플릿 다운로드 (viewer vs non-viewer)
  - 모달 닫기

---

## Key Design Decisions

| 결정 | 선택 | 근거 |
|------|------|------|
| 모달 상태 위치 | DashboardSkillGrid local state | URL 변경 불필요; 단순 로컬 state로 충분 |
| 스킬 상세 데이터 로딩 | 모달 오픈 시 lazy Server Action | 초기 페이지 로드 성능 보호 |
| 별점 UI | Lucide Star + useState | 새 의존성 불필요; 기존 lucide-react 활용 |
| 마크다운 렌더링 | 기존 MarkdownPreview 패턴 재사용 | 새 의존성 불필요; DRY 원칙 |
| 역할 검증 | 클라이언트 우선 차단 + Server Action 방어 검증 | viewer는 서버 호출 없이 즉시 안내; 조작 대비 서버 재검증 |
| 댓글 테이블 | 별도 feedback_replies 테이블 | 셀프 조인 복잡도 회피 |

---

## Complexity Tracking

> 헌법 위반 없음 — 이 섹션은 비워둠

---

## Risks & Mitigations

| 리스크 | 완화 방안 |
|--------|---------|
| `DashboardSkillGrid` Server→Client 전환 시 초기 렌더링 성능 저하 | `SkillDetailModal`을 동적 import(`next/dynamic`)로 lazy load |
| Supabase Storage 버킷 공개 여부 불명확 | `getTemplateDownloadUrl` use case에서 signed URL 우선 시도; 실패 시 public URL fallback |
| feedback_replies 마이그레이션 후 기존 피드백 조회 쿼리 성능 | skill_feedback_logs(skill_id), feedback_replies(feedback_id)에 인덱스 확인 |
