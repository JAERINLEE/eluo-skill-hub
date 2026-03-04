# Data Model: 대시보드 프론트엔드 구현

**Feature**: 015-dashboard-frontend
**Date**: 2026-03-04

## 기존 테이블 (변경 없음, 읽기 전용)

이 기능은 신규 테이블을 생성하지 않는다. 기존 테이블을 읽기 전용으로 조회한다.

### skills

| Field | Type | Description |
|-------|------|-------------|
| id | uuid (PK) | 스킬 고유 식별자 |
| title | text | 스킬 제목 |
| description | text (nullable) | 스킬 설명 |
| icon | text | 스킬 아이콘 (이모지) |
| status | text | 'published' 또는 'drafted' |
| category_id | uuid (FK → categories.id) | 카테고리 참조 |
| created_at | timestamptz | 생성일시 |
| updated_at | timestamptz | 수정일시 |

**Dashboard 조회 조건**: `status = 'published'` 필터 고정, `created_at DESC` 정렬

### categories

| Field | Type | Description |
|-------|------|-------------|
| id | uuid (PK) | 카테고리 고유 식별자 |
| name | text | 카테고리 이름 |
| icon | text | lucide-react 아이콘 이름 |
| sort_order | integer | 정렬 순서 |

**Dashboard 사용**: 사이드바 카테고리 목록, 스킬 카드 카테고리 태그

### profiles (via auth.users)

| Field | Type | Description |
|-------|------|-------------|
| id | uuid (PK, FK → auth.users.id) | 사용자 고유 식별자 |
| email | text | 이메일 |
| name | text (nullable) | 표시 이름 |

**Dashboard 사용**: 프로필 드롭다운에 이메일, 이름 표시. `auth.users.user_metadata.display_name`도 폴백으로 활용.

## 신규 테이블

### bookmarks

사용자-스킬 간 북마크 관계를 저장한다.

| Field | Type | Description |
|-------|------|-------------|
| id | uuid (PK, DEFAULT gen_random_uuid()) | 북마크 고유 식별자 |
| user_id | uuid (FK → auth.users.id, ON DELETE CASCADE) | 사용자 참조 |
| skill_id | uuid (FK → skills.id, ON DELETE CASCADE) | 스킬 참조 |
| created_at | timestamptz (DEFAULT now()) | 생성일시 |

**제약 조건**:
- `UNIQUE(user_id, skill_id)` — 동일 사용자가 같은 스킬을 중복 북마크 방지
- `ON DELETE CASCADE` — 사용자 또는 스킬 삭제 시 관련 북마크 자동 삭제

**RLS 정책**:
- `SELECT`: `auth.uid() = user_id` (자신의 북마크만 조회)
- `INSERT`: `auth.uid() = user_id` (자신의 북마크만 생성)
- `DELETE`: `auth.uid() = user_id` (자신의 북마크만 삭제)
- `UPDATE`: 정책 없음 (북마크는 토글 방식으로 INSERT/DELETE만 사용)

## Domain Types (신규)

### DashboardSkillCard

스킬 카드 그리드에 표시할 스킬 정보.

```
DashboardSkillCard {
  id: string
  title: string
  description: string | null
  icon: string
  categoryName: string
  categoryIcon: string
  createdAt: string
}
```

### DashboardSkillsResult

페이지네이션된 스킬 목록 결과.

```
DashboardSkillsResult {
  skills: DashboardSkillCard[]
  totalCount: number
  hasMore: boolean
}
```

### CategoryItem

사이드바에 표시할 카테고리 항목.

```
CategoryItem {
  id: string
  name: string
  icon: string
}
```

### UserProfile

프로필 드롭다운에 표시할 사용자 정보.

```
UserProfile {
  email: string
  displayName: string
}
```

### SidebarTab

사이드바 활성 탭 상태.

```
SidebarTab = 'dashboard' | 'my-agents' | { type: 'category'; categoryId: string; categoryName: string }
```

### BookmarkRepository (신규 인터페이스)

```
BookmarkRepository {
  getBookmarkedSkillIds(userId: string): Promise<string[]>
  getBookmarkedSkills(userId: string): Promise<DashboardSkillCard[]>
  addBookmark(userId: string, skillId: string): Promise<void>
  removeBookmark(userId: string, skillId: string): Promise<void>
  isBookmarked(userId: string, skillId: string): Promise<boolean>
}
```

## Entity Relationships

```
skills ──── N:1 ──── categories
  │
  ├── (status = 'published' 필터)
  │
  └── N:M ──── auth.users (via bookmarks)

bookmarks ──── N:1 ──── skills
bookmarks ──── N:1 ──── auth.users

profiles ──── 1:1 ──── auth.users
```

## Query Patterns

### 1. 스킬 목록 조회 (페이지네이션 + 검색 + 카테고리 필터)

```
SELECT skills.id, title, description, icon, created_at,
       categories.name as category_name, categories.icon as category_icon
FROM skills
JOIN categories ON skills.category_id = categories.id
WHERE status = 'published'
  [AND (title ILIKE '%search%' OR description ILIKE '%search%')]
  [AND category_id = :categoryId]
ORDER BY created_at DESC
LIMIT :limit
```

- `count: 'exact'` 옵션으로 총 개수도 함께 조회 (hasMore 판단용)

### 2. 카테고리 목록 조회

```
SELECT id, name, icon
FROM categories
ORDER BY sort_order ASC
```

### 3. 사용자 프로필 조회

```
-- layout.tsx에서 supabase.auth.getUser()로 인증 확인
-- user.email, user.user_metadata.display_name 사용
-- 필요 시 profiles 테이블에서 name 조회
```

### 4. 사용자 북마크 스킬 ID 목록 조회

```
SELECT skill_id
FROM bookmarks
WHERE user_id = :userId
```

- 대시보드 page.tsx에서 호출하여 각 카드의 `isBookmarked` 상태 결정

### 5. 북마크된 스킬 목록 조회 (내 에이전트 페이지)

```
SELECT skills.id, title, description, icon, skills.created_at,
       categories.name as category_name, categories.icon as category_icon
FROM bookmarks
JOIN skills ON bookmarks.skill_id = skills.id
JOIN categories ON skills.category_id = categories.id
WHERE bookmarks.user_id = :userId
  AND skills.status = 'published'
ORDER BY bookmarks.created_at DESC
```

### 6. 북마크 토글

```
-- 추가
INSERT INTO bookmarks (user_id, skill_id)
VALUES (:userId, :skillId)

-- 삭제
DELETE FROM bookmarks
WHERE user_id = :userId AND skill_id = :skillId
```
