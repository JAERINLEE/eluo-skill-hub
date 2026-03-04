# Research: 스킬 팝업 렌더링 최적화

**Branch**: `018-skill-popup-optimization` | **Date**: 2026-03-04

## R-001: 순차 쿼리 병렬화 전략

**Decision**: `getSkillDetailPopup`에서 skill 기본 조회 이후 author profile, templates, feedback stats 3개 쿼리를 `Promise.all`로 병렬 실행한다.

**Rationale**: 현재 4개 쿼리가 완전히 순차적으로 실행됨. skill 조회(author_id 필요)만 선행하면 나머지 3개는 독립적이므로 병렬화 가능. 예상 절감: ~60-100ms (3개 쿼리 중 최대 지연만 소요).

**Alternatives considered**:
- SQL view/function으로 단일 쿼리화 → Supabase RPC 복잡성 증가, RLS 적용이 어려워질 수 있음
- Join으로 모든 데이터를 한 번에 가져오기 → templates/feedbacks는 다대일 관계라 join 시 데이터 중복 발생

## R-002: 피드백 쿼리 최적화 전략

**Decision**: `getFeedbacksWithReplies`에서 feedbacks 조회 후 replies와 profiles를 `Promise.all`로 병렬 실행하고, 피드백 초기 조회를 `.limit(20)`으로 제한한다.

**Rationale**: 현재 feedbacks → replies → profiles 3단계 waterfall. feedbackIds가 필요한 replies 조회는 feedbacks 이후 실행이 불가피하지만, replies와 profiles 조회(feedbackUserIds 기반)는 병렬화 가능. replies의 user_id는 추후 별도 조회 또는 profileMap에 추가.

**Alternatives considered**:
- 피드백 전체를 한번에 가져오되 클라이언트에서 가상 스크롤 → 서버 부하 감소 효과 없음
- GraphQL 도입 → 과도한 변경, 현재 스택에 맞지 않음

## R-003: 마크다운 라이브러리 최적화 전략

**Decision**: `NotionStyleMarkdown` 컴포넌트를 `React.lazy` + `Suspense`로 지연 로딩하고, `rehypeHighlight` 플러그인을 코드 블록 존재 시에만 조건부 적용한다.

**Rationale**: react-markdown + remark-gfm + rehype-sanitize + rehype-highlight 합산 번들이 ~50-70KB(gzip ~20KB). SkillDetailModal은 이미 `next/dynamic`으로 지연 로딩되므로 그 내부의 마크다운 컴포넌트도 자동으로 코드 스플릿됨. 추가로 `rehypeHighlight`는 코드 블록이 없는 마크다운에서는 불필요한 처리 오버헤드만 발생.

**Alternatives considered**:
- 서버사이드 마크다운 렌더링 (HTML 문자열 전송) → CSR과의 hydration 이슈, 보안 검증 필요
- 가벼운 마크다운 파서(marked 등)로 교체 → 기존 커스텀 컴포넌트 재작업 필요, remark/rehype 생태계 장점 포기

## R-004: 중복 요청 방지 전략

**Decision**: `useEffect` 내 `AbortController`를 사용하여 팝업을 닫을 때 진행 중인 요청을 취소하고, `useCallback` 의존성을 올바르게 관리한다.

**Rationale**: 사용자가 팝업을 빠르게 열었다 닫으면 이전 요청의 응답이 새 팝업 상태를 오염시킬 수 있음. AbortController는 브라우저 표준이며 추가 의존성 없이 구현 가능.

**Alternatives considered**:
- React Query/SWR 도입 → 캐싱과 중복 제거에 탁월하지만 이 최적화 범위에서는 과도한 의존성 추가
- 단순 boolean 플래그 → race condition에 취약

## R-005: 피드백 통계 쿼리 최적화

**Decision**: `skill_feedback_logs`에서 모든 rating을 가져와 JS에서 집계하는 대신 Supabase의 집계 기능 또는 `.select('rating.count(), rating.avg()')` 패턴을 활용한다.

**Rationale**: 현재는 모든 rating 행을 가져온 후 JS에서 reduce로 평균 계산. 피드백이 많아질수록 전송 데이터량이 증가. DB 수준 집계가 효율적.

**Alternatives considered**:
- PostgreSQL RPC 함수 → 유지보수 부담 증가
- 별도 rating_summary 테이블 → 스키마 변경 필요, 이 최적화 범위를 초과
