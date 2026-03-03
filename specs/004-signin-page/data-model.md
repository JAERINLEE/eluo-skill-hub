# Data Model: 로그인 페이지 및 로그인 기능

**Feature Branch**: `004-signin-page`
**Date**: 2026-03-03

> 이 피처는 기존 테이블을 그대로 활용하며 스키마 변경이 없다.

## Entities

### Profile (기존)

서비스 사용자를 나타내며, 인증 시스템의 사용자 계정과 1:1로 연결된다.

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | UUID (PK) | NO | — | auth.users의 id를 참조하는 외래 키 |
| email | TEXT | NO | — | 사용자 이메일 주소 |
| created_at | TIMESTAMPTZ | NO | now() | 프로필 생성 시각 |
| role_id | UUID (FK → roles.id) | NO | user 역할 UUID | 사용자의 역할 |

**Constraints**:
- `profiles_pkey`: id (PRIMARY KEY)
- `profiles_id_fkey`: id → auth.users(id) (FOREIGN KEY)
- `profiles_role_id_fkey`: role_id → roles(id) (FOREIGN KEY)

**Auto-creation**: `on_auth_user_created` 트리거가 auth.users INSERT 시 `handle_new_user()` 함수를 실행하여 profiles 레코드를 자동 생성한다.

### Role (기존)

사용자의 권한 수준을 나타낸다.

| Field | Type | Nullable | Default | Description |
|-------|------|----------|---------|-------------|
| id | UUID (PK) | NO | — | 역할 고유 식별자 |
| name | TEXT | NO | — | 역할 이름 (admin, user) |
| description | TEXT | YES | — | 역할 설명 |

**Seed Data**:

| id | name | description |
|----|------|-------------|
| a0000000-0000-0000-0000-000000000001 | admin | 관리자 |
| a0000000-0000-0000-0000-000000000002 | user | 일반 사용자 |

## Relationships

```
auth.users (1) ──── (1) profiles
                         │
                         └── role_id ──── (1) roles
```

- `auth.users` ↔ `profiles`: 1:1 관계. `handle_new_user()` 트리거가 자동 연결.
- `profiles` → `roles`: N:1 관계. 각 프로필은 하나의 역할을 가진다. 기본값은 `user`.

## RLS Policies (기존)

### profiles

| Policy Name | Permission | Command | Condition |
|------------|------------|---------|-----------|
| Users can view own profile | PERMISSIVE | SELECT | auth.uid() = id |
| Users can update own profile | PERMISSIVE | UPDATE | auth.uid() = id |
| Admins can view all profiles | PERMISSIVE | SELECT | is_admin(auth.uid()) |
| Admins can update user roles | PERMISSIVE | UPDATE | is_admin(auth.uid()) |

### roles

| Policy Name | Permission | Command | Condition |
|------------|------------|---------|-----------|
| Authenticated users can view roles | PERMISSIVE | SELECT | true |

## Helper Functions (기존)

### is_admin(check_user_id UUID) → BOOLEAN

profiles와 roles를 조인하여 해당 사용자가 admin 역할인지 확인한다.

### handle_new_user() → TRIGGER

auth.users에 새 사용자가 INSERT될 때 실행. `profiles` 테이블에 id, email, 기본 user role_id로 레코드를 자동 생성한다.

## Schema Changes Required

**없음** — 기존 스키마가 로그인 기능 요구사항을 완전히 충족한다.
