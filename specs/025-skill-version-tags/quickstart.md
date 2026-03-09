# Quickstart: 스킬 버전 관리 및 태그 기능

## 구현 순서 개요

### 1단계: DB 마이그레이션
- `skills.version` 컬럼 추가 (DEFAULT '1.0.0')
- `tags`, `skill_tags`, `skill_version_history` 테이블 생성
- RLS 정책 및 인덱스 적용

### 2단계: 도메인 타입 확장
- `CreateSkillInput`, `UpdateSkillInput`에 version, tags 필드 추가
- `SkillDetail`, `SkillRow`에 version, tags 필드 추가
- `DashboardSkillCard`, `SkillDetailPopup`에 version, tags 필드 추가

### 3단계: Repository 계층 수정
- admin repository: 스킬 생성/수정 시 태그 및 버전 이력 처리
- dashboard repository: 태그 조인 쿼리 추가, 태그 필터링 지원
- skill-detail repository: 태그/버전 조인 쿼리 추가
- bookmark repository: 태그 조인 쿼리 추가

### 4단계: Server Actions 수정
- `createSkill`, `updateSkill` actions에 version, tags FormData 파싱 추가

### 5단계: UI 컴포넌트 구현
- `TagInput` 컴포넌트 (태그 칩 입력)
- `tag-chip` 공유 컴포넌트 (태그 표시)
- `VersionHistoryList` 컴포넌트 (버전 이력 표시)
- `SkillAddForm`에 버전/태그 필드 통합
- 대시보드 카드, 상세 팝업에 태그/버전 표시

### 6단계: 태그 필터링
- 대시보드 쿼리에 tag 파라미터 지원
- 태그 클릭 시 필터 적용 UI

### 7단계: 테스트
- E2E: 스킬 추가/수정 시 버전/태그 입력 및 저장
- E2E: 대시보드 태그 표시 및 필터링

## 핵심 패턴

### 태그 저장 흐름
1. 프론트엔드에서 태그 배열(`string[]`) 전송
2. Server Action에서 FormData 파싱
3. Repository에서 `tags` 테이블에 UPSERT (이름 기준)
4. `skill_tags` 조인 레코드 생성 (기존 것 삭제 후 재생성)

### 버전 이력 흐름
1. 스킬 수정 시 기존 버전 번호를 `skill_version_history`에 INSERT
2. `skills.version`을 새 버전으로 UPDATE

### 태그 조회 패턴
- Supabase join: `skills(id, ..., skill_tags(tags(name)))`
- 중첩 조인 결과를 flat한 `string[]`로 매핑
