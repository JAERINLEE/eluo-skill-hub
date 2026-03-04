# Implementation Plan: 어드민 페이지 최적화

**Branch**: `020-admin-page-optimization` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/020-admin-page-optimization/spec.md`

## Summary

어드민 페이지의 스킬 CRUD 서버 액션에서 순차적으로 실행되는 파일 처리(업로드/삭제)를 `Promise.all`로 병렬화하고, 누락된 `revalidatePath` 호출을 추가하여 데이터 정합성을 보장한다. 또한 어드민 마크다운 프리뷰를 대시보드와 동일한 노션 스타일로 통일하고, 수정 팝업의 `verifyAdmin()` 중복 호출을 최적화한다.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode, `any` 금지)
**Primary Dependencies**: Next.js 16.1.6 (App Router), React 19.2.3, @supabase/ssr ^0.8.0, @supabase/supabase-js ^2.98.0, react-markdown ^10.1.0, remark-gfm ^4.0.1, rehype-highlight ^7.0.2, rehype-sanitize ^6.0.0, gray-matter ^4.0.3
**Storage**: Supabase (PostgreSQL) + Supabase Storage (skill-descriptions, skill-templates 버킷)
**Testing**: Jest + React Testing Library (unit), Playwright (E2E)
**Target Platform**: Vercel (web)
**Project Type**: Web application (Next.js App Router)
**Performance Goals**: CRUD 파일 처리 30% 이상 속도 개선
**Constraints**: `any` 타입 금지, Clean Architecture 레이어 경계 유지
**Scale/Scope**: 소규모 관리자 (1-10 admin users)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Type Safety | ✅ PASS | `any` 타입 사용 없음. 기존 코드의 타입 유지 |
| II. Clean Architecture | ✅ PASS | 변경은 infrastructure 레이어(repository)와 서버 액션 내부에 한정. `NotionStyleMarkdown` 컴포넌트를 `src/shared/`로 이동하여 모듈 간 공유 |
| III. Test Coverage | ✅ PASS | 기존 코드 최적화이므로 새 use case/domain rule 추가 없음. 회귀 테스트로 검증 |
| IV. Feature Module Isolation | ✅ PASS | `NotionStyleMarkdown`을 `src/shared/components/`로 이동하여 admin과 skill-detail 모듈이 각각 shared에서 import. 크로스 모듈 직접 import 방지 |
| V. Security-First | ✅ PASS | `verifyAdmin()` 최적화 시에도 서버 액션의 인증 확인은 유지. 수정 팝업 페이지(서버 컴포넌트)에서만 중복 제거, 클라이언트에서 호출 가능한 서버 액션은 독립 인증 유지 |

## Implementation Approach

이 피처는 **기존 파일 수정**이 주이며, `NotionStyleMarkdown` 공유를 위한 파일 이동만 수행한다.

### 변경 대상 파일

**US1 - CRUD 파일 처리 병렬화 + verifyAdmin 최적화**:
1. `src/admin/infrastructure/supabase-admin-repository.ts` — `createSkill()`, `updateSkill()`, `deleteSkill()` 내 파일 처리 병렬화
2. `src/app/admin/skills/actions.ts` — `createSkill`, `updateSkill` 서버 액션에 `revalidatePath` 추가
3. `src/app/admin/skills/@modal/(.)edit/[id]/page.tsx` — 수정 팝업 페이지에서 admin 검증 1회로 통합

**US2 - 데이터 무효화 누락 수정**:
4. `src/app/admin/skills/actions.ts` — `createSkill`, `updateSkill` 서버 액션에 `revalidatePath('/admin/skills')` + `revalidatePath('/admin')` 추가
5. `src/app/admin/members/actions.ts` — `updateMemberRole` 서버 액션에 `revalidatePath('/admin/members')` + `revalidatePath('/admin')` 추가

**US3 - 마크다운 프리뷰 노션 스타일 통일**:
6. `src/features/skill-detail/NotionStyleMarkdown.tsx` → `src/shared/components/NotionStyleMarkdown.tsx`로 이동
7. `src/features/skill-detail/notion-markdown.css` → `src/shared/components/notion-markdown.css`로 이동
8. `src/features/skill-detail/SkillDetailGuide.tsx` — import 경로 변경
9. `src/features/admin/MarkdownPreview.tsx` — `NotionStyleMarkdown` 컴포넌트로 교체

### 새 의존성

없음 — 기존 라이브러리만 사용

### DB 스키마 변경

없음

## Project Structure

### Documentation (this feature)

```text
specs/020-admin-page-optimization/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── spec.md              # Feature specification
├── checklists/
│   └── requirements.md  # Quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (affected files)

```text
src/
├── admin/
│   └── infrastructure/
│       └── supabase-admin-repository.ts  # CRUD 파일 처리 병렬화
├── app/
│   └── admin/
│       ├── skills/
│       │   ├── actions.ts                # revalidatePath 추가 + verifyAdmin 최적화
│       │   └── @modal/(.)edit/[id]/
│       │       └── page.tsx              # 수정 팝업 admin 검증 통합
│       └── members/
│           └── actions.ts                # revalidatePath 추가
├── shared/
│   └── components/
│       ├── NotionStyleMarkdown.tsx        # 공유 마크다운 컴포넌트 (이동)
│       └── notion-markdown.css            # 노션 스타일 CSS (이동)
└── features/
    ├── admin/
    │   └── MarkdownPreview.tsx            # NotionStyleMarkdown으로 교체
    └── skill-detail/
        └── SkillDetailGuide.tsx           # import 경로 변경
```

**Structure Decision**: 기존 Next.js App Router + Clean Architecture 구조 유지. `NotionStyleMarkdown`을 `src/shared/components/`로 이동하여 Feature Module Isolation 원칙(헌법 IV) 준수.

## Complexity Tracking

> 해당 없음 — 헌법 위반 사항 없음
