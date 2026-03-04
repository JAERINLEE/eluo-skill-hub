# Dashboard API Contracts

**Feature**: 015-dashboard-frontend
**Date**: 2026-03-04

이 기능은 REST API 엔드포인트를 노출하지 않는다. Next.js App Router의 Server Components와 Server Actions를 통해 데이터를 주고받는다.

## Server Component Data Flow

### Portal Layout (`(portal)/layout.tsx`)

서버 사이드에서 인증 검증 및 사용자 정보를 조회하여 클라이언트 컴포넌트에 전달한다. `/dashboard`와 `/myagent` 모두 이 레이아웃을 공유한다.

**Input**: 쿠키 기반 Supabase 세션
**Output**:

```typescript
// 인증 실패 시
redirect('/signin')

// 인증 성공 시 → 자식 컴포넌트에 전달
{
  userProfile: UserProfile  // { email: string, displayName: string }
  categories: CategoryItem[] // 사이드바 카테고리 목록
}
```

### Dashboard Page (`/dashboard` page.tsx)

서버 사이드에서 URL searchParams를 읽어 스킬 목록을 조회한다. 북마크 상태도 함께 조회한다.

**Input (searchParams)**:

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| q | string | (없음) | 검색 키워드 |
| limit | number | 9 | 표시할 스킬 수 (9의 배수) |
| category | string | (없음) | 카테고리 ID (uuid) |

**Output**:

```typescript
{
  skills: DashboardSkillCard[]  // 스킬 카드 목록
  totalCount: number            // 전체 스킬 수
  hasMore: boolean              // 추가 로드 가능 여부
  bookmarkedSkillIds: string[]  // 현재 사용자의 북마크된 스킬 ID 목록
}
```

### MyAgent Page (`/myagent` page.tsx)

서버 사이드에서 현재 사용자의 북마크된 스킬 목록을 조회한다.

**Input**: 없음 (인증된 사용자 기반)
**Output**:

```typescript
{
  skills: DashboardSkillCard[]  // 북마크된 스킬 카드 목록
}
```

## Server Actions

### signOut

**Location**: `src/app/(portal)/dashboard/actions.ts`
**Input**: 없음
**Output**: `/signin`으로 리다이렉트
**Side Effects**: Supabase 세션 종료

### toggleBookmark

**Location**: `src/app/(portal)/dashboard/actions.ts`
**Input**:

```typescript
{
  skillId: string  // 북마크 토글할 스킬 ID
}
```

**Output**:

```typescript
{
  bookmarked: boolean  // 토글 후 상태 (true = 북마크됨, false = 해제됨)
}
```

**Side Effects**:
- bookmarks 테이블에 INSERT 또는 DELETE
- `revalidatePath('/dashboard')` 및 `revalidatePath('/myagent')` 호출

**Error Handling**:
- 미인증 시: 에러 throw
- 이미 존재/미존재 시: 정상 처리 (idempotent)

## Repository Interfaces

### DashboardRepository

```typescript
interface DashboardRepository {
  getPublishedSkills(
    limit: number,
    search?: string,
    categoryId?: string
  ): Promise<DashboardSkillsResult>

  getCategories(): Promise<CategoryItem[]>
}
```

### BookmarkRepository

```typescript
interface BookmarkRepository {
  getBookmarkedSkillIds(userId: string): Promise<string[]>
  getBookmarkedSkills(userId: string): Promise<DashboardSkillCard[]>
  addBookmark(userId: string, skillId: string): Promise<void>
  removeBookmark(userId: string, skillId: string): Promise<void>
  isBookmarked(userId: string, skillId: string): Promise<boolean>
}
```

## Component Props Contracts

### DashboardSidebar

```typescript
interface DashboardSidebarProps {
  categories: CategoryItem[]
  activeTab: SidebarTab
  onTabChange: (tab: SidebarTab) => void
}
```

### DashboardHeader

```typescript
interface DashboardHeaderProps {
  breadcrumb: string
  userProfile: UserProfile
}
```

### DashboardSkillGrid

```typescript
interface DashboardSkillGridProps {
  skills: DashboardSkillCard[]
  totalCount: number
  hasMore: boolean
  searchQuery?: string
  categoryId?: string
  currentLimit: number
  bookmarkedSkillIds?: string[]  // 북마크 상태 (신규)
}
```

### DashboardSkillCard

```typescript
interface DashboardSkillCardProps {
  skill: DashboardSkillCard
  isBookmarked?: boolean      // 북마크 여부 (신규)
}
```

### BookmarkButton

```typescript
interface BookmarkButtonProps {
  skillId: string
  isBookmarked: boolean
}
```

### ProfileDropdown

```typescript
interface ProfileDropdownProps {
  userProfile: UserProfile
}
```
