# Data Model: 스킬 팝업 렌더링 최적화

**Branch**: `018-skill-popup-optimization` | **Date**: 2026-03-04

> 이 피처는 기존 데이터 모델을 변경하지 않습니다. 아래는 최적화 대상인 기존 엔티티와 쿼리 패턴을 문서화한 것입니다.

## Entities (기존, 변경 없음)

### Skill
- `id` (PK, UUID)
- `title` (string)
- `icon` (string)
- `description` (string, nullable)
- `markdown_content` (text, nullable)
- `updated_at` (timestamp)
- `author_id` (FK → auth.users)
- `category_id` (FK → categories)

### Category
- `id` (PK)
- `name` (string)
- `icon` (string)

### Profile
- `id` (PK, FK → auth.users)
- `name` (string)
- `role_id` (FK → roles)

### SkillTemplate
- `id` (PK, UUID)
- `skill_id` (FK → skills)
- `file_name` (string)
- `file_path` (string)
- `file_size` (number)
- `file_type` (string)
- `created_at` (timestamp)

### SkillFeedbackLog
- `id` (PK, UUID)
- `skill_id` (FK → skills)
- `user_id` (FK → auth.users)
- `rating` (integer, 1-5)
- `comment` (text, nullable)
- `created_at` (timestamp)

### FeedbackReply
- `id` (PK, UUID)
- `feedback_id` (FK → skill_feedback_logs)
- `user_id` (FK → auth.users)
- `content` (text)
- `created_at` (timestamp)

## Query Pattern Changes

### Before: `getSkillDetailPopup` (Sequential)

```
skill 조회 (categories join)     ~30ms
  → author profile 조회           ~20ms
    → templates 조회              ~20ms
      → feedback stats 조회       ~20ms
                            Total: ~90ms (sequential)
```

### After: `getSkillDetailPopup` (Parallelized)

```
skill 조회 (categories join)     ~30ms
  → Promise.all([
       author profile 조회,       ~20ms ┐
       templates 조회,             ~20ms ├ parallel
       feedback stats 조회         ~20ms ┘
     ])
                            Total: ~50ms (30 + max(20,20,20))
```

### Before: `getFeedbacksWithReplies` (Sequential)

```
feedbacks 조회 (all, no limit)   ~30ms
  → replies 조회                  ~20ms
    → profiles 조회               ~20ms
                            Total: ~70ms (sequential)
```

### After: `getFeedbacksWithReplies` (Optimized)

```
feedbacks 조회 (.limit(20))      ~20ms
  → Promise.all([
       replies 조회,              ~20ms ┐ parallel
       feedback profiles 조회     ~15ms ┘
     ])
  → reply profiles 추가 조회      ~15ms (필요 시)
                            Total: ~55ms (20 + max(20,15) + 15)
```

## Domain Type Changes

### 신규 타입 (피드백 페이지네이션 지원)

```typescript
interface PaginatedFeedbacks {
  readonly feedbacks: FeedbackWithReplies[];
  readonly totalCount: number;
  readonly hasMore: boolean;
}
```

### 기존 타입 변경 없음
- `SkillDetailPopup` — 변경 없음
- `FeedbackWithReplies` — 변경 없음
- `FeedbackReply` — 변경 없음
