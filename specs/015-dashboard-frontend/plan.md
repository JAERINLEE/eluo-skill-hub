# Implementation Plan: 대시보드 프론트엔드 — 북마크 & 내 에이전트

**Branch**: `015-dashboard-frontend` | **Date**: 2026-03-04 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/015-dashboard-frontend/spec.md`

**Note**: US1~US5 (대시보드 레이아웃, 검색, 페이지네이션, 프로필, 사이드바)는 이미 구현 완료. 이 계획은 **US6 (북마크 + 내 에이전트)** 구현에 집중한다.

## Summary

스킬 카드에 북마크 토글 버튼을 추가하고, `/myagent` 별도 페이지에서 북마크된 스킬을 그리드로 표시한다. `bookmarks` 테이블(user_id + skill_id, RLS 적용)을 생성하고, `bookmark` 바운디드 컨텍스트를 신규 추가한다. `/dashboard`와 `/myagent`는 Next.js Route Group `(portal)`을 사용하여 동일한 사이드바·헤더 레이아웃을 공유한다.

## Technical Context

**Language/Version**: TypeScript 5 (strict mode, `any` 금지)
**Primary Dependencies**: Next.js 16.1.6 (App Router), React 19, @supabase/ssr ^0.8.0, @supabase/supabase-js ^2.98.0, Shadcn UI, Tailwind CSS v4, lucide-react
**Storage**: Supabase (PostgreSQL) — `bookmarks` 테이블 신규 생성, RLS 필수
**Testing**: 명시적 요청 없으므로 생략
**Target Platform**: Web (Vercel 배포)
**Project Type**: Web application (Next.js App Router)
**Constraints**: Constitution 준수 (any 금지, Clean Architecture, Feature Module Isolation, Security-First)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Type Safety | ✅ PASS | 모든 타입 명시, `any` 미사용 |
| II. Clean Architecture | ✅ PASS | `src/bookmark/` 별도 바운디드 컨텍스트 (domain/application/infrastructure) |
| III. Test Coverage | ⚠️ WAIVED | 테스트 태스크는 명시적 요청이 없으므로 생략 |
| IV. Feature Module Isolation | ✅ PASS | `bookmark` 모듈 독립, `dashboard` 모듈과 분리. Constitution에 `bookmark`이 명시적으로 언급됨 |
| V. Security-First | ✅ PASS | bookmarks 테이블 RLS, Server Action에서 인증 검증, 서버사이드 데이터 페칭 |

## Project Structure

### Documentation (this feature)

```text
specs/015-dashboard-frontend/
├── plan.md              # This file
├── research.md          # Phase 0 output (updated for bookmark)
├── data-model.md        # Phase 1 output (updated for bookmark)
├── contracts/           # Phase 1 output
│   └── dashboard-api.md # Updated with bookmark API
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
# Route Group for shared layout
src/app/(portal)/
├── layout.tsx              # 공유 레이아웃 (auth guard + sidebar + header) ← dashboard/layout.tsx에서 이동
├── dashboard/
│   ├── page.tsx            # 기존 대시보드 페이지 (이동)
│   ├── actions.ts          # signOut + toggleBookmark 서버 액션
│   ├── error.tsx           # 에러 바운더리 (이동)
│   └── loading.tsx         # 로딩 스켈레톤 (이동)
└── myagent/
    ├── page.tsx            # 북마크된 스킬 그리드 (신규)
    ├── error.tsx           # 에러 바운더리 (신규)
    └── loading.tsx         # 로딩 스켈레톤 (신규)

# Bookmark 바운디드 컨텍스트 (신규)
src/bookmark/
├── domain/
│   └── types.ts            # BookmarkRepository 인터페이스
├── application/
│   ├── toggle-bookmark-use-case.ts
│   └── get-user-bookmarks-use-case.ts
└── infrastructure/
    └── supabase-bookmark-repository.ts

# Bookmark UI 컴포넌트 (신규)
src/features/bookmark/
└── BookmarkButton.tsx      # 북마크 토글 버튼 (client component)

# 기존 Dashboard UI 컴포넌트 (수정)
src/features/dashboard/
├── DashboardSkillCard.tsx  # 북마크 버튼 추가
├── DashboardSidebar.tsx    # "내 에이전트" 클릭 시 /myagent로 router.push
├── DashboardLayoutClient.tsx # ComingSoonContent 제거, pathname 기반 activeTab
└── ...                     # 기타 기존 컴포넌트 (변경 없음)
```

**Structure Decision**: Route Group `(portal)`을 사용하여 `/dashboard`와 `/myagent`가 동일한 레이아웃을 공유한다. URL은 변경되지 않는다.

## Key Architecture Decisions

### 1. Route Group `(portal)` 도입

`/dashboard`와 `/myagent`가 동일한 사이드바·헤더 레이아웃을 공유해야 하므로, Next.js Route Group을 사용한다.

- `src/app/(portal)/layout.tsx` — 공유 레이아웃 (auth guard + DashboardLayoutClient)
- URL은 `(portal)`에 영향받지 않음: `/dashboard`, `/myagent` 그대로 유지
- 기존 `src/app/dashboard/layout.tsx` → `src/app/(portal)/layout.tsx`로 이동

### 2. `bookmark` 바운디드 컨텍스트 분리

Constitution Principle IV에 따라 `bookmark`은 독립 모듈로 생성한다.

- `src/bookmark/domain/types.ts` — `BookmarkRepository` 인터페이스
- `src/bookmark/application/` — 유스케이스 (toggle, get)
- `src/bookmark/infrastructure/` — Supabase 구현
- `src/features/bookmark/` — UI 컴포넌트 (BookmarkButton)

### 3. 북마크 토글 — Server Action + Optimistic UI

- `toggleBookmark` Server Action: 인증 확인 → bookmarks 존재 여부 확인 → INSERT 또는 DELETE → `revalidatePath`
- `BookmarkButton` (client component): `useOptimistic`으로 즉각 UI 반영, 서버 응답 후 확정
- 대시보드 카드와 `/myagent` 페이지 모두 동일한 `BookmarkButton` 사용

### 4. 북마크 상태 전달 — 서버사이드 프리페치

- `page.tsx` (서버 컴포넌트)에서 현재 사용자의 북마크 ID 목록을 조회
- `bookmarkedSkillIds: string[]`를 `DashboardSkillGrid`에 전달
- 각 카드에 `isBookmarked` boolean 전달

### 5. DashboardLayoutClient 수정 — pathname 기반 activeTab

- 현재: `showMyAgents` useState로 "내 에이전트" 상태 관리 (ComingSoonContent 렌더링)
- 변경: `usePathname()`으로 `/myagent` 여부 판단, `showMyAgents` 상태 제거
- "내 에이전트" 탭은 실제 페이지 이동(`/myagent`) → `ComingSoonContent` 불필요

### 6. DashboardSidebar 수정

- "내 에이전트" 클릭: `router.push('/myagent')` (기존: client state 변경)
- "대시보드" 클릭: `router.push('/dashboard')` (기존과 동일)

## Complexity Tracking

> No violations identified. All principles satisfied.

| Aspect | Decision |
|--------|----------|
| Test Coverage (III) | Waived per spec: "테스트 태스크는 명시적 요청이 없으므로 생략" |
