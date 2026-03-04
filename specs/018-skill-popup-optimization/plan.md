# Implementation Plan: 스킬 팝업 렌더링 최적화

**Branch**: `018-skill-popup-optimization` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/018-skill-popup-optimization/spec.md`

## Summary

스킬 상세 팝업 로딩 시 발생하는 순차적 데이터베이스 쿼리(waterfall pattern)를 병렬화하고, 피드백 조회에 페이지네이션을 적용하며, 마크다운 렌더링 플러그인을 조건부로 적용하여 팝업 표시 시간을 40% 이상 단축한다.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode, `any` 금지)
**Primary Dependencies**: Next.js 16.1.6 (App Router), React 19.2.3, @supabase/ssr ^0.8.0, @supabase/supabase-js ^2.98.0, react-markdown ^10.1.0, remark-gfm ^4.0.1, rehype-highlight ^7.0.2, rehype-sanitize ^6.0.0, gray-matter ^4.0.3
**Storage**: Supabase (PostgreSQL) — skills, categories, profiles, skill_templates, skill_feedback_logs, feedback_replies
**Testing**: Playwright + React Testing Library (Jest)
**Target Platform**: Web (Next.js App Router, Vercel deployment)
**Project Type**: Web application (SPA-like dashboard with server actions)
**Performance Goals**: 팝업 로딩 시간 40% 이상 단축 (현재 ~250-400ms → 목표 ~150-240ms)
**Constraints**: DB 스키마 변경 없음, 새 의존성 추가 없음, 기존 기능 100% 유지
**Scale/Scope**: 영향 범위 7개 파일, 새 타입 1개 추가

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Type Safety | PASS | 모든 변경에서 strict TypeScript 유지. `PaginatedFeedbacks` 타입 신규 추가. `any` 사용 없음. |
| II. Clean Architecture | PASS | domain/application/infrastructure 레이어 경계 유지. 새 타입은 domain, 쿼리 변경은 infrastructure, 인터페이스 변경은 application ports에 배치. |
| III. Test Coverage | PASS | 병렬화된 repository 메서드와 페이지네이션 로직에 대한 단위 테스트 작성 예정. |
| IV. Feature Module Isolation | PASS | `skill-detail` 모듈 내부 변경만 수행. 다른 모듈 참조 변경 없음. |
| V. Security-First | PASS | 기존 RLS 정책 유지. 서버 액션에서 인증 검증 패턴 변경 없음. |
| Tech Stack | PASS | 기존 스택 내에서 최적화. 새 의존성 추가 없음. |

**Post-Phase 1 Re-check**: PASS — 모든 설계 결정이 헌법 원칙 준수.

## Project Structure

### Documentation (this feature)

```text
specs/018-skill-popup-optimization/
├── plan.md              # This file
├── spec.md              # Feature specification
├── research.md          # Phase 0: Research findings
├── data-model.md        # Phase 1: Data model documentation
├── quickstart.md        # Phase 1: Quick reference
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (affected files)

```text
src/
├── skill-detail/
│   ├── domain/
│   │   └── types.ts                              # PaginatedFeedbacks 타입 추가
│   ├── application/
│   │   ├── ports.ts                              # 인터페이스 시그니처 업데이트
│   │   └── get-feedbacks-use-case.ts             # 페이지네이션 파라미터 지원
│   └── infrastructure/
│       └── supabase-skill-detail-repository.ts   # 쿼리 병렬화 + limit 적용
├── features/
│   └── skill-detail/
│       ├── SkillDetailModal.tsx                   # AbortController + 피드백 더보기
│       └── NotionStyleMarkdown.tsx                # rehype-highlight 조건부 적용
└── app/
    └── (portal)/
        └── dashboard/
            └── actions.ts                        # 피드백 페이지네이션 파라미터

tests/
└── (해당 모듈 테스트 파일)
```

**Structure Decision**: 기존 Clean Architecture 구조를 그대로 유지하며, 각 레이어 내에서만 수정을 수행한다. 새 파일 생성 없이 기존 파일의 내부 로직만 최적화한다.

## Implementation Design

### Phase 1: Infrastructure — 쿼리 병렬화 (P1, FR-001)

**파일**: `src/skill-detail/infrastructure/supabase-skill-detail-repository.ts`

**변경 내용 — `getSkillDetailPopup` 메서드**:

현재 (Sequential):
```
await skill query
await author profile query (depends on skill.author_id)
await templates query
await feedback stats query
```

변경 후 (Parallelized):
```
const skill = await skill query (with categories join)
const [authorName, templates, feedbackStats] = await Promise.all([
  authorId ? profile query : null,
  templates query,
  feedback stats query
])
```

