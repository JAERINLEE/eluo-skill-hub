# Data Model: 스킬 버전 관리 및 태그 기능

## Entity Changes

### 기존 테이블 변경: `skills`

| Column | Type | Change | Default | Constraints |
|--------|------|--------|---------|-------------|
| version | text | ADD | '1.0.0' | NOT NULL, max 20 chars |

### 새 테이블: `tags`

태그 전역 풀. 같은 이름의 태그는 하나만 존재.

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| name | text | NO | - | UNIQUE, max 30 chars, CHECK(char_length(name) > 0) |
| created_at | timestamptz | NO | now() | - |

### 새 테이블: `skill_tags`

스킬과 태그의 다대다 관계 조인 테이블.

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| skill_id | uuid | NO | - | FK → skills.id ON DELETE CASCADE |
| tag_id | uuid | NO | - | FK → tags.id ON DELETE CASCADE |
| created_at | timestamptz | NO | now() | - |

**Unique constraint**: (skill_id, tag_id) — 동일 태그 중복 방지

### 새 테이블: `skill_version_history`

스킬 버전 변경 이력. 버전이 변경될 때마다 이전 버전 정보를 기록.

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| id | uuid | NO | gen_random_uuid() | PRIMARY KEY |
| skill_id | uuid | NO | - | FK → skills.id ON DELETE CASCADE |
| version | text | NO | - | max 20 chars |
| changed_at | timestamptz | NO | now() | - |
| note | text | YES | - | 변경 메모 (선택) |

## Relationships

```
skills (1) ──── (*) skill_tags (*) ──── (1) tags
skills (1) ──── (*) skill_version_history
```

- 하나의 스킬에 최대 10개 태그 (애플리케이션 레벨 제한)
- 하나의 태그는 여러 스킬에 공유 가능
- 하나의 스킬에 여러 버전 이력 레코드 존재 가능

## RLS Policies

### tags

| Policy | Operation | Role | Rule |
|--------|-----------|------|------|
| 인증 사용자 조회 | SELECT | authenticated | true |
| 관리자 생성 | INSERT | authenticated | profiles.role_id = admin_role_id |
| 관리자 삭제 | DELETE | authenticated | profiles.role_id = admin_role_id |

### skill_tags

| Policy | Operation | Role | Rule |
|--------|-----------|------|------|
| 인증 사용자 조회 | SELECT | authenticated | true |
| 관리자 생성 | INSERT | authenticated | profiles.role_id = admin_role_id |
| 관리자 삭제 | DELETE | authenticated | profiles.role_id = admin_role_id |

### skill_version_history

| Policy | Operation | Role | Rule |
|--------|-----------|------|------|
| 인증 사용자 조회 | SELECT | authenticated | true |
| 관리자 생성 | INSERT | authenticated | profiles.role_id = admin_role_id |

## Indexes

- `tags.name`: UNIQUE index (이미 UNIQUE constraint로 생성됨)
- `skill_tags.skill_id`: B-tree index (태그 조회 성능)
- `skill_tags.tag_id`: B-tree index (태그 기반 스킬 필터링 성능)
- `skill_version_history.skill_id`: B-tree index (이력 조회 성능)
- `skill_version_history.changed_at`: B-tree index (시간순 정렬)

## Migration Notes

1. `skills` 테이블에 `version` 컬럼 추가 (DEFAULT '1.0.0') → 기존 12개 스킬 자동 적용
2. `tags`, `skill_tags`, `skill_version_history` 테이블 신규 생성
3. RLS 정책 설정
4. 인덱스 생성
