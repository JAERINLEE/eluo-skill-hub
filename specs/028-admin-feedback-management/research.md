# Research: 어드민 피드백 관리 페이지

## R1: 아코디언 UI 패턴

**Decision**: Shadcn UI Accordion 컴포넌트 (Radix UI 기반) 사용
**Rationale**: 프로젝트 Tech Stack에 이미 Shadcn UI가 포함되어 있고, Radix Accordion은 접근성(aria-expanded, keyboard navigation)을 기본 지원함. 테이블 행 내 아코디언은 Collapsible 패턴으로 구현하여 테이블 구조를 유지.
**Alternatives considered**:
- 직접 구현 (useState + 애니메이션): 접근성 처리 부담 증가, 불필요한 재구현
- framer-motion Accordion: 이미 프로젝트에 framer-motion 있으나 Shadcn이 표준

## R2: 댓글 조회/작성 데이터 로딩 전략

**Decision**: 아코디언 열기 시 on-demand 로딩 (Server Action 호출)
**Rationale**: 피드백 목록 초기 로딩 시 모든 댓글을 함께 가져오면 불필요한 데이터 전송 발생. 아코디언 펼침 시점에 해당 피드백의 댓글만 조회하면 초기 로딩 속도 유지.
**Alternatives considered**:
- 목록과 함께 일괄 로딩: 페이지당 10건 피드백 × N개 댓글로 초기 응답 크기 증가
- TanStack Query 클라이언트 캐싱: 어드민 페이지는 SSR 기반으로 Server Action이 적합

## R3: 댓글 작성 후 갱신 전략

**Decision**: Server Action으로 작성 → revalidatePath 또는 로컬 상태 갱신
**Rationale**: 댓글 작성 후 해당 피드백의 댓글 목록만 다시 조회. Server Action 반환값으로 새 댓글 포함 목록을 돌려주면 추가 요청 없이 UI 갱신 가능.
**Alternatives considered**:
- 전체 페이지 revalidate: 불필요하게 전체 피드백 목록 재조회
- Optimistic update: 복잡도 대비 어드민 페이지에서 필요성 낮음

## R4: 비밀글 댓글 처리 방식

**Decision**: 비밀글 여부는 부모 피드백의 `is_secret` 필드를 상속. 별도의 `is_secret` 컬럼을 `feedback_replies`에 추가하지 않음.
**Rationale**: 요구사항이 "비밀글 피드백에 달린 댓글도 비밀 처리"이므로, 댓글 자체의 비밀 여부가 아닌 부모 피드백의 비밀 상태를 따름. 대시보드에서 피드백 조회 시 `is_secret`이 true인 피드백의 댓글은 작성자 본인과 관리자만 확인 가능하도록 처리.
**Alternatives considered**:
- `feedback_replies`에 `is_secret` 컬럼 추가: 스키마 변경 필요, 부모-자식 비밀 상태 동기화 복잡도 증가
- RLS 정책으로만 제어: RLS만으로는 "비밀글입니다" 플레이스홀더 표시가 어려움 → 클라이언트 렌더링 로직 병행 필요

## R5: FeedbackRow 타입 확장

**Decision**: 기존 `FeedbackRow`에 `isSecret`, `replyCount` 필드 추가
**Rationale**: 테이블에 비밀글 뱃지와 댓글 수 표시가 필요. 기존 타입을 확장하는 것이 새 타입 생성보다 간결. 기존 `getFeedbacks` 쿼리에 조인 추가로 해결.
**Alternatives considered**:
- 별도 `FeedbackWithRepliesRow` 타입: 기존 코드와의 호환성 유지 부담

## R6: 페이지네이션 개선

**Decision**: 기존 FeedbacksTable의 페이지네이션 로직 유지 (URL query param 기반)
**Rationale**: 이미 구현된 페이지네이션 패턴이 동작하며, SSR과 호환됨. 5페이지 이상일 때의 페이지 번호 표시 개선은 별도 이슈로 분리.
**Alternatives considered**:
- 무한 스크롤: 어드민 테이블에는 페이지네이션이 더 적합 (전체 건수 파악 용이)
