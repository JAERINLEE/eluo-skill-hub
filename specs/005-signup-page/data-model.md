# Data Model: 005-signup-page

**Created**: 2026-03-03
**Status**: Complete

## Entities

### auth.users (기존 - Supabase Auth 관리)

Supabase Auth가 관리하는 사용자 인증 테이블. 직접 수정하지 않으며, `signUp()` / `verifyOtp()` API로만 조작한다.

| Field | Type | Constraint | Description |
|-------|------|------------|-------------|
| id | uuid | PK | 사용자 고유 식별자 |
| email | varchar | unique | 이메일 주소 |
| encrypted_password | varchar | not null | 암호화된 비밀번호 |
| email_confirmed_at | timestamptz | nullable | 이메일 인증 완료 시각 (null이면 미인증) |
| created_at | timestamptz | not null | 계정 생성 시각 |

### public.profiles (기존 - 변경 없음)

사용자 프로필 정보. `handle_new_user` 트리거로 `auth.users` INSERT 시 자동 생성.

| Field | Type | Constraint | Default | Description |
|-------|------|------------|---------|-------------|
| id | uuid | PK, FK(auth.users.id) | - | 사용자 ID |
| email | text | not null | - | 이메일 주소 |
| role_id | uuid | FK(public.roles.id) | user 역할 ID | 사용자 역할 |
| created_at | timestamptz | not null | now() | 생성 시각 |

### public.roles (기존 - 변경 없음)

사용자 역할 정의.

| Field | Type | Constraint | Description |
|-------|------|------------|-------------|
| id | uuid | PK | 역할 ID |
| name | text | unique | 역할명 (admin, user) |
| description | text | nullable | 역할 설명 |

**현재 데이터**:
- `a0000000-0000-0000-0000-000000000001` → admin (관리자)
- `a0000000-0000-0000-0000-000000000002` → user (일반 사용자)

## Relationships

```
auth.users (1) ──── (1) public.profiles
                         │
                         └── FK(role_id) → public.roles
```

## Database Trigger (기존 - 변경 없음)

```sql
-- on_auth_user_created trigger
-- auth.users INSERT 시 자동 실행
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role_id, created_at)
  VALUES (
    NEW.id,
    NEW.email,
    (SELECT id FROM public.roles WHERE name = 'user'),
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## Validation Rules

| Entity | Field | Rule | Source |
|--------|-------|------|--------|
| User | email | `@eluocnc.com` 도메인만 허용 (대소문자 무시) | FR-003 |
| User | password | 최소 8자 이상 | FR-004 |
| OTP | token | 숫자 8자리 | FR-006 |
| OTP | expiry | 발송 후 10분 유효 | FR-006 |

## State Transitions

```
[미가입] → signUp() → [가입됨, 미인증] → verifyOtp() → [가입됨, 인증완료]
                        (email_confirmed_at = null)      (email_confirmed_at = timestamp)
                        (profiles 생성됨)                 (로그인 가능)
```

## Schema Changes Required

**없음** — 기존 테이블과 트리거로 모든 요구사항을 충족한다.
