# Implementation Plan: 어드민 피드백 관리 페이지

**Branch**: `028-admin-feedback-management` | **Date**: 2026-03-10 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/028-admin-feedback-management/spec.md`

## Summary

기존 `/admin/feedbacks` 페이지를 확장하여 피드백 목록 테이블에 비밀글 여부·댓글 수 컬럼 추가, 아코디언 기반 댓글 조회/작성 기능, 비밀글 연동 처리를 구현한다. 기존 Clean Architecture 패턴(admin 도메인)을 따르며, `skill_feedback_logs`와 `feedback_replies` 테이블을 활용한다.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode, `any` 금지)
**Primary Dependencies**: Next.js 16.1.6 (App Router), React 19.2.3, Shadcn UI, Radix UI, Tailwind CSS v4, lucide-react, sonner
**Storage**: Supabase (PostgreSQL) — `skill_feedback_logs`, `feedback_replies`, `skills`, `profiles` 테이블
**Testing**: Jest + React Testing Library (단위), Playwright (E2E)
**Target Platform**: Web (Vercel 배포)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: 피드백 목록 3초 이내 로딩
**Constraints**: RLS 활성화 필수, `any` 타입 금지
**Scale/Scope**: 기존 어드민 도메인 확장 (신규 모듈 불필요)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Type Safety | PASS | 모든 타입 명시, `any` 금지 준수 |
| II. Clean Architecture | PASS | 기존 admin 도메인의 domain/application/infrastructure 레이어 활용 |
| III. Test Coverage | PASS | E2E 테스트 + 단위 테스트 계획 포함 |
| IV. Feature Module Isolation | PASS | admin 모듈 내 확장, 크로스 도메인 임포트 없음 |
| V. Security-First | PASS | RLS 활성화, 서버 사이드 세션 검증, 관리자 권한 확인 |

## Project Structure

### Documentation (this feature)

```text
specs/028-admin-feedback-management/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
src/
├── admin/
│   ├── domain/
│   │   └── types.ts                        # FeedbackRow 확장, FeedbackReplyRow 추가
│   ├── application/
│   │   ├── get-feedbacks-use-case.ts        # 확장: 댓글 수, 비밀글 여부 포함
│   │   ├── get-feedback-replies-use-case.ts # 신규: 특정 피드백의 댓글 조회
│   │   └── create-feedback-reply-use-case.ts # 신규: 관리자 댓글 작성
│   └── infrastructure/
│       └── supabase-admin-repository.ts     # 확장: 댓글 관련 메서드 추가
├── features/admin/
│   ├── FeedbacksTable.tsx                   # 확장: 아코디언, 비밀글 뱃지, 댓글 수
│   ├── FeedbackReplies.tsx                  # 신규: 아코디언 내 댓글 목록
│   └── FeedbackReplyForm.tsx                # 신규: 댓글 작성 폼
├── app/admin/feedbacks/
│   ├── page.tsx                             # 확장: 댓글 수/비밀글 데이터 전달
│   └── actions.ts                           # 신규: 댓글 작성 Server Action
└── __tests__/
    └── e2e/
        └── admin-feedback.spec.ts           # 신규: E2E 테스트
```

**Structure Decision**: 기존 admin 모듈 내에서 확장. 신규 bounded context 불필요 — 피드백 관리는 admin 도메인의 일부.

## Complexity Tracking

> 위반 사항 없음. 모든 Constitution 원칙 준수.
