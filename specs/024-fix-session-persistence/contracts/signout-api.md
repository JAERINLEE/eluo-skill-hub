# Contract: /api/auth/signout

## Route Handler

**Method**: POST
**Path**: `/api/auth/signout`
**Purpose**: `sendBeacon`에서 호출 가능한 로그아웃 엔드포인트

### Request

- Body: 없음 (sendBeacon은 빈 body 또는 간단한 payload만 지원)
- Cookie: Supabase 세션 쿠키 자동 포함

### Response

| Status | Body | Description |
|--------|------|-------------|
| 200 | `{ "success": true }` | 로그아웃 성공 |
| 401 | `{ "success": false, "error": "No session" }` | 이미 로그아웃 상태 |
| 500 | `{ "success": false, "error": "..." }` | 서버 오류 |

### Side Effects

1. Supabase `auth.signOut()` 호출 → 서버 세션 무효화
2. 세션 쿠키 삭제
