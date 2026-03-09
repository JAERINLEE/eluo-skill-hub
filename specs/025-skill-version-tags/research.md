# Research: 스킬 버전 관리 및 태그 기능

## R-001: 태그 데이터 모델 설계

**Decision**: 전역 `tags` 테이블 + `skill_tags` 조인 테이블 (다대다 관계)

**Rationale**: 동일 태그명을 여러 스킬이 공유해야 하므로 정규화된 다대다 관계가 적합하다. 태그를 별도 테이블로 관리하면 태그 목록 조회, 중복 방지, 태그 기반 필터링이 효율적이다.

**Alternatives considered**:
- JSON 배열로 skills 테이블에 저장: 필터링 쿼리가 복잡하고 비효율적. 태그 전역 관리 불가.
- 비정규화(skill에 직접 태그 텍스트 배열): 태그 기반 집계 및 검색이 어려움.

## R-002: 버전 관리 전략

**Decision**: `skills.version` 컬럼 (현재 버전) + `skill_version_history` 테이블 (이력)

**Rationale**: 현재 버전은 skills 테이블에서 직접 조회하여 성능을 유지하고, 이력은 별도 테이블로 분리하여 무제한 이력 보관이 가능하다. 버전 변경 시 이전 버전을 이력 테이블에 INSERT하고 skills.version을 UPDATE하는 방식.

**Alternatives considered**:
- 이력 테이블만 사용하고 최신 레코드를 현재 버전으로 사용: 매번 MAX 쿼리 필요, 성능 저하.
- JSON 배열로 이력 저장: 이력 조회 및 정렬이 복잡.

## R-003: 태그 입력 UX 패턴

**Decision**: Enter/쉼표로 태그 추가, 칩(chip) UI로 표시, X 버튼으로 삭제

**Rationale**: 웹 애플리케이션에서 가장 널리 사용되는 태그 입력 패턴으로 사용자 학습 비용이 낮다. '#' 접두사는 입력 시 자동 제거하고 표시 시에만 붙여 일관성 유지.

**Alternatives considered**:
- 드롭다운 자동완성: 기존 태그 재사용에 유리하나 초기 구현 복잡도가 높음. 향후 개선 사항으로 고려.
- 자유 텍스트 + 파싱: 태그 구분이 모호해질 수 있음.

## R-004: 기존 스킬 마이그레이션 전략

**Decision**: `skills.version` 컬럼 추가 시 기본값 '1.0.0' 설정. 기존 12개 스킬 자동 적용.

**Rationale**: 기존 스킬에 버전이 없으므로 합리적인 초기값이 필요하다. '1.0.0'은 시맨틱 버저닝의 표준 초기 릴리스 번호이다. 마이그레이션은 ALTER TABLE DEFAULT로 처리하여 별도 데이터 이동 불필요.

**Alternatives considered**:
- NULL 허용: 프론트엔드에서 분기 처리 필요, UX 일관성 저하.
- '0.0.0' 또는 빈 문자열: 의미 전달이 불명확.

## R-005: RLS 정책 설계

**Decision**:
- `tags`: 모든 인증 사용자 SELECT 가능, INSERT/UPDATE/DELETE는 관리자만
- `skill_tags`: 모든 인증 사용자 SELECT 가능, INSERT/DELETE는 관리자만
- `skill_version_history`: 모든 인증 사용자 SELECT 가능, INSERT는 관리자만

**Rationale**: 태그와 버전 정보는 대시보드에서 일반 사용자도 볼 수 있어야 하므로 SELECT는 인증 사용자 전체에 개방. 데이터 변경은 관리자만 가능하도록 제한하여 무결성 보장.

## R-006: 태그 필터링 방식 (대시보드)

**Decision**: URL 쿼리 파라미터(`?tag=마케팅`)로 태그 필터 전달, 기존 카테고리/검색 필터와 병합

**Rationale**: 기존 대시보드의 카테고리 필터와 검색이 쿼리 파라미터 기반으로 동작하므로 동일 패턴을 따른다. 태그 클릭 시 해당 태그로 필터링된 대시보드를 표시.

**Alternatives considered**:
- 클라이언트 사이드 필터링: 전체 데이터 로드 필요, 스킬 수가 늘어나면 비효율적.
- 별도 태그 검색 페이지: 기존 대시보드 UX와 분리되어 사용자 혼란.
