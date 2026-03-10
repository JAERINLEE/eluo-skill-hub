# Data Model: 어드민 피드백 관리 페이지

## Existing Entities (No Schema Changes)

### skill_feedback_logs

피드백 로그. 스키마 변경 없이 기존 테이블 사용.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | 피드백 고유 ID |
| user_id | uuid | FK → auth.users.id | 피드백 작성자 |
| skill_id | uuid | FK → skills.id | 대상 스킬 |
| rating | integer | nullable, CHECK 1~5 | 평점 |
| comment | text | nullable | 코멘트 |
| is_secret | boolean | default false | 비밀글 여부 |
| deleted_at | timestamptz | nullable | 소프트 삭제 |
| created_at | timestamptz | default now() | 작성일 |

### feedback_replies

피드백 댓글. 스키마 변경 없이 기존 테이블 사용.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK, default gen_random_uuid() | 댓글 고유 ID |
| feedback_id | uuid | FK → skill_feedback_logs.id | 부모 피드백 |
| user_id | uuid | FK → auth.users.id | 댓글 작성자 |
| content | text | CHECK char_length > 0 | 댓글 내용 |
| created_at | timestamptz | default now() | 작성일 |

## Domain Types (TypeScript)

### FeedbackRow 확장

기존 `FeedbackRow`에 필드 추가:

```typescript
export interface FeedbackRow {
  readonly id: string;
  readonly rating: number;
  readonly comment: string | null;
  readonly userName: string;
  readonly skillTitle: string;
  readonly isSecret: boolean;       // 추가
  readonly replyCount: number;      // 추가
  readonly createdAt: string;
}
```

### FeedbackReplyRow (신규)

```typescript
export interface FeedbackReplyRow {
  readonly id: string;
  readonly feedbackId: string;
  readonly userName: string;
  readonly content: string;
  readonly createdAt: string;
}
```

### CreateFeedbackReplyInput (신규)

```typescript
export interface CreateFeedbackReplyInput {
  readonly feedbackId: string;
  readonly content: string;
}
```

### CreateFeedbackReplyResult (신규)

```typescript
export type CreateFeedbackReplyResult =
  | { success: true }
  | { success: false; error: string };
```

## Relationships

```text
skills (1) ──── (N) skill_feedback_logs (1) ──── (N) feedback_replies
                         │                                │
                         └── FK: user_id → auth.users     └── FK: user_id → auth.users
                         └── FK: skill_id → skills        └── FK: feedback_id → skill_feedback_logs
```

## Repository Interface Extensions

`AdminRepository`에 추가할 메서드:

```typescript
getFeedbackReplies(feedbackId: string): Promise<FeedbackReplyRow[]>;
createFeedbackReply(userId: string, input: CreateFeedbackReplyInput): Promise<CreateFeedbackReplyResult>;
```

## Query Patterns

### 피드백 목록 (확장)

기존 쿼리에 `is_secret` 필드 추가 및 `feedback_replies` 카운트 조인:

```sql
SELECT
  f.id, f.rating, f.comment, f.is_secret, f.created_at,
  p.email AS user_email,
  s.title AS skill_title,
  (SELECT COUNT(*) FROM feedback_replies r WHERE r.feedback_id = f.id) AS reply_count
FROM skill_feedback_logs f
JOIN profiles p ON p.id = f.user_id
JOIN skills s ON s.id = f.skill_id
WHERE f.deleted_at IS NULL
ORDER BY f.created_at DESC
LIMIT :pageSize OFFSET :offset
```

### 댓글 조회

```sql
SELECT r.id, r.content, r.created_at, p.email AS user_email
FROM feedback_replies r
JOIN profiles p ON p.id = r.user_id
WHERE r.feedback_id = :feedbackId
ORDER BY r.created_at DESC
```

### 댓글 작성

```sql
INSERT INTO feedback_replies (feedback_id, user_id, content)
VALUES (:feedbackId, :userId, :content)
```