**근거**: author profile, templates, feedback stats는 서로 독립적. skill 조회만 선행하면 3개 쿼리를 병렬 실행 가능.

### Phase 2: Infrastructure — 피드백 쿼리 최적화 (P3, FR-002, FR-003)

**파일**: `src/skill-detail/infrastructure/supabase-skill-detail-repository.ts`

**변경 내용 — `getFeedbacksWithReplies` 메서드**:

1. 피드백 조회에 `.limit(limit)` 추가 (기본값 20)
2. 전체 피드백 수를 위한 count 쿼리 추가 (`.select('*', { count: 'exact', head: true })`)
3. feedbacks 조회 후 replies와 feedback-profiles를 `Promise.all`로 병렬화
4. reply user profiles는 별도 추가 병합

현재 (Sequential):
```
await feedbacks query (all)
await replies query
await all profiles query
```

변경 후 (Optimized):
```
const [feedbacks, totalCount] = await Promise.all([
  feedbacks query (.limit(20)),
  count query (head: true)
])
const [replies, feedbackProfiles] = await Promise.all([
  replies query (by feedbackIds),
  profiles query (by feedbackUserIds)
])
// merge reply user profiles into profileMap
```

**근거**: replies는 feedbackIds에 의존하지만, feedback authors의 profiles는 feedbackUserIds로 독립 조회 가능.

### Phase 3: Domain + Application — 페이지네이션 지원 (P3, FR-003)

**파일들**:
- `src/skill-detail/domain/types.ts` — `PaginatedFeedbacks` 타입 추가
- `src/skill-detail/application/ports.ts` — `getFeedbacksWithReplies` 시그니처에 `limit`, `offset` 파라미터 추가
- `src/skill-detail/application/get-feedbacks-use-case.ts` — 파라미터 전달 + `PaginatedFeedbacks` 반환
- `src/app/(portal)/dashboard/actions.ts` — 서버 액션에 offset 파라미터 추가

### Phase 4: Frontend — 마크다운 렌더링 최적화 (P2, FR-004, FR-005)

**파일**: `src/features/skill-detail/NotionStyleMarkdown.tsx`

**변경 내용**:
1. `rehypeHighlight` 플러그인을 조건부로 적용: 마크다운 콘텐츠에 코드 블록(` ``` `)이 포함된 경우에만 `rehypePlugins` 배열에 추가
2. `useMemo`로 rehype plugins 배열을 메모이제이션

```typescript
const hasCodeBlock = useMemo(
  () => /```[\s\S]*?```/.test(markdownBody),
  [markdownBody]
);

const rehypePlugins = useMemo(
  () => hasCodeBlock
    ? [[rehypeSanitize, customSchema], rehypeHighlight]
    : [[rehypeSanitize, customSchema]],
  [hasCodeBlock]
);
```

### Phase 5: Frontend — 팝업 요청 관리 + 피드백 더보기 (P1+P3, FR-006)

**파일**: `src/features/skill-detail/SkillDetailModal.tsx`

**변경 내용**:
1. **AbortController**: useEffect cleanup에서 진행 중인 데이터 로딩을 취소하여 race condition 방지
2. **피드백 "더 보기"**: `hasMoreFeedbacks` 상태 추가, 버튼 클릭 시 offset 증가하여 추가 피드백 로딩
3. **상태 관리**: `feedbackOffset` 상태 추가, 추가 로딩 시 기존 feedbacks에 append

### Phase 6: 회귀 테스트 (FR-007)

기존 스킬 팝업의 모든 기능이 정상 동작하는지 확인:
- 스킬 정보 표시 (제목, 설명, 카테고리, 작성자, 평점)
- 마크다운 렌더링 (frontmatter, 코드 블록, GFM 테이블)
- 피드백 표시 및 작성
- 템플릿 다운로드
- 빠른 열기/닫기 시 오류 없음

## Complexity Tracking

> 헌법 위반 사항 없음. 모든 변경이 기존 아키텍처와 기술 스택 내에서 수행됨.

| Aspect | Complexity | Justification |
|--------|-----------|---------------|
| 새 타입 추가 (`PaginatedFeedbacks`) | Low | 기존 패턴과 동일한 readonly 인터페이스 |
| 인터페이스 시그니처 변경 | Low | 선택적 파라미터 추가로 하위 호환성 유지 |
| 쿼리 병렬화 | Medium | `Promise.all` 적용, 에러 핸들링 주의 필요 |
| 마크다운 조건부 플러그인 | Low | `useMemo`로 정규식 검사 + 플러그인 배열 메모이제이션 |
