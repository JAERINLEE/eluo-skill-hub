# Quickstart: 대시보드 프론트엔드 구현

**Feature**: 015-dashboard-frontend
**Date**: 2026-03-04

## Prerequisites

- Node.js 18+
- 프로젝트 루트에서 `npm install` 완료
- `.env.local`에 Supabase 환경변수 설정 완료
- Supabase에 `skills`, `categories`, `profiles` 테이블 및 데이터 존재
- Supabase에 `bookmarks` 테이블 생성 및 RLS 정책 설정 완료

## Development

```bash
# 개발 서버 실행
npm run dev

# 브라우저에서 확인
open http://localhost:3000/dashboard
open http://localhost:3000/myagent
```

## 구현 순서

### Phase 1: 기존 구현 (완료)

1. **Dashboard Domain** (`src/dashboard/`) — 타입, 리포지토리, 유스케이스
2. **Dashboard Layout** (`src/app/dashboard/layout.tsx`) — 인증 + 레이아웃
3. **UI Components** (`src/features/dashboard/`) — 사이드바, 헤더, 스킬 카드/그리드, 검색, 프로필
4. **Dashboard Page** (`src/app/dashboard/page.tsx`) — 서버 컴포넌트

### Phase 2: 북마크 & 내 에이전트 (신규)

1. **DB 마이그레이션** — `bookmarks` 테이블 생성 (Supabase MCP)
2. **Route Group 재구조화** — `src/app/(portal)/` 도입, 공유 레이아웃
3. **Bookmark Domain** (`src/bookmark/`) — 타입, 리포지토리, 유스케이스
4. **BookmarkButton** (`src/features/bookmark/BookmarkButton.tsx`) — 토글 버튼 (client)
5. **toggleBookmark Server Action** — INSERT/DELETE + revalidatePath
6. **DashboardSkillCard 수정** — BookmarkButton 추가
7. **DashboardPage 수정** — 북마크 상태 프리페치
8. **MyAgent Page** (`src/app/(portal)/myagent/page.tsx`) — 북마크된 스킬 그리드
9. **Sidebar 수정** — "내 에이전트" 클릭 시 `/myagent`로 이동

## Testing

```bash
# 단위 테스트
npx jest --testPathPattern="(dashboard|bookmark)"

# E2E 테스트
npx playwright test --grep "(dashboard|myagent)"
```

## Key Files

| File | Purpose |
|------|---------|
| `src/dashboard/domain/types.ts` | 대시보드 도메인 타입 및 리포지토리 인터페이스 |
| `src/dashboard/infrastructure/supabase-dashboard-repository.ts` | 대시보드 Supabase 데이터 액세스 |
| `src/bookmark/domain/types.ts` | 북마크 도메인 타입 및 리포지토리 인터페이스 |
| `src/bookmark/infrastructure/supabase-bookmark-repository.ts` | 북마크 Supabase 데이터 액세스 |
| `src/app/(portal)/layout.tsx` | 공유 인증 가드 + 레이아웃 |
| `src/app/(portal)/dashboard/page.tsx` | 대시보드 페이지 (서버 컴포넌트) |
| `src/app/(portal)/dashboard/actions.ts` | 서버 액션 (로그아웃 + 북마크 토글) |
| `src/app/(portal)/myagent/page.tsx` | 내 에이전트 페이지 (서버 컴포넌트) |
| `src/features/dashboard/` | 대시보드 UI 컴포넌트 |
| `src/features/bookmark/BookmarkButton.tsx` | 북마크 토글 버튼 |
| `stitch-html/dashboard.html` | 디자인 참조 (HTML 프로토타입) |
