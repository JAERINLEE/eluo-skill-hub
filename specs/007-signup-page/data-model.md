# Data Model: 007-signup-page

**Date**: 2026-03-04

## Entity Changes

### SignupCredentials (수정 — 이전 이터레이션에서 완료)

기존 `SignupCredentials` 인터페이스에 `name` 필드가 추가되어 있다.

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string (readonly) | ✅ | 사용자 이메일 (eluocnc.com 도메인) |
| password | string (readonly) | ✅ | 비밀번호 (8자 이상) |
| name | string (readonly) | ✅ | 사용자 이름 (표시명) |

### SignupActionState (수정 — 이번 이터레이션)

`step` 필드에 `"duplicate"` 리터럴을 추가한다.

| Field | Type | Description |
|-------|------|-------------|
| `error` | `string` | 오류 메시지 (빈 문자열 = 오류 없음) |
| `step` | `"form" \| "verify" \| "duplicate"` | 현재 UI 단계 (**`"duplicate"` 추가**) |
| `email` | `string` | 인증 대상 이메일 (verify 단계에서 사용) |

### Supabase auth.users.raw_user_meta_data (변경 없음)

Supabase signUp 시 `options.data`로 전달되어 `raw_user_meta_data`에 저장된다.

| Key | Type | Description |
|-----|------|-------------|
| display_name | string | 사용자가 입력한 이름 |

### SignupResult (변경 없음)

| Variant | Fields | Description |
|---------|--------|-------------|
| 성공 | `{ success: true }` | 신규 가입 성공, OTP 발송됨 |
| 대기 | `{ success: "pending" }` | 미인증 기존 계정, OTP 재발송됨 |
| 실패 | `{ success: false; error: string }` | 인증 완료 중복 또는 기타 오류 |

### AuthRepository (변경 없음)

기존 `signUp()` 메서드의 반환 타입 `SignupResult`는 이미 `"pending"` / `false` 분기를 지원하므로 변경 불필요.

## State Transitions

```
               ┌──────────────────────────────────────────┐
               │                                          │
"form" ──(제출)──→ 성공 ──→ "verify" ──(OTP확인)──→ /dashboard
               │
               ├── 인증완료 중복 이메일 ──→ "duplicate"
               │                              │
               │                              ├── "로그인으로 이동" → /signin
               │                              └── "다른 이메일로 가입" → "form" (초기화)
               │
               ├── 미인증 중복 이메일 ──→ "verify" (OTP 재발송)
               │
               └── 기타 오류 ──→ "form" (에러 메시지 표시)
```

## Validation Rules

| Field | Rule | Layer | Error Message |
|-------|------|-------|---------------|
| name | 빈 문자열 불가, 공백 trim 후 1자 이상 | Client + Server | "이름을 입력해 주세요" |
| email | 유효한 이메일 형식 + eluocnc.com 도메인 | Client + Server | "이메일을 입력해 주세요" / "eluocnc.com 이메일만 사용할 수 있습니다" |
| password | 8자 이상 | Client + Server | "비밀번호는 최소 8자 이상이어야 합니다" |
| confirmPassword | password와 일치 (클라이언트 전용) | Client only | "비밀번호가 일치하지 않습니다" |
| 중복 이메일 | identities 빈 배열 + email_confirmed_at 존재 | Server (Supabase) | "이미 가입된 이메일입니다" |

## Database Changes

**변경 없음**. 이번 기능은 순수 프론트엔드/서버 액션 로직 변경이며, Supabase 테이블 스키마 변경이 불필요하다.
