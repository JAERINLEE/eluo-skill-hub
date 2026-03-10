# Quickstart: 어드민 피드백 관리 페이지

## Prerequisites

- Node.js 20+, pnpm
- Supabase 프로젝트 연결 (환경변수 설정)
- 관리자 계정 (admin 역할)

## Development Setup

```bash
# 브랜치 전환
git checkout 028-admin-feedback-management

# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev
```

## Key Files to Modify

### 1. Domain Types (`src/admin/domain/types.ts`)
- `FeedbackRow`에 `isSecret`, `replyCount` 필드 추가
- `FeedbackReplyRow`, `CreateFeedbackReplyInput`, `CreateFeedbackReplyResult` 타입 추가
- `AdminRepository` 인터페이스에 `getFeedbackReplies`, `createFeedbackReply` 메서드 추가

### 2. Infrastructure (`src/admin/infrastructure/supabase-admin-repository.ts`)
- `getFeedbacks` 쿼리 확장: `is_secret` 필드, reply count 서브쿼리 추가
- `getFeedbackReplies` 메서드 구현
- `createFeedbackReply` 메서드 구현

### 3. Application Layer (`src/admin/application/`)
- `GetFeedbackRepliesUseCase` 신규 생성
- `CreateFeedbackReplyUseCase` 신규 생성

### 4. UI Components (`src/features/admin/`)
- `FeedbacksTable.tsx` 확장: 비밀글 뱃지, 댓글 수, 아코디언 토글
- `FeedbackReplies.tsx` 신규: 댓글 목록 컴포넌트
- `FeedbackReplyForm.tsx` 신규: 댓글 작성 폼

### 5. Page & Actions (`src/app/admin/feedbacks/`)
- `page.tsx`: 확장된 데이터 전달
- `actions.ts` 신규: 댓글 조회/작성 Server Actions

### 6. Tests (`src/__tests__/e2e/`)
- `admin-feedback.spec.ts` 신규: 피드백 관리 E2E 테스트

## Verification

```bash
# 타입 체크
npx tsc --noEmit

# E2E 테스트 실행
pnpm exec playwright test admin-feedback

# 페이지 확인
# http://localhost:3000/admin/feedbacks
```

## Architecture Notes

- **데이터 흐름**: Server Component (page.tsx) → FeedbacksTable → 아코디언 열기 → Server Action → FeedbackReplies
- **비밀글 처리**: 어드민 페이지에서는 모든 내용 표시, 대시보드에서는 `is_secret` 기반 클라이언트 필터링
- **DB 변경 없음**: 기존 `skill_feedback_logs`, `feedback_replies` 테이블 그대로 사용
